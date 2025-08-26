# Webhook Implementation Documentation

## Overview

This implementation provides a modular, functional approach to handling GHL (GoHighLevel) webhook events. The system is designed to process three types of contact-related webhooks: `ContactCreate`, `ContactUpdate`, and `ContactDelete`.

## Architecture

### Functional Programming Approach

The implementation follows functional programming principles:

- **Pure Functions**: Each handler is a pure function that takes webhook data and returns a Promise
- **Immutability**: Data is not mutated, new objects are created when needed
- **Composition**: Functions are composed together to create the processing pipeline
- **Separation of Concerns**: Business logic is separated from HTTP handling

### File Structure

```
src/
├── controllers/
│   └── webhookController.ts      # HTTP request handling
├── services/
│   └── webhookService.ts         # Business logic and handlers
├── config/
│   └── webhookConfig.ts          # Configuration settings
├── types.ts                      # TypeScript type definitions
└── tests/
    └── webhookHandlers.test.ts   # Test examples
```

## Webhook Types

### 1. ContactCreate

- **Purpose**: Handles new contact creation events
- **Action**: Calls GHL API to get contact details and logs the response
- **API Call**: `GET /contacts/{contactId}`

### 2. ContactUpdate

- **Purpose**: Handles contact update events
- **Action**: Calls GHL API to get updated contact details and logs the response
- **API Call**: `GET /contacts/{contactId}`

### 3. ContactDelete

- **Purpose**: Handles contact deletion events
- **Action**: Logs deletion event (no API call required)
- **Output**: "Reached Deletion for contact: {contactId}"

## Implementation Details

### Core Functions

#### `processWebhook(webhookData: ContactWebhookData): Promise<void>`

- Main orchestrator function
- Routes webhook to appropriate handler based on type
- Throws error for unsupported webhook types

#### `validateWebhookData(data: any): data is ContactWebhookData`

- Type guard function for runtime validation
- Ensures required fields are present and valid
- Returns boolean indicating if data is valid

#### `getContactFromGHL(locationId: string, contactId: string): Promise<GHLContactResponse>`

- Makes authenticated API calls to GHL
- Includes retry logic with exponential backoff
- Handles token refresh automatically

### Error Handling

- **Retry Logic**: API calls are retried up to 3 times with exponential backoff
- **Validation**: Input data is validated before processing
- **Logging**: Comprehensive logging with timestamps
- **Graceful Degradation**: Errors are logged but don't crash the system

### Configuration

The system is configurable through `webhookConfig`:

```typescript
{
  supportedTypes: ["ContactCreate", "ContactUpdate", "ContactDelete"],
  defaultCompanyId: process.env.DEFAULT_COMPANY_ID,
  logging: { enabled: true, level: "info" },
  ghl: { apiVersion: "2021-07-28", timeout: 30000 },
  processing: { retryAttempts: 3, retryDelay: 1000 }
}
```

## Usage

### Basic Usage

```typescript
import { processWebhook, validateWebhookData } from "./services/webhookService";

// In your Express route handler
app.post("/webhook", async (req, res) => {
  try {
    if (!validateWebhookData(req.body)) {
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    await processWebhook(req.body);
    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Processing failed" });
  }
});
```

### Testing

```typescript
import {
  testWebhookHandlers,
  demonstrateWebhookProcessing,
} from "./tests/webhookHandlers.test";

// Run tests
await testWebhookHandlers();

// See example data
demonstrateWebhookProcessing();
```

## Environment Variables

Required environment variables:

- `DEFAULT_COMPANY_ID`: Default company ID for GHL API calls
- `LOG_LEVEL`: Logging level (default: "info")
- GHL API credentials (handled by existing GHL class)

## Benefits of This Implementation

1. **Modularity**: Each webhook type has its own handler function
2. **Testability**: Pure functions are easy to test in isolation
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Easy to add new webhook types
5. **Reliability**: Built-in retry logic and error handling
6. **Type Safety**: Full TypeScript support with type guards

## Adding New Webhook Types

To add a new webhook type:

1. Add the type to `webhookConfig.supportedTypes`
2. Create a new handler function in `webhookService.ts`
3. Add the handler to `webhookHandlers` mapping
4. Update the `ContactWebhookData` type in `types.ts`
5. Add tests in `webhookHandlers.test.ts`

## Example Webhook Data

### ContactCreate

```json
{
  "type": "ContactCreate",
  "locationId": "wP3Ynm3Z63rIC4zVAgXP",
  "id": "m8614FnsFfCr3exNY8HB",
  "firstName": "Suneet",
  "lastName": "B",
  "email": "suneetb@gmail.com",
  "timestamp": "2025-08-26T11:36:43.463Z",
  "webhookId": "9062e8fb-8994-4b3c-bd91-280b42011652"
}
```

### ContactUpdate

```json
{
  "type": "ContactUpdate",
  "locationId": "wP3Ynm3Z63rIC4zVAgXP",
  "id": "m8614FnsFfCr3exNY8HB",
  "firstName": "Suneetaa",
  "lastName": "B",
  "email": "suneetb@gmail.com",
  "timestamp": "2025-08-26T11:38:13.699Z",
  "webhookId": "8656d90d-416a-459e-93b6-6a6297811592"
}
```

### ContactDelete

```json
{
  "type": "ContactDelete",
  "locationId": "wP3Ynm3Z63rIC4zVAgXP",
  "id": "m8614FnsFfCr3exNY8HB",
  "firstName": "Suneetaa",
  "lastName": "B",
  "email": "suneetb@gmail.com",
  "timestamp": "2025-08-26T11:44:23.049Z",
  "webhookId": "99dbc1a4-5467-4239-b78c-66be5c83d8c3"
}
```
