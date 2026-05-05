import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import type { RequestHandler } from 'express';
import type { Server, ServerOptions } from 'socket.io';

export class SessionIoAdapter extends IoAdapter {
  constructor(
    private readonly app: INestApplication,
    private readonly sessionMiddleware: RequestHandler,
    private readonly passportInit: RequestHandler,
    private readonly passportSession: RequestHandler,
    private readonly frontendUrl: string,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.frontendUrl, credentials: true },
    }) as Server;

    // engine.use() runs on every raw HTTP request (polling + WS upgrade),
    // giving express-session a proper req/res pair so it can read/write cookies.
    server.engine.use(this.sessionMiddleware);
    server.engine.use(this.passportInit);
    server.engine.use(this.passportSession);

    return server;
  }
}
