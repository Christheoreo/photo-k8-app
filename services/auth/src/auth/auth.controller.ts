import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { AuthGuard } from './auth.guard';
import type { AuthRequest } from 'src/types';
import { Public } from './public.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body() body: RegisterDto) {
    await this.authService.register(body.email, body.password);
  }

  @Public()
  @HttpCode(201)
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('protected')
  protectedRoute(@Req() req: AuthRequest) {
    return req.user;
  }
}
