import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { GithubAuthGuard } from './guards/github-auth.guard.js';
import { AuthenticatedGuard } from './guards/authenticated.guard.js';
import { Public } from './decorators/public.decorator.js';
import type { User } from '../generated/prisma/client.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Res() res: Response): void {
    res.redirect(this.config.getOrThrow<string>('FRONTEND_URL'));
  }

  @Get('github')
  @Public()
  @UseGuards(GithubAuthGuard)
  githubLogin(): void {}

  @Get('github/callback')
  @Public()
  @UseGuards(GithubAuthGuard)
  githubCallback(@Res() res: Response): void {
    res.redirect(this.config.getOrThrow<string>('FRONTEND_URL'));
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  me(@Req() req: Request): User {
    return req.user as User;
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: Request, @Res() res: Response): void {
    req.logout(() => {
      res.sendStatus(HttpStatus.NO_CONTENT);
    });
  }
}
