import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { GithubStrategy } from './strategies/github.strategy.js';
import { SessionSerializer } from './session.serializer.js';

@Module({
  imports: [PassportModule.register({ session: true }), UsersModule],
  controllers: [AuthController],
  providers: [GoogleStrategy, GithubStrategy, SessionSerializer],
})
export class AuthModule {}
