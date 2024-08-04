// src/auth/controllers/google-auth.controller.ts
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

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // 구글 로그인 페이지로 리다이렉션
  }

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      console.log('Received callback with request:', req.user);

      const { accessToken, refreshToken } =
        await this.authService.handleGoogleCallback(req.user);

      res.cookie('accessToken', accessToken);
      res.cookie('refreshToken', refreshToken);
      return res.redirect('/');
    } catch (error) {
      console.error('Error in Google Auth Redirect:', error);
      res.status(400).json({
        message: 'Error in Google Auth Redirect',
        error: error.message,
      });
    }
  }
}
