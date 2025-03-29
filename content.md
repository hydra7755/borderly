# TravelScore Web Application - Mind Map

## 🎯 Core Concept
- Travel scoring platform based on passport strength, history, and residency
- Visa eligibility checking with application capabilities
- Premium features with subscription model

## 🧩 Design Principles
- **Minimalist Layout:** Clean, responsive UI with intuitive flow
- **Single Primary Color Theme:** Teal with gradient variations across UI
- **Colorful Travel Score Visualization:** Uses color bands for quick insight
- **Interactive Animations:** Smooth hover effects, transitions, and scroll interactions

## 🛠️ Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Backend & Auth:** Supabase
- **Styling & UI:** Tailwind CSS + Shadcn/UI + Framer Motion
- **3D Globe & Map:** Three.js + react-globe.gl
- **Payments:** Stripe
- **AI Travel Assistant:** DeepSeek API

## 📋 Project Structure
```
src/
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/ (navigation, footer)
│   ├── auth/ (login, register forms)
│   ├── dashboard/ (widgets, metrics)
│   ├── globe/ (interactive map)
│   ├── onboarding/ (stepper, forms)
│   └── visa/ (eligibility checker, application)
├── lib/
│   ├── supabase/ (client, hooks)
│   ├── utils/ (helpers, formatters)
│   ├── stripe/
│   └── deepseek/
├── hooks/
│   ├── useAuth.ts
│   ├── useScore.ts
│   ├── useVisa.ts
│   └── useSubscription.ts
├── pages/
│   ├── Landing.tsx
│   ├── Auth.tsx
│   ├── Onboarding.tsx
│   ├── Dashboard.tsx
│   ├── VisaChecker.tsx
│   ├── Profile.tsx
│   └── Subscription.tsx
└── types/
    ├── user.ts
    ├── visa.ts
    ├── country.ts
    └── subscription.ts
```

## 📱 Key Pages & Components

### 1. Landing Page
- **Hero Section:** Animated globe + headline
- **Features Section:** Cards with animations
- **Pricing Section:** Subscription tiers
- **Testimonials:** User success stories
- **CTA:** Sign up button with pulse animation

### 2. Authentication
- **Login/Register Forms:** Email/password + OAuth
- **Password Reset Flow**
- **Auth State Management**

### 3. Onboarding
- **Multi-step Form:**
  - Nationality selection
  - Residency information
  - Travel history input
  - Destination preferences
  - Summary & completion

### 4. Dashboard
- **Travel Score Widget:** Radial meter (0-1000)
- **Visa Eligibility Summary:** Quick status cards
- **Map Widget:** Interactive 3D globe preview
- **Travel History Visualization**
- **Recommendation Cards**

### 5. World Map Explorer
- **Interactive 3D Globe:**
  - Color-coded countries
  - Hover states with tooltips
  - Click interaction for details
- **Country Detail Modal:**
  - Visa requirements
  - Score impact
  - Application button
  - Save to list feature

### 6. Visa Checker
- **Search Functionality**
- **Results Card:**
  - Requirements breakdown
  - Document checklist
  - Fee structure
  - Processing time
- **Application Button**

### 7. Visa Application
- **Form Steps:**
  - Personal information
  - Travel details
  - Document upload
  - Payment integration
  - Confirmation

### 8. Profile & Settings
- **Personal Information Management**
- **Travel History Editor**
- **Subscription Management**
- **Notification Settings**
- **Data Export Options**

### 9. AI Assistant
- **Chat Interface**
- **Contextual Suggestions**
- **Quick Actions Buttons**

## 🗃️ Database Schema (Supabase)

### Users
- id (PK)
- email
- full_name
- nationality
- residency
- created_at
- subscription_tier
- stripe_customer_id

### Travel History
- id (PK)
- user_id (FK)
- country_id (FK)
- visit_date
- duration_days
- purpose

### Visa Applications
- id (PK)
- user_id (FK)
- destination_id (FK)
- status
- application_date
- documents_uploaded
- payment_status
- approval_date

### Countries
- id (PK)
- name
- code
- region
- passport_strength
- visa_free_count

### Visa Requirements
- id (PK)
- source_country_id (FK)
- destination_country_id (FK)
- requirement_type
- duration_allowed
- documents_needed
- fee_amount

### Saved Destinations
- id (PK)
- user_id (FK)
- country_id (FK)
- saved_date
- notes

### Travel Scores
- id (PK)
- user_id (FK)
- current_score
- passport_component
- history_component
- residency_component
- calculated_at

## 🔄 Core Workflows

### Travel Score Calculation
1. Retrieve user's nationality data
2. Factor in travel history (countries, frequency)
3. Add residency bonuses
4. Apply normalization algorithm (0-1000)
5. Store in travel_scores table
6. Update visualization

### Visa Eligibility Check
1. Get user nationality
2. Query visa_requirements for destination
3. Determine category (free, eVisa, traditional)
4. Present requirements & documents
5. Calculate fees (with subscription discounts)
6. Show application option if eligible

### Subscription Management
1. Present tier options
2. Redirect to Stripe checkout
3. Handle webhook for successful payment
4. Update user subscription status
5. Unlock premium features
6. Provide subscription management options

### eVisa Application
1. Collect required information
2. Document upload to Supabase storage
3. Process payment through Stripe
4. Apply subscription discounts
5. Submit application to visa system
6. Update status in dashboard

## 📊 Metrics & Analytics
- User signup conversion
- Subscription tier distribution
- Most checked destinations
- Average travel score by nationality
- Application completion rate
- Feature usage statistics

## 🌐 Deployment Strategy
1. Development environment: Local
2. Staging: Vercel preview deployments
3. Production: Vercel with custom domain
4. Database: Supabase production instance
5. Monitoring: Sentry for error tracking
6. Analytics: Mixpanel or Amplitude

## 🔍 Testing Strategy
- **Unit Tests:** Core functions, hooks, utils
- **Component Tests:** UI elements, forms
- **Integration Tests:** Authentication flows, payment process
- **E2E Tests:** Critical user journeys
- **Performance Testing:** Load time, animations

## 🚀 Launch Phases
1. **MVP Release:**
   - Basic authentication
   - Travel score calculation
   - Simple visa checker
   - Limited country database
   
2. **Beta Launch:**
   - Complete visa database
   - Basic subscription model
   - Simple interactive map
   - User profiles
   
3. **Full Launch:**
   - 3D globe visualization
   - Complete payment integration
   - Visa application system
   - Enhanced UI animations
   
4. **Feature Expansion:**
   - AI travel assistant
   - Mobile application
   - API for partners
   - Advanced analytics dashboard

## 📈 Growth Opportunities
- B2B partnerships with travel agencies
- White-label solutions for embassy services
- API access for travel websites
- Mobile app expansion
- Premium travel concierge services

## 🔄 Maintenance Plan
- Bi-weekly database updates for visa changes
- Monthly feature releases
- Quarterly security audits
- Continuous performance optimization
- User feedback implementation cycles
