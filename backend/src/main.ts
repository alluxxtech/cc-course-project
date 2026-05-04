import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
  });

  const redisClient = createClient({
    socket: {
      host: config.get<string>('REDIS_HOST') ?? 'localhost',
      port: config.get<number>('REDIS_PORT') ?? 6379,
    },
  });
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.get<string>('NODE_ENV') === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
}

void bootstrap();
