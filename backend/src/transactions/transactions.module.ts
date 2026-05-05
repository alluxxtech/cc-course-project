import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BudgetsModule } from '../budgets/budgets.module.js';
import { ALERTS_QUEUE } from '../alerts/alerts.constants.js';

@Module({
  imports: [
    PrismaModule,
    BudgetsModule,
    BullModule.registerQueue({ name: ALERTS_QUEUE }),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
