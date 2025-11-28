# Twilio SMS Proxy

A simple API proxy for sending SMS messages via Twilio with a beautiful dashboard for testing and monitoring.

## Overview

This application provides:
- **REST API** - A POST endpoint (`/api/send-sms`) to send SMS messages
- **Dashboard** - A web interface for testing the API and viewing recent messages
- **Status Monitoring** - Real-time connection status indicator
- **Message History** - Track sent messages with status and timestamps

## API Usage

### Send SMS

```bash
POST /api/send-sms
Content-Type: application/json

{
  "to": "+1234567890",
  "body": "Your message text"
}
```

**Response (Success):**
```json
{
  "success": true,
  "sid": "SM..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Check Configuration Status

```bash
GET /api/config/status
```

### Get Message History

```bash
GET /api/messages
```

## Project Structure

```
├── client/src/
│   ├── pages/
│   │   └── dashboard.tsx    # Main dashboard with all UI components
│   ├── App.tsx              # App entry with routing
│   └── index.css            # Tailwind CSS with design tokens
├── server/
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # In-memory message storage
│   └── twilio.ts            # Twilio SDK integration
├── shared/
│   └── schema.ts            # Zod schemas and TypeScript types
└── design_guidelines.md     # UI/UX design specifications
```

## Technology Stack

- **Frontend**: React, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Twilio SDK
- **Validation**: Zod schemas shared between frontend and backend

## Configuration

The app uses Replit's native Twilio integration which automatically manages:
- Account SID
- API Key & Secret
- Phone Number

No manual environment variable setup required when using the Twilio connection.

## Recent Changes

- **2024**: Initial implementation with full dashboard UI
- Integrated official Twilio SDK via Replit connection
- Added form validation with react-hook-form and zodResolver
- Implemented credentials panel with masked values
- Added message history tracking with status indicators
