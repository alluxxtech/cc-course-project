import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type AnyFn = jest.Mock<() => Promise<any>>;

const USER_A = 'user-a';
const USER_B = 'user-b';

const baseCategory = {
  id: 'cat-1',
  userId: USER_A,
  name: 'Food',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findUnique: AnyFn;
      findMany: AnyFn;
      create: AnyFn;
      update: AnyFn;
      delete: AnyFn;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn<() => Promise<any>>(),
        findMany: jest.fn<() => Promise<any>>(),
        create: jest.fn<() => Promise<any>>(),
        update: jest.fn<() => Promise<any>>(),
        delete: jest.fn<() => Promise<any>>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('creates a category when the name is unique for the user', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);
      prisma.category.create.mockResolvedValueOnce(baseCategory);

      const result = await service.create(USER_A, { name: 'Food' });

      expect(result).toEqual(baseCategory);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { userId: USER_A, name: 'Food' },
      });
    });

    it('throws ConflictException when the name already exists for the same user', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(baseCategory);

      await expect(service.create(USER_A, { name: 'Food' })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update(USER_A, 'cat-1', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user A tries to rename a category owned by user B', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({
        ...baseCategory,
        userId: USER_B,
      });

      await expect(
        service.update(USER_A, 'cat-1', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the new name is already taken by another category of the same user', async () => {
      // First findUnique: find category being updated (owned by USER_A)
      prisma.category.findUnique.mockResolvedValueOnce(baseCategory);
      // Second findUnique: duplicate name check finds a different category
      prisma.category.findUnique.mockResolvedValueOnce({
        id: 'cat-2',
        userId: USER_A,
        name: 'New Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.update(USER_A, 'cat-1', { name: 'New Name' }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when user A tries to delete a category owned by user B', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({
        ...baseCategory,
        userId: USER_B,
        _count: { transactions: 0 },
      });

      await expect(service.remove(USER_A, 'cat-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException when trying to delete a category that has transactions', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({
        ...baseCategory,
        _count: { transactions: 3 },
      });

      await expect(service.remove(USER_A, 'cat-1')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove(USER_A, 'cat-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });
  });
});
