import { randomUUID } from 'node:crypto';

export type Delivery = { status: 'simulated' | 'accepted' | 'delivered' | 'failed' | 'unknown'; providerId: string };
export interface SmsProvider {
  readonly mode: 'mock' | 'live';
  send(input: { phone: string; message: string; idempotencyKey: string }): Promise<Delivery>;
  getDeliveryStatus(providerId: string): Promise<Delivery>;
}

export class MockSmsProvider implements SmsProvider {
  readonly mode = 'mock';
  async send(_input: { phone: string; message: string; idempotencyKey: string }): Promise<Delivery> {
    return { status: 'simulated', providerId: `mock-${randomUUID()}` };
  }
  async getDeliveryStatus(providerId: string): Promise<Delivery> {
    return { status: providerId.startsWith('mock-') ? 'simulated' : 'unknown', providerId };
  }
}
