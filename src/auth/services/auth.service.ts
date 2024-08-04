// src/auth/services/auth.service.ts
import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  AccessLogRepository,
  AccessTokenRepository,
  RefreshTokenRepository,
  UserRepository,
} from '../repositories';
import { User } from '../entities';
import { BusinessException } from '../../exception';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginResDto } from '../dto';
import { TokenBlacklistService } from './token-blacklist.service';
import { RequestInfo, TokenPayload } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenRepository: AccessTokenRepository,
    private readonly accessLogRepository: AccessLogRepository,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async login(
    email: string,
    plainPassword: string,
    req: RequestInfo,
  ): Promise<LoginResDto> {
    const user = await this.validateUser(email, plainPassword);

    // 기존 액세스 토큰 확인
    const existingAccessToken = await this.accessTokenRepository.findOne({
      where: { user, isRevoked: false },
    });

    if (existingAccessToken) {
      try {
        // 토큰 검증
        await this.jwtService.verifyAsync(existingAccessToken.token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        throw new BusinessException(
          'auth',
          'already-logged-in',
          'User is already logged in',
          HttpStatus.BAD_REQUEST,
        );
      } catch (error) {
        if (error.name !== 'TokenExpiredError') {
          throw error;
        }
        // 토큰이 만료된 경우 계속 진행하여 새로운 토큰 발급
      }
    }

    const payload: TokenPayload = this.createTokenPayload(user.id);

    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(user, payload),
      this.createRefreshToken(user, payload),
    ]);

    const { ip, endpoint, ua } = req;
    await this.accessLogRepository.createAccessLog(user, ua, endpoint, ip);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    let jtiAccess: any;
    let jtiRefresh: any;

    try {
      jtiAccess = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // 토큰이 만료된 경우에도 계속 진행하여 블랙리스트에 추가
        jtiAccess = this.jwtService.decode(accessToken) as any;
      } else {
        throw error;
      }
    }

    try {
      jtiRefresh = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // 토큰이 만료된 경우에도 계속 진행하여 블랙리스트에 추가
        jtiRefresh = this.jwtService.decode(refreshToken) as any;
      } else {
        throw error;
      }
    }

    // 액세스 토큰 블랙리스트 확인
    const isAccessTokenBlacklisted =
      await this.tokenBlacklistService.isTokenBlacklisted(jtiAccess.jti);
    if (isAccessTokenBlacklisted) {
      throw new BusinessException(
        'auth',
        'already-logged-out',
        'User is already logged out',
        HttpStatus.BAD_REQUEST,
      );
    }

    await Promise.all([
      this.addToBlacklist(
        accessToken,
        jtiAccess.jti,
        'access',
        'ACCESS_TOKEN_EXPIRY',
      ),
      this.addToBlacklist(
        refreshToken,
        jtiRefresh.jti,
        'refresh',
        'REFRESH_TOKEN_EXPIRY',
      ),
    ]);
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const { exp, ...payload } = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      console.log('Payload from refreshToken:', payload);

      const user = await this.userRepository.findOneBy({ id: payload.sub });
      if (!user) {
        throw new BusinessException(
          'auth',
          'user-not-found',
          'User not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return this.createAccessToken(user, payload as TokenPayload);
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new BusinessException(
        'auth',
        'invalid-refresh-token',
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  createTokenPayload(userId: string): TokenPayload {
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4(),
    };
    console.log('Created token payload:', payload);
    return payload;
  }

  async saveGoogleUser(profile: any): Promise<User> {
    const { email, firstName, lastName, picture, id } = profile;
    let user = await this.userRepository.findOneBy({
      email,
      provider: 'google',
    });

    if (!user) {
      user = new User();
      user.email = email;
      user.name = `${firstName} ${lastName}`;
      user.password = '';
      // user.profilePicture = picture;
      user.role = 'user';
      user.phone = ''; //
      user.provider = 'google'; // 제공자 설정
      user.providerId = id; // 제공자 ID 설정
      await this.userRepository.save(user);
    }

    return user;
  }

  async handleGoogleCallback(
    profile: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.saveGoogleUser(profile);

    const payload: TokenPayload = this.createTokenPayload(user.id);

    const accessToken = await this.createAccessToken(user, payload);
    const refreshToken = await this.createRefreshToken(user, payload);

    return { accessToken, refreshToken };
  }

  async saveKakaoUser(profile: any): Promise<User> {
    const { id, username, email, profileImage } = profile.user;

    let user = await this.userRepository.findOneBy({
      email,
      provider: 'kakao',
    });

    if (!user) {
      user = new User();
      user.email = email;
      user.name = username;
      user.password = '';
      user.role = 'user';
      user.phone = '';
      user.provider = 'kakao'; // 제공자 설정
      user.providerId = id; // 제공자 ID 설정
      await this.userRepository.save(user);
    }

    return user;
  }

  async handleKakaoCallback(
    profile: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.saveKakaoUser(profile);

    const payload: TokenPayload = this.createTokenPayload(user.id);

    const accessToken = await this.createAccessToken(user, payload);
    const refreshToken = await this.createRefreshToken(user, payload);

    return { accessToken, refreshToken };
  }

  async createAccessToken(user: User, payload: TokenPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('ACCESS_TOKEN_EXPIRY');
    const token = this.jwtService.sign(payload, { expiresIn });
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.accessTokenRepository.saveAccessToken(
      payload.jti,
      user,
      token,
      expiresAt,
    );

    return token;
  }

  async createRefreshToken(user: User, payload: TokenPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRY');
    const token = this.jwtService.sign(payload, { expiresIn });
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.refreshTokenRepository.saveRefreshToken(
      payload.jti,
      user,
      token,
      expiresAt,
    );

    return token;
  }

  private async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await argon2.verify(user.password, plainPassword))) {
      return user;
    }
    throw new BusinessException(
      'auth',
      'invalid-credentials',
      'Invalid credentials',
      HttpStatus.UNAUTHORIZED,
    );
  }

  private async addToBlacklist(
    token: string,
    jti: string,
    type: 'access' | 'refresh',
    expiryConfigKey: string,
  ): Promise<void> {
    const expiryTime = this.calculateExpiry(
      this.configService.get<string>(expiryConfigKey),
    );
    await this.tokenBlacklistService.addToBlacklist(
      token,
      jti,
      type,
      expiryTime,
    );
  }

  private calculateExpiry(expiry: string): Date {
    let expiresInMilliseconds = 0;

    if (expiry.endsWith('d')) {
      const days = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = days * 24 * 60 * 60 * 1000;
    } else if (expiry.endsWith('h')) {
      const hours = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = hours * 60 * 60 * 1000;
    } else if (expiry.endsWith('m')) {
      const minutes = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = minutes * 60 * 1000;
    } else if (expiry.endsWith('s')) {
      const seconds = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = seconds * 1000;
    } else {
      throw new BusinessException(
        'auth',
        'invalid-expiry',
        'Invalid expiry time',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new Date(Date.now() + expiresInMilliseconds);
  }
}
