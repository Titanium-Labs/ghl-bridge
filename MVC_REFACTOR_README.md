# MVC Refactoring Documentation

This document outlines the refactoring of the Express.js application from a single-file structure to a proper MVC (Model-View-Controller) pattern.

## New Project Structure

```
src/
├── controllers/          # Business logic layer
│   ├── authController.ts
│   ├── contactsController.ts
│   ├── webhookController.ts
│   └── pageController.ts
├── routes/              # Route definitions
│   ├── authRoutes.ts
│   ├── contactsRoutes.ts
│   ├── webhookRoutes.ts
│   ├── pageRoutes.ts
│   └── index.ts
├── services/            # Service layer
│   └── databaseService.ts
├── ghl.ts              # GHL API integration (existing)
├── model.ts            # Data models (existing)
├── types.ts            # TypeScript types (existing)
├── helpers/            # Helper functions (existing)
└── index.ts            # Main application entry point
```

## Changes Made

### 1. Controllers (`/controllers/`)

**authController.ts**

- `handleAuthorization()`: Handles OAuth authorization callback
- `decryptSSO()`: Decrypts SSO data using provided key

**contactsController.ts**

- `getContacts()`: Retrieves contacts with search functionality
- `getContactsByLocation()`: Location-based contact retrieval

**webhookController.ts**

- `handleWebhook()`: Processes incoming webhook events

**pageController.ts**

- `serveMainPage()`: Serves the main application page

### 2. Routes (`/routes/`)

**authRoutes.ts**

- `GET /authorize-handler`: OAuth authorization callback
- `POST /decrypt-sso`: SSO data decryption

**contactsRoutes.ts**

- `GET /get-contacts`: Contact search and retrieval
- `GET /example-api-call-location/:locationId`: Location-based contacts

**webhookRoutes.ts**

- `POST /example-webhook-handler`: Webhook event processing

**pageRoutes.ts**

- `GET /`: Main application page

**index.ts**

- Central route aggregator that mounts all route modules

### 3. Services (`/services/`)

**databaseService.ts**

- Singleton pattern for MongoDB connection management
- `connect()`: Establishes database connection
- `disconnect()`: Closes database connection

### 4. Main Application (`index.ts`)

- Simplified to focus on server setup and middleware configuration
- Uses the new route structure
- Integrates with the database service

## Benefits of the Refactoring

1. **Separation of Concerns**: Business logic is separated from routing logic
2. **Maintainability**: Each component has a single responsibility
3. **Scalability**: Easy to add new routes and controllers
4. **Testability**: Controllers can be unit tested independently
5. **Code Reusability**: Controllers can be reused across different routes
6. **Type Safety**: Maintains TypeScript support throughout

## Usage

The application maintains the same API endpoints and functionality as before:

- `GET /` - Main page
- `GET /authorize-handler` - OAuth callback
- `POST /decrypt-sso` - SSO decryption
- `GET /get-contacts` - Contact retrieval
- `GET /example-api-call-location/:locationId` - Location contacts
- `POST /example-webhook-handler` - Webhook processing

## Running the Application

The application can be run using the existing scripts:

```bash
# Development
npm run dev

# Build and start
npm run build
npm start
```

## Future Enhancements

1. **Middleware**: Add authentication, validation, and logging middleware
2. **Error Handling**: Implement centralized error handling
3. **Validation**: Add request validation using libraries like Joi or Zod
4. **Testing**: Add unit tests for controllers and integration tests for routes
5. **Documentation**: Add API documentation using Swagger/OpenAPI
