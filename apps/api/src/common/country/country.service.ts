import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

type CountrySettings = {
  id: string;
  currency: string;
  currencySymbol: string | null;
  timezone: string;
  locale: string;
  jitsiRegion: string | null;
  momoProvider: string | null;
  momoProviders: Record<string, string> | null;
  supportedLocales: string[] | null;
};

@Injectable()
export class CountryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCountrySettings(countryId: string): Promise<CountrySettings> {
    const country = await this.prisma.country.findFirst({
      where: { id: countryId, deletedAt: null },
      select: {
        id: true,
        currency: true,
        currencySymbol: true,
        timezone: true,
        locale: true,
        jitsiRegion: true,
        momoProvider: true,
        momoProviders: true,
        supportedLocales: true,
      },
    });
    if (!country) {
      throw new BadRequestException('Invalid country.');
    }
    return {
      ...country,
      momoProviders: this.toProviderMap(country.momoProviders),
      supportedLocales: this.toStringArray(country.supportedLocales),
    };
  }

  async resolveLocalization(params: {
    countryId: string;
    cityId?: string | null;
    timezone?: string | null;
    locale?: string | null;
  }) {
    const country = await this.getCountrySettings(params.countryId);
    const city = params.cityId
      ? await this.prisma.city.findFirst({
          where: { id: params.cityId, countryId: params.countryId, deletedAt: null },
          select: { timezone: true, locale: true },
        })
      : null;
    const timezone = params.timezone ?? city?.timezone ?? country.timezone;
    const locale = params.locale ?? city?.locale ?? country.locale;

    this.ensureLocaleSupported(country, locale);

    return { country, timezone, locale };
  }

  resolveCurrency(country: CountrySettings, currency?: string) {
    const resolved = currency ?? country.currency;
    if (resolved !== country.currency) {
      throw new BadRequestException('Currency is not supported for this country.');
    }
    return resolved;
  }

  resolveJitsiRegion(country: CountrySettings, requested?: string) {
    return requested ?? country.jitsiRegion ?? undefined;
  }

  resolveMomoProvider(country: CountrySettings, momoPhone?: string) {
    const normalizedPhone = momoPhone ? this.normalizePhone(momoPhone) : undefined;
    const mapping = country.momoProviders;

    if (normalizedPhone && mapping) {
      for (const [prefix, provider] of Object.entries(mapping)) {
        if (prefix === 'default') {
          continue;
        }
        const normalizedPrefix = this.normalizePhone(prefix);
        if (normalizedPrefix && normalizedPhone.startsWith(normalizedPrefix)) {
          return provider;
        }
      }
      if (mapping.default) {
        return mapping.default;
      }
    }

    return country.momoProvider ?? null;
  }

  formatInTimeZone(date: Date, timeZone: string, locale?: string) {
    try {
      const formatter = new Intl.DateTimeFormat(locale ?? 'en-GB', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
      const year = lookup('year');
      const month = lookup('month');
      const day = lookup('day');
      const hour = lookup('hour');
      const minute = lookup('minute');
      const second = lookup('second');
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    } catch {
      return date.toISOString();
    }
  }

  private ensureLocaleSupported(country: CountrySettings, locale: string) {
    if (!country.supportedLocales || country.supportedLocales.length === 0) {
      return;
    }
    if (!country.supportedLocales.includes(locale)) {
      throw new BadRequestException('Locale is not supported for this country.');
    }
  }

  private normalizePhone(phone: string) {
    return phone.replace(/[^\d+]/g, '');
  }

  private toProviderMap(value: unknown): Record<string, string> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, provider]) => typeof provider === 'string')
      .map(([prefix, provider]) => [prefix, provider as string]);
    return entries.length ? Object.fromEntries(entries) : null;
  }

  private toStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const items = value.filter((item) => typeof item === 'string') as string[];
    return items.length ? items : null;
  }
}
