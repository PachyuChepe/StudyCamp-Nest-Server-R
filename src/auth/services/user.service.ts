// src/auth/services/user.service.ts
import { AccessTokenRepository, UserRepository } from '../repositories';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '../entities';
import { CreateUserDto, DeleteUserDto } from '../dto';
import { BusinessException } from '../../exception';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly accessTokenRepo: AccessTokenRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepo.findOneByEmail(dto.email);
    if (user) {
      throw new BusinessException(
        'user',
        `${dto.email} already exist`,
        `${dto.email} already exist`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const hashedPassword = await argon2.hash(dto.password);
    return this.userRepo.createUser(dto, hashedPassword);
  }

  async deleteUser(dto: DeleteUserDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user || !(await argon2.verify(user.password, dto.password))) {
      throw new BusinessException(
        'auth',
        'invalid-credentials',
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.userRepo.remove(user);
    this.logger.log(`User ${dto.userId} deleted`);
  }

  async validateUser(id: string, jti: string): Promise<User> {
    const [user, token] = await Promise.all([
      this.userRepo.findOneBy({ id }),
      this.accessTokenRepo.findOneByJti(jti),
    ]);
    if (!user) {
      this.logger.error(`user ${id} not found`);
      throw new BusinessException(
        'user',
        `user not found`,
        `user not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!token) {
      this.logger.error(`jti ${jti} token is revoked`);
      throw new BusinessException(
        'user',
        `revoked token`,
        `revoked token`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }
}
