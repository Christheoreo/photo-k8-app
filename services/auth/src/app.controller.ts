import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): Record<string, string> {
    return { status: 'ok' };
  }

  @Public()
  @Get('walter')
  getWalter(): Record<string, string> {
    return { status: 'Walter is awesome' };
  }
}
