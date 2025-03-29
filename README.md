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