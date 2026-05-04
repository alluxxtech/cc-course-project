import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { User } from '../generated/prisma/client.js';

type FindOrCreateInput = {
  provider: string;
  providerUserId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(input: FindOrCreateInput): Promise<User> {
    return this.prisma.user.upsert({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId: input.providerUserId,
        },
      },
      update: {
        email: input.email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      },
      create: {
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
