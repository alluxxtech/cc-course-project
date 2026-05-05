import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BudgetsService } from './budgets.service.js';
import { SetBudgetDto } from './dto/set-budget.dto.js';
import type { User } from '../generated/prisma/client.js';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Put(':year/:month')
  @HttpCode(HttpStatus.NO_CONTENT)
  set(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() dto: SetBudgetDto,
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as User;
    return this.budgetsService.set(user.id, year, month, dto);
  }

  @Get(':year/:month')
  get(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.budgetsService.get(user.id, year, month);
  }
}
