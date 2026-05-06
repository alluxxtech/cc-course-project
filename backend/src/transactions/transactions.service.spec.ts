import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { TransactionsService } from './transactions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { ALERTS_QUEUE } from '../alerts/alerts.constants.js';

type AnyFn = jest.Mock<() => Promise<unknown>>;

const USER_A = 'user-a';
const USER_B = 'user-b';

const mockCategory = {
  id: 'cat-1',
  userId: USER_A,
  name: 'Food',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction = {
  id: 'txn-1',
  userId: USER_A,
  categoryId: 'cat-1',
  title: 'Lunch',
  amount: 25.5,
  currency: 'USD',
  date: new Date('2025-05-15T00:00:00.000Z'),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    category: { findUnique: AnyFn };
    transaction: {
      findUnique: AnyFn;
      findMany: AnyFn;
      create: AnyFn;
      update: AnyFn;
      delete: AnyFn;
      aggregate: AnyFn;
    };
  };
  let mockQueue: { add: AnyFn };
  let mockBudgetsService: { invalidateCache: AnyFn };

  beforeEach(async () => {
    prisma = {
      category: { findUnique: jest.fn<() => Promise<unknown>>() },
      transaction: {
        findUnique: jest.fn<() => Promise<unknown>>(),
        findMany: jest.fn<() => Promise<unknown>>(),
        create: jest.fn<() => Promise<unknown>>(),
        update: jest.fn<() => Promise<unknown>>(),
        delete: jest.fn<() => Promise<unknown>>(),
        aggregate: jest.fn<() => Promise<unknown>>(),
      },
    };

    mockQueue = {
      add: jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
    };
    mockBudgetsService = {
      invalidateCache: jest
        .fn<() => Promise<unknown>>()
        .mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: BudgetsService, useValue: mockBudgetsService },
        { provide: getQueueToken(ALERTS_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('create', () => {
    const dto = {
      title: 'Lunch',
      amount: 25.5,
      currency: 'USD',
      date: '2025-05-15',
      categoryId: 'cat-1',
    };

    it('creates a transaction when the category belongs to the user', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(mockCategory);
      prisma.transaction.create.mockResolvedValueOnce(mockTransaction);

      const result = await service.create(USER_A, dto);

      expect(result).toEqual(mockTransaction);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_A,
            title: 'Lunch',
            amount: 25.5,
            currency: 'USD',
          }) as unknown,
        }),
      );
      expect(mockBudgetsService.invalidateCache).toHaveBeenCalledWith(
        USER_A,
        2025,
        5,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluate-alerts',
        expect.objectContaining({ userId: USER_A, year: 2025, month: 5 }),
        expect.any(Object),
      );
    });

    it('throws NotFoundException when the category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(USER_A, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the category belongs to another user', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({
        ...mockCategory,
        userId: USER_B,
      });

      await expect(service.create(USER_A, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a transaction and invalidates cache and enqueues alert job', async () => {
      const updatedTransaction = { ...mockTransaction, title: 'Dinner' };
      prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction);
      prisma.transaction.update.mockResolvedValueOnce(updatedTransaction);

      const result = await service.update(USER_A, 'txn-1', { title: 'Dinner' });

      expect(result).toEqual(updatedTransaction);
      expect(mockBudgetsService.invalidateCache).toHaveBeenCalledWith(
        USER_A,
        2025,
        5,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluate-alerts',
        expect.objectContaining({ userId: USER_A, year: 2025, month: 5 }),
        expect.any(Object),
      );
    });

    it('throws NotFoundException when the transaction does not exist', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update(USER_A, 'txn-1', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user A attempts to update a transaction owned by user B', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce({
        ...mockTransaction,
        userId: USER_B,
      });

      await expect(
        service.update(USER_A, 'txn-1', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the new categoryId belongs to another user', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction);
      prisma.category.findUnique.mockResolvedValueOnce({
        ...mockCategory,
        userId: USER_B,
      });

      await expect(
        service.update(USER_A, 'txn-1', { categoryId: 'cat-other' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a transaction and invalidates cache and enqueues alert job', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction);
      prisma.transaction.delete.mockResolvedValueOnce(undefined);

      await service.remove(USER_A, 'txn-1');

      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'txn-1' },
      });
      expect(mockBudgetsService.invalidateCache).toHaveBeenCalledWith(
        USER_A,
        2025,
        5,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluate-alerts',
        expect.objectContaining({ userId: USER_A, year: 2025, month: 5 }),
        expect.any(Object),
      );
    });

    it('throws NotFoundException when the transaction does not exist', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove(USER_A, 'txn-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user A attempts to delete a transaction owned by user B', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce({
        ...mockTransaction,
        userId: USER_B,
      });

      await expect(service.remove(USER_A, 'txn-1')).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.transaction.delete).not.toHaveBeenCalled();
    });
  });
});
