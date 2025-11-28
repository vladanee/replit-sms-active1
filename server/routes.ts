import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendSmsSchema } from "@shared/schema";
import { getTwilioClient, getTwilioFromPhoneNumber, getTwilioStatus } from "./twilio";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/config/status", async (_req, res) => {
    try {
      const status = await getTwilioStatus();
      res.json(status);
    } catch (error) {
      res.json({ configured: false });
    }
  });

  app.get("/api/messages", async (_req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/send-sms", async (req, res) => {
    const result = sendSmsSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors.map(e => e.message).join(", "),
      });
    }

    const { to, body } = result.data;

    try {
      const client = await getTwilioClient();
      const fromNumber = await getTwilioFromPhoneNumber();

      if (!fromNumber) {
        await storage.addMessage({
          to,
          body,
          status: "failed",
          error: "Twilio phone number not configured",
        });
        return res.status(503).json({
          success: false,
          error: "Twilio phone number not configured. Please set up a phone number in your Twilio connection.",
        });
      }

      const message = await client.messages.create({
        to,
        from: fromNumber,
        body,
      });

      await storage.addMessage({
        to,
        body,
        status: "sent",
        sid: message.sid,
      });

      res.json({ success: true, sid: message.sid });
    } catch (error: any) {
      console.error("Twilio Error:", error.message || error);
      
      const errorMessage = error.message || "Failed to send SMS";
      const errorCode = error.code;
      const statusCode = error.status || 500;
      
      await storage.addMessage({
        to,
        body,
        status: "failed",
        error: errorCode ? `[${errorCode}] ${errorMessage}` : errorMessage,
      });

      if (errorMessage.includes("not connected") || errorMessage.includes("X_REPLIT_TOKEN")) {
        return res.status(503).json({
          success: false,
          error: "Twilio is not configured. Please set up the Twilio connection.",
        });
      }

      if (statusCode === 401 || errorCode === 20003) {
        return res.status(401).json({ 
          success: false, 
          error: "Invalid Twilio credentials",
          code: errorCode,
        });
      }

      if (statusCode >= 400 && statusCode < 500) {
        return res.status(statusCode).json({ 
          success: false, 
          error: errorMessage,
          code: errorCode,
        });
      }

      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        code: errorCode,
      });
    }
  });

  return httpServer;
}
