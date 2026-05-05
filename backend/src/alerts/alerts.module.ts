import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AlertsGateway } from './alerts.gateway.js';
import { ALERTS_QUEUE } from './alerts.constants.js';
import { AlertsProcessor } from './alerts.processor.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BudgetsModule } from '../budgets/budgets.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: ALERTS_QUEUE }),
    PrismaModule,
    BudgetsModule,
  ],
  providers: [AlertsGateway, AlertsProcessor],
  exports: [AlertsGateway],
})
export class AlertsModule {}
