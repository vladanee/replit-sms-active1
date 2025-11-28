import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendSmsSchema } from "@shared/schema";
import axios from "axios";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_KEY = process.env.TWILIO_API_KEY;
const TWILIO_SECRET = process.env.TWILIO_API_SECRET;
const TWILIO_PHONE = process.env.TWILIO_PHONE;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/config/status", (_req, res) => {
    const configured = !!(TWILIO_SID && TWILIO_KEY && TWILIO_SECRET && TWILIO_PHONE);
    res.json({
      configured,
      accountSid: TWILIO_SID ? `${TWILIO_SID.slice(0, 6)}...` : undefined,
      phoneNumber: TWILIO_PHONE,
    });
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

    if (!TWILIO_SID || !TWILIO_KEY || !TWILIO_SECRET || !TWILIO_PHONE) {
      await storage.addMessage({
        to,
        body,
        status: "failed",
        error: "Twilio credentials not configured",
      });
      return res.status(503).json({
        success: false,
        error: "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, and TWILIO_PHONE environment variables.",
      });
    }

    try {
      const params = new URLSearchParams();
      params.append("To", to);
      params.append("From", TWILIO_PHONE);
      params.append("Body", body);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        params,
        {
          auth: {
            username: TWILIO_KEY,
            password: TWILIO_SECRET,
          },
        }
      );

      await storage.addMessage({
        to,
        body,
        status: "sent",
        sid: response.data.sid,
      });

      res.json({ success: true, sid: response.data.sid });
    } catch (error: any) {
      console.error("Twilio Error:", error.response?.data || error.message);
      
      const twilioError = error.response?.data;
      const statusCode = error.response?.status || 500;
      const errorMessage = twilioError?.message || error.message || "Failed to send SMS";
      const errorCode = twilioError?.code;
      
      await storage.addMessage({
        to,
        body,
        status: "failed",
        error: errorCode ? `[${errorCode}] ${errorMessage}` : errorMessage,
      });

      if (statusCode === 401) {
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
