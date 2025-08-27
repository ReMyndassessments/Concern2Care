# Concern2Care

## Overview

Concern2Care is a full-stack web application designed to help K-12 teachers document student concerns and receive AI-generated, evidence-based intervention strategies. The application streamlines the process of identifying student needs and provides actionable Tier 2 intervention recommendations, reducing documentation time while improving student outcomes.

The system allows teachers to:
- Document student concerns across various categories (academic, behavioral, social-emotional, attendance)
- Receive AI-generated intervention strategies from DeepSeek API
- Generate PDF reports of concerns and interventions
- Share reports via email with school staff
- Ask follow-up questions about interventions
- Track usage limits per teacher

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Authentication**: Session-based authentication integrated with Replit's OIDC system

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Custom session-based authentication with email/password login
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API endpoints with proper error handling and logging

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - `users`: Teacher profiles with usage tracking
  - `concerns`: Student concern documentation
  - `interventions`: AI-generated intervention strategies
  - `follow_up_questions`: Teacher questions and AI responses
  - `reports`: Generated PDF report metadata
  - `sessions`: Session storage for authentication

### AI Integration
- **Provider**: DeepSeek API for generating intervention strategies (NOT OpenAI)
- **API Management**: Database-managed API keys through admin interface
- **Prompt Engineering**: Structured prompts for evidence-based Tier 2 interventions
- **Response Processing**: JSON-formatted responses for consistent data structure  
- **Follow-up Support**: Contextual AI responses to teacher questions about interventions
- **Fallback System**: Mock data when no API key is configured

### File Generation & Sharing
- **PDF Generation**: PDFKit for creating formatted concern reports
- **Email Service**: Nodemailer with SMTP configuration for report sharing
- **File Management**: Server-side file storage with secure access patterns

### Development & Deployment
- **Development Server**: Vite dev server with HMR and error overlay
- **Build Process**: ESBuild for server bundling, Vite for client bundling
- **Environment**: Replit-optimized with development banners and cartographer integration
- **Type Safety**: Shared TypeScript schemas between client and server

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **DeepSeek API**: AI model for generating evidence-based intervention strategies (NOT OpenAI)
- **Custom Authentication**: Session-based authentication system with demo accounts for development

### Email & Communication
- **SMTP Service**: Configurable email service for sharing reports with school staff
- **SendGrid**: Alternative email service integration (configured but not actively used)

### Development Tools
- **Replit Cartographer**: Development environment mapping and navigation
- **Vite Plugin Runtime Error Modal**: Enhanced error display during development

### UI Component Libraries
- **Radix UI**: Headless component primitives for accessibility and behavior
- **Shadcn/ui**: Pre-built component library with consistent styling
- **Lucide React**: Icon library for UI elements

### Utility Libraries
- **Zod**: Runtime type validation and schema definition
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Date-fns**: Date manipulation and formatting
- **PDFKit**: PDF generation for concern reports
- **Memoizee**: Function memoization for performance optimization