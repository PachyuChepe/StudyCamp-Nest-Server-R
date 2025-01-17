// src/auth/controllers/auth.controller.ts
import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, UserService } from '../services';
import {
  CreateUserDto,
  LoginReqDto,
  LoginResDto,
  RefreshReqDto,
  SignupResDto,
  LogoutReqDto,
  DeleteUserDto,
} from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(
    @Req() req,
    @Body() loginReqDto: LoginReqDto,
  ): Promise<LoginResDto> {
    const { ip, method, originalUrl } = req;
    const reqInfo = {
      ip,
      endpoint: `${method} ${originalUrl}`,
      ua: req.headers['user-agent'] || '',
    };

    return this.authService.login(
      loginReqDto.email,
      loginReqDto.password,
      reqInfo,
    );
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto): Promise<SignupResDto> {
    const user = await this.userService.createUser(createUserDto);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<string> {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutReqDto): Promise<void> {
    return this.authService.logout(dto.accessToken, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async delete(@Body() deleteUserDto: DeleteUserDto): Promise<void> {
    await this.userService.deleteUser(deleteUserDto);
  }
}
