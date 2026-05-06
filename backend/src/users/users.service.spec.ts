import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type AnyFn = jest.Mock<() => Promise<any>>;

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { upsert: AnyFn; findUnique: AnyFn } };

  beforeEach(async () => {
    prisma = {
      user: {
        upsert: jest.fn<() => Promise<any>>(),
        findUnique: jest.fn<() => Promise<any>>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findOrCreate — SSO login', () => {
    const googleInput = {
      provider: 'google',
      providerUserId: 'google-sub-123',
      email: 'serhii@example.com',
      displayName: 'Serhii',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('creates a user record on first sign-in and returns it', async () => {
      const createdUser = {
        id: 'uuid-1',
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'serhii@example.com',
        displayName: 'Serhii',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.upsert.mockResolvedValueOnce(createdUser);

      const result = await service.findOrCreate(googleInput);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: 'google',
            providerUserId: 'google-sub-123',
          },
        },
        update: {
          email: 'serhii@example.com',
          displayName: 'Serhii',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        create: {
          provider: 'google',
          providerUserId: 'google-sub-123',
          email: 'serhii@example.com',
          displayName: 'Serhii',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });

      expect(result).toEqual(createdUser);
    });

    it('returns the existing user on re-authentication without creating a duplicate', async () => {
      const existingUser = {
        id: 'uuid-1',
        provider: 'google',
        providerUserId: 'google-sub-123',
        email: 'serhii@example.com',
        displayName: 'Serhii Renamed',
        avatarUrl: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      };

      prisma.user.upsert.mockResolvedValueOnce(existingUser);

      const result = await service.findOrCreate({
        ...googleInput,
        displayName: 'Serhii Renamed',
        avatarUrl: null,
      });

      expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('uuid-1');
      expect(result.displayName).toBe('Serhii Renamed');
    });
  });

  describe('findById', () => {
    it('returns the user when found by id', async () => {
      const user = {
        id: 'uuid-1',
        provider: 'github',
        providerUserId: 'gh-42',
        email: null,
        displayName: 'Serhii',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.findById('uuid-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(user);
    });

    it('returns null when the user does not exist (e.g. deleted between requests)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
