import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { AlertsGateway } from './alerts.gateway.js';
import { ALERTS_QUEUE } from './alerts.constants.js';
import { Prisma } from '../generated/prisma/client.js';

const THRESHOLDS = [50, 80, 100] as const;

@Processor(ALERTS_QUEUE)
export class AlertsProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetsService: BudgetsService,
    private readonly gateway: AlertsGateway,
  ) {
    super();
  }

  async process(
    job: Job<{
      userId: string;
      year?: number;
      month?: number;
      isReconnect?: boolean;
    }>,
  ): Promise<void> {
    const { userId, isReconnect = false } = job.data;
    const now = new Date();
    const year = job.data.year ?? now.getFullYear();
    const month = job.data.month ?? now.getMonth() + 1;

    if (isReconnect) {
      // Re-send only alerts the user hasn't acknowledged yet
      const unacked = await this.prisma.budgetAlertTrigger.findMany({
        where: { userId, year, month, ackedAt: null },
      });
      for (const trigger of unacked) {
        this.gateway.emitToUser(userId, trigger.threshold);
      }
      return;
    }

    // Normal evaluation after a transaction mutation
    const budget = await this.budgetsService.get(userId, year, month);
    if (!budget.budgetSet) return;

    for (const threshold of THRESHOLDS) {
      if (budget.usagePercent < threshold) continue;

      try {
        await this.prisma.budgetAlertTrigger.create({
          data: { userId, year, month, threshold },
        });
        // Inserted successfully = threshold crossed for the first time
        this.gateway.emitToUser(userId, threshold);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          // Already triggered this month, skip
        } else {
          throw err;
        }
      }
    }
  }
}
