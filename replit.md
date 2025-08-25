# AIFormulator - Chemical Formulation Management System

## Overview

AIFormulator is a web application for managing professional chemical formulations targeted at small business manufacturers. The system provides a comprehensive database of ready-to-use formulations across multiple product categories including skincare, beauty products, oral care, and more. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript and implements a single-page application (SPA) architecture:

- **UI Framework**: React with TypeScript for type safety and better development experience
- **Styling**: Tailwind CSS with shadcn/ui components for consistent, modern design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Build Tool**: Vite for fast development and optimized production builds

The component structure follows a modular approach with reusable UI components and page-specific components organized in separate directories.

### Backend Architecture
The backend follows a RESTful API design pattern using Express.js:

- **Framework**: Express.js for HTTP server and middleware handling
- **Data Layer**: Abstracted storage interface with in-memory implementation for development
- **API Design**: RESTful endpoints for categories and formulations with proper HTTP status codes
- **Validation**: Zod schemas for request/response validation and type inference
- **Development Setup**: Integrated Vite development server with hot module replacement

### Database Design
The application uses a PostgreSQL database with Drizzle ORM for type-safe database operations:

- **Categories Table**: Stores product categories with metadata (name, description, icon, image)
- **Formulations Table**: Contains detailed formulation data including ingredients, instructions, and technical specifications
- **Schema Management**: Drizzle-kit for database migrations and schema evolution
- **Relationships**: Foreign key relationships between formulations and categories

Key design decisions include storing complex data (ingredients, instructions) as JSON strings for flexibility while maintaining relational integrity for core entities.

### Authentication and Authorization
Currently, the system operates without authentication, indicating it's designed for internal use or as a demonstration. The architecture supports future integration of authentication middleware.

### Development and Production Setup
The application is configured for both development and production environments:

- **Development**: Integrated Vite dev server with Express API for seamless full-stack development
- **Production**: Separate build processes for frontend (static assets) and backend (bundled Node.js application)
- **Environment Configuration**: Environment-based database connection and feature flags

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database service (@neondatabase/serverless)
- **Connection Management**: PostgreSQL session store for potential future session management

### UI and Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives for building the component library
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Icon library providing consistent iconography throughout the application

### Development Tools
- **Vite**: Build tool and development server with plugin ecosystem for React development
- **TypeScript**: Static typing for improved code quality and developer experience
- **ESBuild**: Fast bundler for production builds

### Data Management
- **Drizzle ORM**: Type-safe ORM for PostgreSQL with excellent TypeScript integration
- **TanStack Query**: Server state management with automatic caching, background updates, and optimistic updates
- **Zod**: Schema validation library for runtime type checking and form validation

### Additional Utilities
- **Date-fns**: Date manipulation library for handling temporal data
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **React Hook Form**: Performant forms with easy validation integration

The architecture demonstrates a modern full-stack approach with emphasis on type safety, developer experience, and scalable design patterns suitable for chemical formulation management requirements.