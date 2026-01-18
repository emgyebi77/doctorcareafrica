import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.register(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.login(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.refresh(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: OtpRequestDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.requestOtp(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: OtpVerifyDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.verifyOtp(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.authService.logout(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@CurrentUser() user: RequestUser) {
    return this.authService.listSessions(user);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.authService.revokeSessionById(user, sessionId, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
