# Swagger API Documentation

## Overview

The FeelGive backend API now includes comprehensive Swagger/OpenAPI documentation for all endpoints.

## Accessing the Documentation

Once the server is running, you can access the interactive API documentation at:

**Local Development:** http://localhost:3001/api-docs

**Production:** https://your-domain.com/api-docs

## Features

### Interactive API Explorer
- Test all API endpoints directly from the browser
- View request/response schemas
- See example payloads
- Understand required vs optional parameters

### Comprehensive Documentation
The Swagger documentation includes:

1. **Donations Endpoints**
   - POST `/api/v1/donations` - Create a new donation
   - GET `/api/v1/donations` - Get all donations with filters
   - GET `/api/v1/donations/stats` - Get donation statistics
   - GET `/api/v1/donations/monthly-total` - Get monthly donation total

2. **Users Endpoints**
   - GET `/api/v1/users` - Get or create user by email
   - PATCH `/api/v1/users/preferences` - Update user preferences
   - GET `/api/v1/users/profile` - Get user profile with stats

3. **Classifications Endpoints**
   - POST `/api/v1/classifications` - Create a new classification
   - GET `/api/v1/classifications` - Get classifications with filters
   - GET `/api/v1/classifications/by-article` - Get classification by article URL
   - GET `/api/v1/classifications/stats` - Get classification statistics

4. **Health Endpoints**
   - GET `/health` - Health check endpoint
   - GET `/` - API root with endpoint listing

### Schema Definitions

All request and response schemas are fully documented, including:
- **Donation** - Complete donation object with all fields
- **User** - User profile and preferences
- **Classification** - Content classification with cause analysis
- **Error** - Standard error response format

## Using the Documentation

### Testing Endpoints

1. Navigate to http://localhost:3001/api-docs
2. Click on any endpoint to expand it
3. Click "Try it out" button
4. Fill in the required parameters
5. Click "Execute" to send the request
6. View the response below

### Example: Creating a Donation

1. Expand `POST /api/v1/donations`
2. Click "Try it out"
3. Modify the request body:
```json
{
  "charityId": "red-cross",
  "charityName": "American Red Cross",
  "charitySlug": "american-red-cross",
  "amount": 25,
  "cause": "disaster_relief",
  "geo": "US-CA",
  "geoName": "California, USA",
  "articleUrl": "https://example.com/article",
  "articleTitle": "Wildfire Relief Needed",
  "userEmail": "donor@example.com"
}
```
4. Click "Execute"
5. View the response with the created donation

## Configuration

The Swagger configuration is located in [`backend/src/config/swagger.ts`](./src/config/swagger.ts).

### Customization Options

You can customize:
- API title and description
- Server URLs (development/production)
- Contact information
- API version
- Custom CSS styling

### Adding New Endpoints

When adding new endpoints, include JSDoc comments with Swagger annotations:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [YourTag]
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint', async (req, res) => {
  // Your handler code
});
```

## Dependencies

The Swagger integration uses:
- `swagger-jsdoc` - Generates OpenAPI spec from JSDoc comments
- `swagger-ui-express` - Serves the Swagger UI interface
- `@types/swagger-jsdoc` - TypeScript types
- `@types/swagger-ui-express` - TypeScript types

## Benefits

1. **Developer Experience** - Easy to understand and test API endpoints
2. **Documentation** - Always up-to-date with the code
3. **Client Generation** - Can generate client SDKs from the spec
4. **API Design** - Helps maintain consistent API design
5. **Onboarding** - New developers can quickly understand the API

## OpenAPI Specification

The raw OpenAPI 3.0 specification is available at:
- http://localhost:3001/api-docs/swagger.json (when implemented)

This can be imported into tools like:
- Postman
- Insomnia
- API testing frameworks
- Code generators

## Security Note

In production, consider:
- Adding authentication to the `/api-docs` endpoint
- Disabling Swagger in production if not needed
- Using environment variables to control Swagger availability

## Troubleshooting

### Swagger UI Not Loading
- Check that the server is running on the correct port
- Verify no CORS issues in browser console
- Ensure all dependencies are installed

### Missing Endpoints
- Verify JSDoc comments are properly formatted
- Check that route files are included in `swagger.ts` apis array
- Restart the server after adding new documentation

### Schema Validation Errors
- Ensure all required fields are marked in schemas
- Check enum values match actual implementation
- Verify data types are correct

## Future Enhancements

Potential improvements:
- Add authentication/authorization documentation
- Include more example requests/responses
- Add webhook documentation
- Generate client SDKs automatically
- Add API versioning documentation