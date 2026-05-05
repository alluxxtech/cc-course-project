import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SetBudgetDto } from './dto/set-budget.dto.js';

export type BudgetResponse =
  | { budgetSet: false }
  | {
      budgetSet: true;
      amount: number;
      spent: number;
      remaining: number;
      usagePercent: number;
    };

const CACHE_TTL_MS = 60_000;

export function budgetCacheKey(
  userId: string,
  year: number,
  month: number,
): string {
  return `budget:${userId}:${year}:${month}`;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private validateYearMonth(year: number, month: number): void {
    if (month < 1 || month > 12)
      throw new BadRequestException('month must be between 1 and 12');
    if (year < 1900 || year > 9999)
      throw new BadRequestException('year must be between 1900 and 9999');
  }

  async set(
    userId: string,
    year: number,
    month: number,
    dto: SetBudgetDto,
  ): Promise<void> {
    this.validateYearMonth(year, month);
    await this.prisma.monthlyBudget.upsert({
      where: { userId_year_month: { userId, year, month } },
      create: { userId, year, month, amount: dto.amount },
      update: { amount: dto.amount },
    });
    await this.cache.del(budgetCacheKey(userId, year, month));
  }

  async get(
    userId: string,
    year: number,
    month: number,
  ): Promise<BudgetResponse> {
    this.validateYearMonth(year, month);
    const key = budgetCacheKey(userId, year, month);
    const cached = await this.cache.get<BudgetResponse>(key);
    if (cached !== undefined && cached !== null) return cached;

    const budget = await this.prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
    });

    if (!budget) {
      const result: BudgetResponse = { budgetSet: false };
      await this.cache.set(key, result, CACHE_TTL_MS);
      return result;
    }

    const amount = Number(budget.amount);
    const spent = await this.getTotalSpent(userId, year, month);
    const remaining = amount - spent;
    const usagePercent = amount > 0 ? (spent / amount) * 100 : 0;

    const result: BudgetResponse = {
      budgetSet: true,
      amount,
      spent,
      remaining,
      usagePercent,
    };
    await this.cache.set(key, result, CACHE_TTL_MS);
    return result;
  }

  async invalidateCache(
    userId: string,
    year: number,
    month: number,
  ): Promise<void> {
    await this.cache.del(budgetCacheKey(userId, year, month));
  }

  private async getTotalSpent(
    userId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        date: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
