// src/auth/controllers/kakao-auth.controller.ts
import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services';
import { Response } from 'express';
import { TokenPayload } from '../types';

@Controller('auth/kakao')
export class KakaoAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth(@Req() req) {
    // 카카오 로그인 페이지로 리다이렉션
  }

  @Get('callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      console.log('Received callback with request:', req.user);

      const { accessToken, refreshToken } =
        await this.authService.handleKakaoCallback(req.user);

      res.cookie('accessToken', accessToken);
      res.cookie('refreshToken', refreshToken);
      return res.redirect('/');
    } catch (error) {
      console.error('Error in Kakao Auth Redirect:', error);
      res.status(400).json({
        message: 'Error in Kakao Auth Redirect',
        error: error.message,
      });
    }
  }
}
