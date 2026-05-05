import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { envValidationSchema } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard.js';
import { CategoriesModule } from './categories/categories.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { BudgetsModule } from './budgets/budgets.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: 'ioredis',
        host: config.get<string>('REDIS_HOST'),
        port: config.get<number>('REDIS_PORT'),
        ttl: 60_000,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthenticatedGuard }],
})
export class AppModule {}
