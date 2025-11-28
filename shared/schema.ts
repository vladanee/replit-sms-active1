import { z } from "zod";

export const sendSmsSchema = z.object({
  to: z.string().min(1, "Phone number is required").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  body: z.string().min(1, "Message is required").max(1600, "Message too long"),
});

export type SendSmsRequest = z.infer<typeof sendSmsSchema>;

export interface SmsMessage {
  id: string;
  to: string;
  body: string;
  status: "sent" | "failed" | "pending";
  sid?: string;
  error?: string;
  timestamp: Date;
}

export interface SmsResponse {
  success: boolean;
  sid?: string;
  error?: string;
}

export interface ConfigStatus {
  configured: boolean;
  accountSid?: string;
  phoneNumber?: string;
}
