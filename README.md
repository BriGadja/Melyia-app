# Melyia Frontend - Medical AI Assistant Landing Page

A modern React frontend for Melyia, an AI assistant designed for dental professionals. This application features a medical-themed landing page with waitlist functionality.

## Features

- **Professional Medical Theme**: Clean, modern design tailored for healthcare professionals
- **Responsive Design**: Mobile-first approach with responsive navigation
- **Waitlist Integration**: Form with validation that calls external API endpoints
- **French Language Interface**: Specifically designed for French-speaking dental professionals
- **Animated UI Elements**: Smooth animations and floating cards for enhanced user experience

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS with custom medical theme
- **Forms**: React Hook Form + Zod validation
- **API**: TanStack Query for data fetching
- **Routing**: Wouter for client-side routing
- **Icons**: Lucide React

## Setup Instructions

### 1. Configure API Endpoint

The application is configured to call an external API for waitlist submissions. Update the API endpoint in the `.env` file:

```bash
# Update this to your actual webhook endpoint
VITE_API_BASE_URL=https://dev.melyia.com/api
```

Alternative endpoints for testing:
```bash
# For webhook testing
VITE_API_BASE_URL=https://webhook.site/your-unique-id

# For development testing
VITE_API_BASE_URL=https://httpbin.org/post
```

### 2. API Endpoint Requirements

Your API endpoint (`/waitlist`) should accept POST requests with this JSON structure:

```json
{
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "phone": "string",
  "practiceName": "string (optional)",
  "comments": "string (optional)"
}
```

### 3. Running the Application

The application runs on port 5000 and is accessible at the Replit URL.

## Project Structure

```
client/src/
├── components/
│   ├── ui/                 # Radix UI components
│   └── waitlist-form.tsx   # Main waitlist form component
├── pages/
│   ├── home.tsx           # Landing page
│   └── not-found.tsx      # 404 page
├── lib/
│   ├── queryClient.ts     # API configuration
│   └── utils.ts          # Utility functions
├── hooks/
│   └── use-toast.ts      # Toast notifications
└── App.tsx               # Main app component
```

## Key Components

### Waitlist Form
- Form validation using Zod schemas
- Real-time error handling
- Success/error states with user feedback
- Professional styling with medical theme

### Landing Page
- Hero section with call-to-action
- Animated feature cards
- Responsive navigation
- Professional medical imagery

## Deployment

This is a frontend-only application that can be deployed to any static hosting service. The build output will be in the `dist/` folder after running the build command.

## API Integration Notes

- The form sends data to `${API_BASE_URL}/waitlist`
- Error handling includes specific messages for connection issues
- Console logging is included for debugging API calls
- The application gracefully handles API endpoint unavailability

## Customization

To modify the API endpoint or add additional form fields:

1. Update the schema in `shared/schema.ts`
2. Modify the form component in `client/src/components/waitlist-form.tsx`
3. Update the API base URL in `.env`