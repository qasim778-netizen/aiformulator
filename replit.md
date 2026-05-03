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
- **SEO Name Optimization**: Automatic name optimization for formulations using rule-based transformations and optional AI enhancement

### Database Design
The application uses a PostgreSQL database with Drizzle ORM for type-safe database operations:

- **Categories Table**: Stores product categories with metadata (name, description, icon, image)
- **Formulations Table**: Contains detailed formulation data including ingredients, instructions, technical specifications, and auto-generated thumbnail paths
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
- **PostgreSQL with pg.Pool**: Connection pooling (max 5 connections) for efficient database access on Reserved VM
- **Connection Management**: PostgreSQL session store for session management
- **In-Memory Cache**: TTL-based caching for categories, formulations, and sample products to reduce database load

### Performance Optimizations
- **Connection Pooling**: pg.Pool with max 5 connections, 30s idle timeout, 10s connection timeout
- **Cache Warming**: Preloads categories and formulations on startup
- **TTL Cache**: Categories (1 hour), Formulations (30 minutes) with automatic invalidation on mutations
- **Bot Detection**: Middleware to identify crawlers and serve cached content

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
- **OpenAI API**: AI-powered formulation generation and optional name optimization

## Key Features

### Quick Start Generation
The wizard landing page features a **Quick Start** hero card at the top that lets users generate a formula from just a product name, bypassing the multi-step wizard entirely:

- **Single-input flow**: User types a product name (e.g., "Vitamin C Serum") and clicks "Generate Formula"
- **Smart defaults**: Consistency type, viscosity, volume, pH, shelf life, storage temp, and budget tier are inferred automatically from the product name using keyword detection
- **Fallback for category/product type readiness**: Works even when the structured category/product type system is incomplete or DB-empty, so users always have a path to value
- **Same backend**: Hits `/api/ai/custom-formulation` with full smart-defaulted payload, navigates to `/formulation-confirmation/:id` on success
- **90s timeout** with friendly error messaging
- **Detailed wizard** remains available below the Quick Start as "Or create with more details (optional)"

### Master System File V3 (Category-Based Page Generator)
The system uses a sophisticated Master System File V3 that generates formulation pages based on CATEGORY (not formula name). Key components include:

- **Page Strategy Block**: Every page starts with Entity Classification (Category, Type, Application, Industry), Tone Profile, Structure Pattern, and Keywords
- **Tone Engine V1**: 11 category-specific tones including Construction (technical/engineering), Cleaning (functional/performance), Automotive (premium/detailer), Beauty (soft/sensory), Oral Care (clinical/friendly), Baby Care (gentle/protective), and more
- **Structure Variation Engine V1**: 7 category-specific patterns:
  - PATTERN-CONST-A/B: Construction/Adhesives/Building Materials
  - PATTERN-CLINICAL-A: Oral Care/Probiotics
  - PATTERN-BEAUTY-A: Cosmetics/Skin/Hair
  - PATTERN-CLEAN-A: Cleaning/Industrial Products
  - PATTERN-AUTO-A: Automotive/Car Care
  - PATTERN-BABY-A: Baby/Sensitive/Pet Care
- **CTA Engine**: Category-appropriate calls to action (e.g., "custom technical formulation" for construction, "brand-ready formula" for cosmetics)
- **Anti-Duplication Engine**: Ensures content uniqueness across 40+ products with varied vocabulary and sentence structures

### Automatic SEO Name Optimization
The system includes an intelligent name optimizer that automatically improves formulation names during generation:

- **Rule-Based Optimization**: Fast transformation of low-quality names using category-specific patterns
- **Quality Detection**: Identifies names that need optimization (less than 40 characters, low-value keywords, missing descriptors)
- **Professional Enhancement**: Adds industry-appropriate descriptors (Professional, Industrial-Grade, Premium, etc.) based on category
- **Character Limit**: Ensures all names stay under 60 characters for optimal SEO performance
- **Bulk Generation Support**: Optimizes names during both single and bulk formulation generation
- **AI Enhancement**: Optional OpenAI integration for advanced name transformation when needed

The name optimizer processes names like "glass cleaner formula" into professional titles like "Professional Glass Cleaner Formula" or "Commercial-Grade Glass Cleaner Formula" based on the category context.

### Knowledge Hub Blog System
The system includes a comprehensive blog/knowledge hub for how-to guides and educational content:

- **Blog Listing Page** (`/blog`): Hero section, category tabs, featured guides section, article grid with region filtering
- **Blog Article Page** (`/blog/:slug`): Breadcrumbs, structured content, CTA sections, related articles
- **Admin Blog Management**: Full CRUD for blog posts with controlled taxonomy validation

**Blog Categories** (7 total): Skincare, Hair Care, Cleaning Products, Adhesives, Industrial, Ingredients, Business

**Product Types** (6 total): Shampoo, Serum, Cream, Gel, Liquid, Powder

**Validation Rules**:
- Shampoo products can ONLY be in Hair Care category
- Serum products can ONLY be in Skincare category

**SEO Structured Data**:
- CollectionPage schema for blog listing
- BlogPosting schema for individual articles
- BreadcrumbList schema for navigation
- HowTo schema for step-by-step guides
- FAQPage schema for Q&A content

### Automatic Thumbnail Generation
The system includes server-side image processing for optimized thumbnails:

- **Single Upload Flow**: Admin uploads one image per formulation; the system auto-generates an optimized 400x300 JPEG thumbnail
- **Server-Side Processing**: Uses `sharp` library to resize and compress images on upload
- **Storage**: Both full-size image and thumbnail stored in object storage with public ACL
- **Listing Optimization**: Category/browse pages use thumbnails for faster page loads; detail pages show the full-size original
- **Bulk Generation**: Admin endpoint (`POST /api/admin/generate-thumbnails`) to retroactively create thumbnails for existing formulations
- **Graceful Fallback**: If thumbnail generation fails, the system continues with the full-size image only

The architecture demonstrates a modern full-stack approach with emphasis on type safety, developer experience, and scalable design patterns suitable for chemical formulation management requirements.