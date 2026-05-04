import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';

type DoneCallback = (err: Error | null, user?: Express.User | false) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${config.getOrThrow<string>('BACKEND_URL')}/auth/github/callback`,
      scope: ['read:user', 'user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: DoneCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value ?? null;

    const user = await this.usersService.findOrCreate({
      provider: 'github',
      providerUserId: profile.id,
      email,
      displayName: profile.displayName ?? profile.username ?? 'GitHub User',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
    done(null, user);
  }
}
