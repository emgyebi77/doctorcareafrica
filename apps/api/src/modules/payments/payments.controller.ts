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
import { RoleType } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MomoWebhookDto } from './dto/momo-webhook.dto';
import { RefundDto } from './dto/refund.dto';
import { StripeWebhookDto } from './dto/stripe-webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT)
  @HttpCode(HttpStatus.OK)
  async checkout(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCheckoutDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.paymentsService.createCheckout(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) paymentId: string,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.paymentsService.confirmPayment(user, paymentId, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async refund(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) paymentId: string,
    @Body() dto: RefundDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.paymentsService.refundPayment(user, paymentId, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT)
  async listMine(@CurrentUser() user: RequestUser) {
    return this.paymentsService.listMyPayments(user);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async listAdmin(@CurrentUser() user: RequestUser) {
    return this.paymentsService.listAdminPayments(user);
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Body() dto: StripeWebhookDto,
    @Req() req: Request,
  ) {
    const signature = req.get('stripe-signature') ?? undefined;
    return this.paymentsService.handleStripeWebhook(dto, signature);
  }

  @Post('webhooks/momo')
  @HttpCode(HttpStatus.OK)
  async momoWebhook(
    @Body() dto: MomoWebhookDto,
    @Req() req: Request,
  ) {
    const signature = req.get('momo-signature') ?? undefined;
    return this.paymentsService.handleMomoWebhook(dto, signature);
  }
}
