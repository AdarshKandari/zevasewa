# ZevaSewa

**A smart business management assistant for small shopkeepers in India, powered by hybrid AI.**

ZevaSewa helps small business owners manage their daily operations through a simple, responsive dashboard and an AI-powered business assistant.

## Live Demo

https://zevasewa.vercel.app/

## Features

- **Inventory Management:** Track products, quantities, prices, categories, and low-stock items.
- **Sales Management:** Record sales, automatically update inventory, and review sales history.
- **Purchase Planner:** Identify low-stock products, estimate purchase quantities and costs, and record purchases.
- **Cash Flow:** Track income, expenses, and balances.
- **AI Business Assistant:** Ask questions about inventory, sales, purchases, and cash flow.
- **AI Purchase Recommendations:** Get purchase suggestions based on business inventory data.
- **Backup and Restore:** Export and restore business data using JSON backups.
- **Authentication:** Secure email/password sign-in with Firebase Authentication.

## Hybrid AI Architecture

ZevaSewa integrates Firebase AI Logic Hybrid Inference for web applications.

The AI configuration uses:

- **On-device inference:** Attempts to use Chrome's built-in on-device AI when supported and available.
- **Cloud fallback:** Uses Gemini through Firebase AI Logic when on-device inference is unavailable.
- **Inference reporting:** Logs whether a response came from `ON_DEVICE` or `IN_CLOUD`.

The application uses `PREFER_ON_DEVICE` inference mode.

On-device availability depends on Chrome, device compatibility, and model availability. Cloud fallback allows the AI assistant to remain usable on unsupported devices.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase App Check
- Firebase AI Logic Hybrid Inference
- Gemini

## Security

- Firebase Authentication protects user accounts.
- Firestore Security Rules restrict access to each user's own data.
- Firebase App Check helps protect supported Firebase services.
- Environment variables are used for Firebase client configuration.

## Local Development

### Requirements

- Node.js
- npm
- A Firebase project

### Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root and configure the Firebase environment variables:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
   NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY=
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

## Production Build

```bash
npm run lint
npm run build
```

## Project Status

ZevaSewa is deployed and its core business-management workflows have been tested.

The hybrid AI implementation supports on-device inference attempts with cloud fallback. Actual on-device execution depends on compatible hardware and browser model availability.

## License

See the LICENSE file for licensing information.
