# Twilio SMS Proxy - Design Guidelines

## Design Approach: Developer Tool (Design System)
**Selected System**: Drawing from Stripe Dashboard + Twilio Console patterns
**Rationale**: Utility-focused developer tool requiring clarity, efficiency, and trust

## Core Design Principles
1. **Clarity First**: Information hierarchy over visual flair
2. **Trust Building**: Professional, secure appearance for API service
3. **Immediate Utility**: Testing interface prominently featured

---

## Layout & Structure

### Page Architecture
Single-page dashboard with three primary sections:
1. **Header Bar**: Branding + API status indicator
2. **Main Content Area**: Two-column layout (60/40 split on desktop)
   - Left: API Testing Panel
   - Right: Quick Documentation + Recent Activity
3. **Footer**: Minimal - links to docs and support

### Spacing System
Tailwind units: **4, 6, 8, 12, 16** for consistent rhythm
- Section padding: `py-8` or `py-12`
- Component gaps: `gap-6`
- Card padding: `p-6`

---

## Typography

### Font Stack
- **Primary**: Inter (via Google Fonts CDN)
- **Code/Monospace**: 'Courier New' or system monospace

### Hierarchy
- **Page Title**: `text-3xl font-bold`
- **Section Headers**: `text-xl font-semibold`
- **Body Text**: `text-base`
- **Labels**: `text-sm font-medium`
- **Code/Technical**: `text-sm font-mono`

---

## Component Library

### 1. API Testing Card
**Purpose**: Primary interaction - send test SMS
- Form with two inputs: Phone Number, Message Body
- Phone input with format helper text (+1234567890)
- Textarea for message body (character counter: 0/160)
- Prominent "Send SMS" button
- Response display area showing success/error with message SID

### 2. Credentials Panel
- Display boxes for:
  - Account SID (with copy button)
  - API Key (with copy button)  
  - Phone Number (with copy button)
- Masked values with "reveal" toggle
- Copy confirmation toast

### 3. Documentation Quick Reference
- Code snippet display with syntax highlighting
- cURL example for POST endpoint
- Response schema table
- Error codes reference

### 4. Recent Activity Feed
- Table displaying last 10 sent messages
- Columns: Timestamp, To Number (masked), Status, SID
- Status badges with icon indicators

### 5. Status Indicator
- Header-mounted connection status
- "Connected" (green) or "Configuration Required" (amber) badge

---

## Navigation & Controls

### Primary Actions
- **Send SMS Button**: Solid, prominent styling (`bg-blue-600 text-white px-6 py-3`)
- **Copy Buttons**: Small, icon-only with tooltip (`w-8 h-8`)

### Form Elements
- Input fields: Bordered style with focus states
- Labels positioned above inputs
- Helper text below inputs in muted styling
- Required field indicators (asterisk)

---

## Responsive Behavior

### Desktop (lg+)
- Two-column layout maintained
- All panels visible simultaneously

### Tablet (md)
- Stack to single column
- Testing panel first, documentation second

### Mobile
- Full-width components
- Simplified activity feed (show fewer columns)
- Sticky send button at bottom

---

## Content Strategy

### Hero/Header Area
**No large hero image** - This is a utility dashboard
- Simple header bar with logo/name and status
- Breadcrumb or quick action shortcuts

### Empty States
- When no messages sent yet: Illustration placeholder with "Send your first SMS" prompt
- When credentials missing: Clear setup instructions with numbered steps

---

## Accessibility & Quality
- All form fields with proper labels
- ARIA labels for icon-only buttons
- Keyboard navigation support for all interactive elements
- Focus indicators on all focusable elements
- Error messages announced to screen readers

---

## Technical Assets

### Icons
**Heroicons** (via CDN) for all UI icons:
- Paper airplane (send)
- Clipboard (copy)
- Check circle (success)
- Exclamation (error)

### No Custom Media
- No background images
- No decorative illustrations beyond simple empty state graphics
- Focus on functional clarity