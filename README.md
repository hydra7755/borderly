# TravelScore - Global Mobility Index

TravelScore is a comprehensive web application that helps users understand and improve their global mobility potential by calculating a travel score based on passport strength, travel history, and residency benefits.

## Features

- **Travel Score Calculation**: Get a comprehensive score based on passport strength, travel history, and residency benefits.
- **Visa Requirement Checker**: Instantly check visa requirements for any destination based on your citizenship.
- **Interactive World Map**: Explore visa requirements and travel opportunities worldwide with our 3D globe visualization.
- **eVisa Application Platform**: Apply for electronic visas directly through our platform.
- **AI Travel Assistant**: Get personalized travel advice and visa guidance.
- **Travel History Management**: Track and manage your travel history for visa applications.

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Email/Password, Google OAuth, Apple OAuth
- **Data Visualization**: Three.js, React Globe GL
- **Payments**: Stripe

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/travelscore.git
   cd travelscore
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_CONTACT_EMAIL=contact@travelscore.com
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

4. Start the OCR server (in a separate terminal):
   ```
   npm run ocr-server
   ```

## Database Setup

The application uses Supabase as its backend. Use the SQL schema in `src/db/schema.sql` to set up your database tables and functions.

## Deployment

1. Build the production version:
   ```
   npm run build
   ```

2. Deploy to your hosting service of choice (Vercel, Netlify, etc.)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following values:

```
# Google Cloud Vision API Configuration - Required for passport OCR
GOOGLE_APPLICATION_CREDENTIALS=./keys/vision-service-account.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
VITE_OCR_API_URL=http://localhost:8765/api
PORT=8765

# Supabase credentials
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth providers
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_APPLE_AUTH=true
```

## Authentication Setup

TravelScore supports multiple authentication methods:

1. **Email/Password Authentication**: Default method, no additional setup required.

2. **Google OAuth**: For setup instructions, consult the [Supabase Google Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google).

3. **Apple OAuth**: Follow our detailed [Apple OAuth Setup Guide](./docs/SETUP_APPLE_OAUTH.md) to enable Apple sign-in.

## OCR Services for Passport Scanning

TravelScore supports multiple OCR services for passport scanning:

1. **Google Cloud Vision API (Primary)**: High accuracy passport detection. Requires an API key.
   - Set up following [Google Cloud Vision API Setup](./docs/SETUP_GOOGLE_VISION.md)

2. **Local OCR Server (Secondary)**: Runs on your local machine using Tesseract.js.
   - Start with `npm run start-ocr`
   - Automatically falls back if Google Cloud Vision is unavailable

3. **Client-side Tesseract.js (Fallback)**: Runs directly in the browser if other services fail.
   - Automatically used if other services are unavailable

### Quick Start for OCR Services

To ensure proper functioning of the OCR services:

1. **Install dependencies**:
   ```bash
   npm run setup-ocr
   ```

2. **Start the OCR server**:
   ```bash
   npm run start-ocr
   ```

3. **In a new terminal, start the application**:
   ```bash
   npm run dev
   ```

### Troubleshooting

If you experience issues with the OCR services, refer to the detailed [OCR Troubleshooting Guide](./docs/OCR_TROUBLESHOOTING.md) which covers:

- Common error messages and solutions
- Step-by-step diagnosis procedures
- Advanced troubleshooting techniques
- Port conflict resolution
- CORS issue solutions

The most common issue is that the OCR server is not running. Make sure to start it with `npm run start-ocr` before using the passport scanning feature.

## Features

- E-Visa application processing
- Photo capture with validation
- Passport scanning with OCR
- Travel details collection
- Multiple traveler support
- Secure checkout 