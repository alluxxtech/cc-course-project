import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { QueryTransactionsDto } from './dto/query-transactions.dto.js';
import type { User } from '../generated/prisma/client.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@Req() req: Request, @Query() query: QueryTransactionsDto) {
    const user = req.user as User;
    return this.transactionsService.findAll(user.id, query);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTransactionDto) {
    const user = req.user as User;
    return this.transactionsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const user = req.user as User;
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    return this.transactionsService.remove(user.id, id);
  }
}
