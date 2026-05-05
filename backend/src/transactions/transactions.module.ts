import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BudgetsModule } from '../budgets/budgets.module.js';

@Module({
  imports: [PrismaModule, BudgetsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
