import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { ALERTS_QUEUE, ALERT_JOB_OPTIONS } from '../alerts/alerts.constants.js';
import type { Prisma, Transaction } from '../generated/prisma/client.js';
import type { CreateTransactionDto } from './dto/create-transaction.dto.js';
import type { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import type { QueryTransactionsDto } from './dto/query-transactions.dto.js';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetsService: BudgetsService,
    @InjectQueue(ALERTS_QUEUE) private readonly alertsQueue: Queue,
  ) {}

  async findAll(
    userId: string,
    query: QueryTransactionsDto,
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.preset) {
      const now = new Date();
      if (query.preset === 'this_month') {
        where.date = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
      } else {
        const year =
          now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        where.date = {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        };
      }
    } else if (query.dateFrom !== undefined || query.dateTo !== undefined) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setDate(to.getDate() + 1);
        dateFilter.lt = to;
      }
      where.date = dateFilter;
    }

    if (query.amountMin !== undefined || query.amountMax !== undefined) {
      const amountFilter: Prisma.DecimalFilter = {};
      if (query.amountMin !== undefined) amountFilter.gte = query.amountMin;
      if (query.amountMax !== undefined) amountFilter.lte = query.amountMax;
      where.amount = amountFilter;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();

    const created = await this.prisma.transaction.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        amount: dto.amount,
        currency: dto.currency,
        date: new Date(dto.date),
        notes: dto.notes,
      },
    });
    const createdYear = created.date.getFullYear();
    const createdMonth = created.date.getMonth() + 1;
    await this.budgetsService.invalidateCache(
      userId,
      createdYear,
      createdMonth,
    );
    await this.alertsQueue.add(
      'evaluate-alerts',
      { userId, year: createdYear, month: createdMonth },
      {
        ...ALERT_JOB_OPTIONS,
        jobId: `alerts-${userId}-${createdYear}-${createdMonth}`,
      },
    );
    return created;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId) throw new ForbiddenException();

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      if (category.userId !== userId) throw new ForbiddenException();
    }

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    const oldYear = transaction.date.getFullYear();
    const oldMonth = transaction.date.getMonth() + 1;
    const newYear = updated.date.getFullYear();
    const newMonth = updated.date.getMonth() + 1;

    await this.budgetsService.invalidateCache(userId, oldYear, oldMonth);
    if (newYear !== oldYear || newMonth !== oldMonth) {
      await this.budgetsService.invalidateCache(userId, newYear, newMonth);
    }
    await this.alertsQueue.add(
      'evaluate-alerts',
      { userId, year: newYear, month: newMonth },
      {
        ...ALERT_JOB_OPTIONS,
        jobId: `alerts-${userId}-${newYear}-${newMonth}`,
      },
    );
    if (newYear !== oldYear || newMonth !== oldMonth) {
      await this.alertsQueue.add(
        'evaluate-alerts',
        { userId, year: oldYear, month: oldMonth },
        {
          ...ALERT_JOB_OPTIONS,
          jobId: `alerts-${userId}-${oldYear}-${oldMonth}`,
        },
      );
    }

    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId) throw new ForbiddenException();

    const deletedYear = transaction.date.getFullYear();
    const deletedMonth = transaction.date.getMonth() + 1;
    await this.prisma.transaction.delete({ where: { id } });
    await this.budgetsService.invalidateCache(
      userId,
      deletedYear,
      deletedMonth,
    );
    await this.alertsQueue.add(
      'evaluate-alerts',
      { userId, year: deletedYear, month: deletedMonth },
      {
        ...ALERT_JOB_OPTIONS,
        jobId: `alerts-${userId}-${deletedYear}-${deletedMonth}`,
      },
    );
  }

  async getTotalForMonth(
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
