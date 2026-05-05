import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Category } from '../generated/prisma/client.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.prisma.category.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    return this.prisma.category.create({
      data: { userId, name: dto.name },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();

    const duplicate = await this.prisma.category.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });

    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();

    if (category._count.transactions > 0) {
      throw new ConflictException(
        `Cannot delete category: it has ${category._count.transactions} transaction(s). Move or delete them first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
  }
}
