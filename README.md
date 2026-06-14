# Borderly - Global Mobility Index

Borderly is a comprehensive web application that helps users understand and improve their global mobility potential by calculating a travel score based on passport strength, travel history, and residency benefits.

## Features

- **Travel Score Calculation**: Get a comprehensive score based on passport strength, travel history, and residency benefits.
- **Visa Requirement Checker**: Instantly check visa requirements for any destination based on your citizenship.
- **Interactive World Map**: Explore visa requirements and travel opportunities worldwide with our 3D globe visualization.
- **eVisa Application Platform**: Apply for electronic visas directly through our comprehensive 5-step application process.
- **AI Travel Assistant**: Get personalized travel advice and visa guidance.
- **Travel History Management**: Track and manage your travel history for visa applications.

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Email/Password, Google OAuth, Apple OAuth
- **Data Visualization**: Three.js, React Globe GL
- **Payments**: Stripe
- **OCR**: Google Cloud Vision API with Tesseract.js fallback

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/hydra7755/borderly.git
   cd borderly
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
   VITE_CONTACT_EMAIL=contactborderly@gmail.com
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   
   # Optional OCR Configuration
   VITE_GOOGLE_CLOUD_VISION_ENABLED=true
   VITE_GOOGLE_CLOUD_VISION_API_KEY=your_api_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. (Optional) Start the OCR server for passport scanning:
   ```
   npm run ocr-server
   ```

## Database Setup

The application uses Supabase as its backend. Use the SQL schema in `setup_database.sql` to set up your database tables and functions.

## Project Structure

The codebase has been optimized for maintainability with the following structure:

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/UI components
│   ├── layout/          # Header, Footer
│   ├── Dashboard/       # Dashboard-specific components
│   ├── EVisa/           # Visa application flow
│   ├── Blog/            # Blog components
│   └── map/             # Map and globe components
├── pages/               # Main application pages
├── lib/                 # External service integrations
│   ├── api/             # API service layers
│   ├── supabase/        # Supabase client
│   └── utils/           # Utility functions
├── types/               # TypeScript type definitions
├── utils/               # Helper functions
└── services/            # Business logic services
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run server` - Start the main server
- `npm run ocr-server` - Start OCR service for passport scanning
- `npm run setup-ocr` - Set up OCR dependencies

## Recent Optimizations

The codebase has been recently cleaned up and optimized:

- **Removed duplicate files**: Eliminated redundant components and backup files
- **Consolidated visa application flow**: Unified multiple visa application approaches into a single comprehensive solution
- **Cleaned up dependencies**: Removed unused packages and scripts
- **Improved structure**: Better organized components and removed empty directories
- **Enhanced maintainability**: Clearer separation of concerns and reduced complexity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 