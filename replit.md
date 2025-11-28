# Twilio SMS Proxy - API Gateway

## Overview

This is a developer-focused web application that serves as an API proxy for sending SMS messages via Twilio. The application provides a testing interface for developers to send SMS messages and monitor delivery status. It's designed as a utility tool with emphasis on clarity, efficiency, and trust - following design patterns inspired by Stripe Dashboard and Twilio Console.

The application features a single-page dashboard with an API testing panel, configuration status monitoring, and recent message activity tracking. It's built to help developers test SMS integration and validate their Twilio setup.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **Form Management**: React Hook Form with Zod validation
- **UI Framework**: Radix UI components with shadcn/ui design system

**Design System**:
- Style approach: "New York" variant from shadcn/ui
- Tailwind CSS for styling with custom design tokens
- Typography: Inter font family for UI, monospace for code/technical elements
- Color system: HSL-based with CSS variables for theme flexibility
- Spacing: Consistent Tailwind units (4, 6, 8, 12, 16)

**Component Architecture**:
- Comprehensive component library from Radix UI (30+ components)
- Custom utility components for domain-specific UI
- Form validation using Zod schemas shared between client and server

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM module system
- **Build Tool**: esbuild for server bundling, Vite for client bundling
- **Development**: tsx for TypeScript execution in development

**API Design**:
- RESTful endpoints under `/api` prefix
- Three main endpoints:
  - `GET /api/config/status` - Check Twilio configuration status
  - `GET /api/messages` - Retrieve message history
  - `POST /api/send-sms` - Send SMS via Twilio proxy

**Storage Layer**:
- In-memory storage implementation (MemStorage class)
- Interface-based design (IStorage) allowing future database integration
- Message storage includes: id, to, body, status, sid, error, timestamp

**Validation**:
- Shared Zod schemas between client and server
- Phone number validation with international format support
- Message body length limits (1600 characters)

### Data Storage Solutions

**Current Implementation**: In-memory storage
- Simple Map-based storage for development/testing
- No persistence between server restarts
- Suitable for lightweight testing scenarios

**Database Ready**:
- Drizzle ORM configured for PostgreSQL
- Migration system in place (`drizzle.config.ts`)
- Schema defined in `shared/schema.ts`
- Neon Database serverless driver included
- Session store configured with `connect-pg-simple`

**Rationale**: The application uses in-memory storage for simplicity but is architecturally prepared for database integration. The storage interface abstraction allows seamless transition to persistent storage when needed.

### External Dependencies

**Twilio Integration**:
- **Service**: Twilio SMS API
- **Authentication**: API Key/Secret + Account SID
- **Configuration**: Environment variables
  - `TWILIO_ACCOUNT_SID`: Account identifier
  - `TWILIO_API_KEY`: API key for authentication
  - `TWILIO_API_SECRET`: API secret for authentication
  - `TWILIO_PHONE`: Sender phone number
- **API Communication**: Axios HTTP client with Basic Auth
- **Endpoint**: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`

**Database Services**:
- **Neon Database**: Serverless PostgreSQL (configured but optional)
- **Driver**: `@neondatabase/serverless`
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Via `DATABASE_URL` environment variable

**Build & Development Tools**:
- **Vite**: Frontend build tool with React plugin
- **Replit Plugins**: Development environment enhancements (cartographer, dev banner, runtime error overlay)
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TypeScript**: Type checking across full stack

**Design System Dependencies**:
- **Radix UI**: Headless component primitives (~25 packages)
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component patterns
- **class-variance-authority**: Type-safe component variants
- **Lucide React**: Icon library

**Form & Validation**:
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

**Key Architectural Decisions**:

1. **Shared Schema Approach**: Zod schemas are defined in `shared/schema.ts` and imported by both client and server, ensuring type safety and validation consistency across the full stack.

2. **Interface-Based Storage**: The storage layer uses an `IStorage` interface, making it easy to swap in-memory storage for a database without changing business logic.

3. **Environment-Based Configuration**: Twilio credentials are managed via environment variables with graceful degradation - the app shows configuration status and allows testing without full Twilio setup.

4. **Monorepo Structure**: Client and server code share TypeScript configuration and schemas, reducing duplication and ensuring consistency.

5. **Developer-First Design**: Following Stripe/Twilio design patterns prioritizes information hierarchy, trustworthiness, and immediate utility over visual complexity.