import { randomUUID } from "crypto";
import type { SmsMessage } from "@shared/schema";

export interface IStorage {
  addMessage(message: Omit<SmsMessage, "id" | "timestamp">): Promise<SmsMessage>;
  getMessages(): Promise<SmsMessage[]>;
}

export class MemStorage implements IStorage {
  private messages: Map<string, SmsMessage>;

  constructor() {
    this.messages = new Map();
  }

  async addMessage(message: Omit<SmsMessage, "id" | "timestamp">): Promise<SmsMessage> {
    const id = randomUUID();
    const smsMessage: SmsMessage = {
      ...message,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, smsMessage);
    return smsMessage;
  }

  async getMessages(): Promise<SmsMessage[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();
