# Builder.Contractors - Global Partner Platform

## Overview

Builder.Contractors (www.builder.contractors) is a global full-stack React application built for managing contractor partnerships, leads, and services in the construction and building industry. The platform features role-based access control with different dashboards for sales partners, builders, and administrators. The frontend is built with React, TypeScript, and Tailwind CSS using shadcn/ui components, while the backend uses Express.js with Drizzle ORM and PostgreSQL.

The platform is designed to work internationally, supporting contractors and builders from any country to collaborate, share leads, and manage work contracts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React Context for authentication
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions
- **File Structure**: Monorepo with shared schemas between client and server

### Authentication & Authorization
- **Current Implementation**: Firebase Authentication with Firestore
- **Planned Migration**: The codebase shows preparation for moving to a custom auth system
- **User Roles**: Four distinct roles (sales, builder, admin, dual) with different access levels
- **Approval System**: Admin-controlled user approval workflow

## Key Components

### Database Schema (Drizzle)
- **Users Table**: Stores user profiles with roles and approval status
- **Leads Table**: Central entity for managing client leads with status tracking
- **Lead Comments**: Threaded comments system for lead collaboration  
- **Services Table**: Catalog of services offered by builders
- **Custom Pricing**: Partner-specific pricing overrides
- **Activity Logs**: Audit trail for lead changes

### Frontend Components
- **Dashboard Pages**: Role-specific dashboards for different user types
- **Lead Management**: Card-based lead display with modal editing
- **Service Management**: CRUD interface for service catalog
- **User Approval Panel**: Admin interface for approving new users
- **Protected Routes**: Role-based route protection with approval checks

### Backend Services
- **Storage Interface**: Abstracted storage layer (currently in-memory, prepared for database)
- **Route Registration**: Modular route handling system
- **Development Server**: Vite integration for HMR in development

## Data Flow

1. **Authentication Flow**: Firebase Auth → User profile lookup → Role-based routing
2. **Lead Management**: Create/Read/Update leads → Comments/Files → Activity logging
3. **Service Management**: Builder creates services → Custom pricing → Lead association
4. **Approval Workflow**: User registration → Admin approval → Access granted

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (serverless PostgreSQL)
- **Authentication**: Firebase (Auth, Firestore, Storage)
- **UI Components**: Radix UI primitives via shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date formatting and manipulation

### Development Tools
- **Build**: Vite with React plugin and TypeScript support
- **Database**: Drizzle Kit for migrations and schema management
- **Styling**: Tailwind CSS with PostCSS
- **Development**: tsx for TypeScript execution, esbuild for production builds

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express backend
- **Hot Reloading**: Full-stack HMR with Vite middleware integration
- **Database**: Drizzle migrations with development database

### Production
- **Build Process**: 
  1. Vite builds React frontend to `dist/public`
  2. esbuild bundles Express server to `dist/index.js`
- **Hosting**: Designed for Replit deployment with environment variable configuration
- **Database**: Production PostgreSQL via DATABASE_URL environment variable
- **Static Assets**: Served through Express static middleware

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Firebase**: Multiple environment variables for Firebase service configuration
- **Build**: `NODE_ENV` for development/production switching

The application is architected as a modern full-stack TypeScript application with clear separation of concerns, role-based access control, and a focus on construction industry partner management workflows.

## Branding

- **Platform Name**: Builder.Contractors
- **Domain**: www.builder.contractors
- **Target Market**: Global construction and building industry
- **Key Value Proposition**: Connecting builders and contractors worldwide to share leads, exchange work opportunities, and support each other's growth