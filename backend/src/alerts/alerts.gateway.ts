import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Server, Socket } from 'socket.io';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { ALERTS_QUEUE, ALERT_JOB_OPTIONS } from './alerts.constants.js';

export { ALERTS_QUEUE };

const VALID_THRESHOLDS = [50, 80, 100] as const;
type Threshold = (typeof VALID_THRESHOLDS)[number];

function isValidThreshold(value: unknown): value is Threshold {
  return VALID_THRESHOLDS.includes(value as Threshold);
}

@WebSocketGateway({ namespace: '/alerts' })
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectQueue(ALERTS_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const req = client.request as Request;
    const user = req.user as { id: string } | undefined;
    if (!user) {
      client.disconnect();
      return;
    }

    (client.data as Record<string, unknown>).userId = user.id;
    await client.join(user.id);
  }

  handleDisconnect(): void {}

  @SubscribeMessage('subscribe')
  async handleSubscribe(client: Socket): Promise<void> {
    const userId = (client.data as Record<string, unknown>).userId as
      | string
      | undefined;
    if (!userId) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    await this.queue.add(
      'evaluate-alerts',
      { userId, year, month, isReconnect: true },
      { ...ALERT_JOB_OPTIONS, jobId: `alerts-${userId}-${year}-${month}` },
    );
  }

  @SubscribeMessage('ack')
  async handleAck(client: Socket, payload: unknown): Promise<void> {
    const userId = (client.data as Record<string, unknown>).userId as
      | string
      | undefined;
    if (!userId) return;

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('threshold' in payload) ||
      !isValidThreshold((payload as Record<string, unknown>)['threshold'])
    )
      return;

    const threshold = (payload as { threshold: Threshold }).threshold;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    await this.prisma.budgetAlertTrigger.updateMany({
      where: { userId, year, month, threshold, ackedAt: null },
      data: { ackedAt: new Date() },
    });
  }

  emitToUser(userId: string, threshold: number): void {
    this.server.to(userId).emit('budget-alert', { threshold });
  }
}
