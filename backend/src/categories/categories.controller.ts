import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import type { User } from '../generated/prisma/client.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.categoriesService.findAll(user.id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCategoryDto) {
    const user = req.user as User;
    return this.categoriesService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const user = req.user as User;
    return this.categoriesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.categoriesService.remove(user.id, id);
  }
}
