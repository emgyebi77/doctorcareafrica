import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditAction,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  RoleType,
  TransactionStatus,
  TransactionType,
  WebhookProvider,
  WebhookStatus,
} from '@prisma/client';
import { createHmac, randomBytes } from 'crypto';

import { AuditService } from '../../common/audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MomoWebhookDto } from './dto/momo-webhook.dto';
import { RefundDto } from './dto/refund.dto';
import { StripeWebhookDto } from './dto/stripe-webhook.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async createCheckout(user: RequestUser, dto: CreateCheckoutDto, meta: RequestMeta) {
    if (!user.patientId) {
      throw new ForbiddenException('Patient profile not found.');
    }
    const provider = dto.provider;
    const method =
      provider === 'STRIPE' ? PaymentMethod.CARD : PaymentMethod.MOBILE_MONEY;
    if (provider === 'MOMO' && !dto.momoPhone) {
      throw new BadRequestException('momoPhone is required for MoMo payments.');
    }

    const appointment = dto.appointmentId
      ? await this.prisma.appointment.findFirst({
          where: { id: dto.appointmentId, deletedAt: null },
          include: { doctor: { select: { id: true } } },
        })
      : null;

    if (dto.appointmentId && !appointment) {
      throw new NotFoundException('Appointment not found.');
    }
    if (appointment && appointment.patientId !== user.patientId) {
      throw new ForbiddenException('Appointment does not belong to the patient.');
    }

    const doctorId = appointment?.doctorId ?? dto.doctorId;
    if (!doctorId) {
      throw new BadRequestException('doctorId is required when no appointment is provided.');
    }

    const wallet = await this.getOrCreateWallet(user.id, user.countryId, dto.currency);
    const reference = this.buildReference(provider);

    const payment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          appointmentId: dto.appointmentId,
          patientId: user.patientId,
          doctorId,
          walletId: wallet.id,
          countryId: user.countryId,
          amount: dto.amount,
          currency: dto.currency,
          status: PaymentStatus.PENDING,
          method,
          provider,
          reference,
          metadata: {
            returnUrl: dto.returnUrl,
            callbackUrl: dto.callbackUrl,
            momoPhone: dto.momoPhone,
          },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          paymentId: payment.id,
          countryId: user.countryId,
          type: TransactionType.DEBIT,
          status: TransactionStatus.PENDING,
          amount: dto.amount,
          currency: dto.currency,
          reference,
        },
      });

      return payment;
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Payment',
      entityId: payment.id,
      description: `Payment initiated via ${provider}.`,
      meta,
    });

    return {
      paymentId: payment.id,
      provider,
      reference,
      checkout: {
        redirectUrl: provider === 'STRIPE' ? this.buildStripeCheckoutUrl(reference) : undefined,
        momoInstructions:
          provider === 'MOMO'
            ? `Approve the request on ${dto.momoPhone}`
            : undefined,
      },
    };
  }

  async confirmPayment(user: RequestUser, paymentId: string, meta: RequestMeta) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, deletedAt: null },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    return this.capturePayment(payment.reference ?? payment.id, meta);
  }

  async refundPayment(user: RequestUser, paymentId: string, dto: RefundDto, meta: RequestMeta) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, deletedAt: null },
      include: { patient: { select: { userId: true } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    if (user.role === RoleType.PATIENT && payment.patient.userId !== user.id) {
      throw new ForbiddenException('Access denied.');
    }
    if (
      user.role !== RoleType.PATIENT &&
      user.role !== RoleType.ADMIN &&
      user.role !== RoleType.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Access denied.');
    }
    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Only captured payments can be refunded.');
    }
    if (dto.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount exceeds payment amount.');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: payment.patientId },
      select: { userId: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }
    const wallet = await this.getOrCreateWallet(patient.userId, payment.countryId, payment.currency);

    const refund = await this.prisma.$transaction(async (tx) => {
      const refund = await tx.paymentRefund.create({
        data: {
          paymentId: payment.id,
          countryId: payment.countryId,
          amount: dto.amount,
          currency: payment.currency,
          status: RefundStatus.PROCESSING,
          reason: dto.reason,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          paymentId: payment.id,
          countryId: payment.countryId,
          type: TransactionType.REFUND,
          status: TransactionStatus.PENDING,
          amount: dto.amount,
          currency: payment.currency,
          reference: `refund-${payment.reference ?? payment.id}`,
        },
      });

      return refund;
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: payment.countryId,
      entityType: 'PaymentRefund',
      entityId: refund.id,
      description: 'Refund requested.',
      meta,
    });

    await this.markRefundSucceeded(payment.id, refund.id, meta);

    return { success: true };
  }

  async listMyPayments(user: RequestUser) {
    if (!user.patientId) {
      throw new ForbiddenException('Patient profile not found.');
    }
    const payments = await this.prisma.payment.findMany({
      where: { patientId: user.patientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return { payments };
  }

  async listAdminPayments(user: RequestUser) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
    const payments = await this.prisma.payment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { refunds: true },
    });
    return { payments };
  }

  async handleStripeWebhook(payload: StripeWebhookDto, signature: string | undefined) {
    await this.verifySignature('STRIPE', payload, signature);
    const event = await this.recordWebhook(WebhookProvider.STRIPE, payload.eventId, payload, signature);

    const status = payload.status?.toLowerCase();
    if (payload.eventType.includes('succeeded') || status === 'succeeded') {
      await this.capturePayment(payload.paymentReference, { ipAddress: undefined });
    }
    if (payload.eventType.includes('refunded') || status === 'refunded') {
      await this.markRefundFromWebhook(payload.paymentReference, payload.amount, { ipAddress: undefined });
    }
    if (payload.eventType.includes('failed') || status === 'failed') {
      await this.failPayment(payload.paymentReference, { ipAddress: undefined });
    }

    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: WebhookStatus.PROCESSED, processedAt: new Date() },
    });

    return { received: true };
  }

  async handleMomoWebhook(payload: MomoWebhookDto, signature: string | undefined) {
    await this.verifySignature('MOMO', payload, signature);
    const event = await this.recordWebhook(WebhookProvider.MOMO, payload.eventId, payload, signature);

    const status = payload.status?.toLowerCase();
    if (payload.eventType.includes('success') || status === 'succeeded') {
      await this.capturePayment(payload.paymentReference, { ipAddress: undefined });
    }
    if (payload.eventType.includes('refund') || status === 'refunded') {
      await this.markRefundFromWebhook(payload.paymentReference, payload.amount, { ipAddress: undefined });
    }
    if (payload.eventType.includes('fail') || status === 'failed') {
      await this.failPayment(payload.paymentReference, { ipAddress: undefined });
    }

    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: WebhookStatus.PROCESSED, processedAt: new Date() },
    });

    return { received: true };
  }

  private async capturePayment(reference: string, meta: RequestMeta) {
    const payment = await this.prisma.payment.findFirst({
      where: { deletedAt: null, OR: [{ reference }, { id: reference }] },
      include: { patient: { select: { userId: true } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    if (payment.status === PaymentStatus.CAPTURED) {
      return { success: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CAPTURED, paidAt: new Date() },
      });
      await tx.transaction.updateMany({
        where: { paymentId: payment.id, type: TransactionType.DEBIT },
        data: { status: TransactionStatus.SUCCESS, occurredAt: new Date() },
      });
    });

    await this.createPaymentNotification(payment.patient.userId, payment.countryId, 'Payment received');

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: payment.patient.userId,
      countryId: payment.countryId,
      entityType: 'Payment',
      entityId: payment.id,
      description: 'Payment captured.',
      meta,
    });

    return { success: true };
  }

  private async failPayment(reference: string, meta: RequestMeta) {
    const payment = await this.prisma.payment.findFirst({
      where: { deletedAt: null, OR: [{ reference }, { id: reference }] },
      include: { patient: { select: { userId: true } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    if (payment.status === PaymentStatus.FAILED) {
      return { success: true };
    }
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    await this.prisma.transaction.updateMany({
      where: { paymentId: payment.id, type: TransactionType.DEBIT },
      data: { status: TransactionStatus.FAILED, occurredAt: new Date() },
    });

    await this.createPaymentNotification(payment.patient.userId, payment.countryId, 'Payment failed');

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: payment.patient.userId,
      countryId: payment.countryId,
      entityType: 'Payment',
      entityId: payment.id,
      description: 'Payment failed.',
      meta,
    });

    return { success: true };
  }

  private async markRefundFromWebhook(
    reference: string,
    amount: number | undefined,
    meta: RequestMeta,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { deletedAt: null, OR: [{ reference }, { id: reference }] },
      include: { refunds: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    const refund = payment.refunds[0];
    if (!refund) {
      const created = await this.prisma.paymentRefund.create({
        data: {
          paymentId: payment.id,
          countryId: payment.countryId,
          amount: amount ?? payment.amount,
          currency: payment.currency,
          status: RefundStatus.PROCESSING,
        },
      });
      return this.markRefundSucceeded(payment.id, created.id, meta);
    }
    return this.markRefundSucceeded(payment.id, refund.id, meta);
  }

  private async markRefundSucceeded(paymentId: string, refundId: string, meta: RequestMeta) {
    const refund = await this.prisma.paymentRefund.update({
      where: { id: refundId },
      data: { status: RefundStatus.SUCCEEDED, processedAt: new Date() },
      include: { payment: { include: { patient: { select: { userId: true } } } } },
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });
    await this.prisma.transaction.updateMany({
      where: { paymentId, type: TransactionType.REFUND },
      data: { status: TransactionStatus.SUCCESS, occurredAt: new Date() },
    });

    await this.createPaymentNotification(refund.payment.patient.userId, refund.payment.countryId, 'Refund issued');

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: refund.payment.patient.userId,
      countryId: refund.payment.countryId,
      entityType: 'PaymentRefund',
      entityId: refund.id,
      description: 'Refund completed.',
      meta,
    });
  }

  private async recordWebhook(
    provider: WebhookProvider,
    externalId: string,
    payload: StripeWebhookDto | MomoWebhookDto,
    signature?: string,
  ) {
    return this.prisma.webhookEvent.create({
      data: {
        provider,
        externalId,
        eventType: payload.eventType,
        signature,
        payload,
      },
    });
  }

  private async verifySignature(
    provider: 'STRIPE' | 'MOMO',
    payload: StripeWebhookDto | MomoWebhookDto,
    signature?: string,
  ) {
    const secret =
      provider === 'STRIPE'
        ? this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
        : this.configService.get<string>('MOMO_WEBHOOK_SECRET');
    if (!secret) {
      return;
    }
    if (!signature) {
      throw new BadRequestException('Missing webhook signature.');
    }
    const computed = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (computed !== signature) {
      throw new BadRequestException('Invalid webhook signature.');
    }
  }

  private buildStripeCheckoutUrl(reference: string) {
    const base = this.configService.get<string>('STRIPE_CHECKOUT_URL', 'https://checkout.stripe.com/pay');
    return `${base}/${reference}`;
  }

  private buildReference(provider: 'STRIPE' | 'MOMO') {
    return `${provider}-${randomBytes(8).toString('hex')}`;
  }

  private async getOrCreateWallet(userId: string, countryId: string, currency: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) {
      if (existing.currency !== currency) {
        throw new BadRequestException('Wallet currency mismatch.');
      }
      return existing;
    }
    return this.prisma.wallet.create({
      data: {
        userId,
        countryId,
        currency,
        balance: 0,
      },
    });
  }

  private async createPaymentNotification(userId: string, countryId: string, title: string) {
    await this.prisma.notification.create({
      data: {
        userId,
        countryId,
        type: NotificationType.PAYMENT,
        channel: NotificationChannel.IN_APP,
        title,
        message: title,
        status: NotificationStatus.UNREAD,
      },
    });
  }
}
