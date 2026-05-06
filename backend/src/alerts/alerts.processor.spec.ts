import { jest } from '@jest/globals';
import type { Job } from 'bullmq';
import { AlertsProcessor } from './alerts.processor.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { AlertsGateway } from './alerts.gateway.js';
import { Prisma } from '../generated/prisma/client.js';

type AnyFn = jest.Mock<() => Promise<any>>;

type JobData = {
  userId: string;
  year?: number;
  month?: number;
  isReconnect?: boolean;
};

const makeJob = (data: JobData): Job<JobData> => ({ data }) as Job<JobData>;

const JOB_DATA: JobData = { userId: 'user-1', year: 2025, month: 5 };

describe('AlertsProcessor', () => {
  let processor: AlertsProcessor;
  let mockPrisma: {
    budgetAlertTrigger: { findMany: AnyFn; create: AnyFn };
  };
  let mockBudgetsService: { get: AnyFn };
  let mockGateway: { emitToUser: jest.Mock<() => void> };

  beforeEach(() => {
    mockPrisma = {
      budgetAlertTrigger: {
        findMany: jest.fn<() => Promise<any>>(),
        create: jest.fn<() => Promise<any>>().mockResolvedValue({}),
      },
    };
    mockBudgetsService = { get: jest.fn<() => Promise<any>>() };
    mockGateway = { emitToUser: jest.fn<() => void>() };

    processor = new AlertsProcessor(
      mockPrisma as unknown as PrismaService,
      mockBudgetsService as unknown as BudgetsService,
      mockGateway as unknown as AlertsGateway,
    );
  });

  describe('process — budget threshold alerts', () => {
    it('emits a budget-alert for the 50% threshold when usage reaches 55%', async () => {
      mockBudgetsService.get.mockResolvedValueOnce({
        budgetSet: true,
        amount: 1000,
        spent: 550,
        remaining: 450,
        usagePercent: 55,
      });

      await processor.process(makeJob(JOB_DATA));

      expect(mockGateway.emitToUser).toHaveBeenCalledTimes(1);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 50);
      expect(mockPrisma.budgetAlertTrigger.create).toHaveBeenCalledTimes(1);
    });

    it('emits budget-alerts for the 80% threshold when usage reaches 85%', async () => {
      mockBudgetsService.get.mockResolvedValueOnce({
        budgetSet: true,
        amount: 1000,
        spent: 850,
        remaining: 150,
        usagePercent: 85,
      });

      await processor.process(makeJob(JOB_DATA));

      expect(mockGateway.emitToUser).toHaveBeenCalledTimes(2);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 50);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 80);
      expect(mockPrisma.budgetAlertTrigger.create).toHaveBeenCalledTimes(2);
    });

    it('emits budget-alerts for the 100% threshold when usage reaches 100%', async () => {
      mockBudgetsService.get.mockResolvedValueOnce({
        budgetSet: true,
        amount: 1000,
        spent: 1000,
        remaining: 0,
        usagePercent: 100,
      });

      await processor.process(makeJob(JOB_DATA));

      expect(mockGateway.emitToUser).toHaveBeenCalledTimes(3);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 50);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 80);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 100);
      expect(mockPrisma.budgetAlertTrigger.create).toHaveBeenCalledTimes(3);
    });

    it('does not emit alerts when no budget is set for the month', async () => {
      mockBudgetsService.get.mockResolvedValueOnce({ budgetSet: false });

      await processor.process(makeJob(JOB_DATA));

      expect(mockGateway.emitToUser).not.toHaveBeenCalled();
      expect(mockPrisma.budgetAlertTrigger.create).not.toHaveBeenCalled();
    });

    it('skips re-emitting an alert for a threshold already triggered this month (P2002)', async () => {
      mockBudgetsService.get.mockResolvedValueOnce({
        budgetSet: true,
        amount: 1000,
        spent: 600,
        remaining: 400,
        usagePercent: 60,
      });

      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      mockPrisma.budgetAlertTrigger.create.mockRejectedValueOnce(p2002);

      await processor.process(makeJob(JOB_DATA));

      expect(mockPrisma.budgetAlertTrigger.create).toHaveBeenCalledTimes(1);
      // create threw P2002 before emitToUser was reached
      expect(mockGateway.emitToUser).not.toHaveBeenCalled();
    });
  });
});
