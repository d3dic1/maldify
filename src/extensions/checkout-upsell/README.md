# Maldify Checkout Upsell Extension

AI-powered checkout upsell extension that recommends products based on cart contents.

## Features

- **AI Recommendations**: Uses backend API to generate product recommendations
- **Cart Integration**: Automatically detects products in cart
- **Smart Targeting**: Shows relevant upsell offers based on cart contents
- **User Control**: Users can dismiss offers or add recommended products
- **Persistent State**: Remembers dismissed offers during checkout session

## API Integration

The extension calls `/api/checkout/recommendation` with cart product IDs and displays the returned recommendations.

## Configuration

The extension can be configured through Shopify admin with the following settings:

- **Upsell Title**: Custom title for the upsell offer
- **Upsell Description**: Description text for the offer
- **Button Text**: Text for the "Add to Cart" button

## Development

```bash
# Build the extension
npm run build

# Run in development mode
npm run dev
```
