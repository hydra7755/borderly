import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import TravelScoreQuestionnaire from './pages/TravelScoreQuestionnaire';
import NotFound from './pages/NotFound';
import EVisa from './pages/EVisa';
import EVisaRedirect from './pages/EVisaRedirect';
import './App.css';
import Contact from './pages/Contact';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import ChatBubble from './components/AIAssistant/ChatBubble';
import WorldMap from './pages/WorldMap';
import VisaProduct from './pages/VisaProduct';
import VisaProductBrowser from './pages/VisaProductBrowser';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import VisaChecker from './pages/VisaChecker';
import AIAssistant from './pages/AIAssistant';
import authService from './lib/api/auth';
import { User } from '@supabase/supabase-js';
import BlogListing from './pages/BlogListing';
import BlogDetail from './pages/BlogDetail';
import AdminDashboard from './pages/Admin';
import VisaApplicationPage from './pages/VisaApplicationPage';
import PaymentPage from './pages/PaymentPage';
import VisaConfirmationPage from './pages/VisaConfirmationPage';
import ScrollToTop from './components/ScrollToTop';

// Define types for pages
type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'questionnaire' | 'world-map' | 'profile' | 'subscription' | 'evisa' | 
  'features' | 'pricing' | 'contact' | 'checkout' | 'subscription-success' | '404' | 'visa/turkey' | 
  'travel-score' | 'visa-checker' | 'trips' | 'documents' | 'settings' | 'assistant' | 'blogs' | 'admin';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number>(5);

  useEffect(() => {
    console.log('[AuthCallback] Component mounted.');
    const handleAuthCallback = async () => {
      try {
        console.log("[AuthCallback] handleAuthCallback activated");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("[AuthCallback] Attempting to get current session...");
        const { session, error: sessionError } = await authService.getSession();

        console.log("[AuthCallback] Session data:", session);
        console.log("[AuthCallback] Session error:", sessionError);
        
        if (sessionError) {
          console.error("[AuthCallback] Error getting session:", sessionError);
          setError("Authentication session check failed. Please try logging in again.");
          startRedirectTimer('/login');
          return;
        }
        
        const url = new URL(window.location.href);
        const type = url.searchParams.get('type');
        const isEmailConfirmation = type === 'email';
        const isPasswordReset = type === 'password_reset';
        console.log(`[AuthCallback] URL type parameter: ${type}`);
        
        if (session) {
          console.log("[AuthCallback] Session found successfully.");
          const redirectPath = localStorage.getItem('redirectAfterLogin') || '/dashboard';
          localStorage.removeItem('redirectAfterLogin');
          console.log(`[AuthCallback] Determined redirect path: ${redirectPath}`);
          
          if (isEmailConfirmation) {
            console.log("[AuthCallback] Handling email confirmation.");
            setMessage("Your email has been verified! You can now access all features.");
            startRedirectTimer(redirectPath);
          } else if (isPasswordReset) {
            console.log("[AuthCallback] Handling password reset.");
            navigate('/update-password');
          } else {
            console.log(`[AuthCallback] Navigating to ${redirectPath}...`);
            navigate(redirectPath);
          }
        } else if (isEmailConfirmation) {
          console.log("[AuthCallback] Handling email confirmation without active session.");
          setMessage("Your email has been verified! Please log in to access your account.");
          startRedirectTimer('/login');
        } else if (isPasswordReset) {
          console.log("[AuthCallback] Handling password reset without active session.");
          navigate('/update-password');
        } else {
          console.error("[AuthCallback] No session found after redirect, and not email/password confirmation.");
          setError("Authentication failed. Please try logging in again.");
          startRedirectTimer('/login');
        }
      } catch (error) {
        console.error("[AuthCallback] Unexpected error in handleAuthCallback:", error);
        setError("An unexpected error occurred during authentication. Please try again.");
        startRedirectTimer('/login');
      }
    };
    
    const startRedirectTimer = (path: string) => {
      const intervalId = setInterval(() => {
        setRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            navigate(path);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {error ? (
          <div className="text-center">
            <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">
              <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
              <p>{error}</p>
            </div>
            <p className="text-gray-600 mt-4">Redirecting to login page in {redirectTimer} seconds...</p>
          </div>
        ) : message ? (
          <div className="text-center">
            <div className="bg-green-50 p-4 rounded-md text-green-600 mb-4">
              <h2 className="text-lg font-semibold mb-2">Success!</h2>
              <p>{message}</p>
            </div>
            <p className="text-gray-600 mt-4">Redirecting in {redirectTimer} seconds...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
            <p className="text-gray-600">Completing authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eVisaData, setEVisaData] = useState<{nationalityCode: string, destinationCode: string} | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<string>('');
  const [checkoutCycle, setCheckoutCycle] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');
  const [eVisaApplication, setEVisaApplication] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();
  
  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { session, error: sessionError } = await authService.getSession();
        
        if (session && !sessionError) {
          const { user, error: userError } = await authService.getCurrentUser();
          
          if (user && !userError) {
            setCurrentUser(user);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Handle theme switching
  useEffect(() => {
    // Always use light mode
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Handle login action
  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, session, error } = await authService.signIn(email, password);
      
      if (error) {
        console.error("Login error:", error.message);
        return;
      }
      
      if (user && session) {
        setCurrentUser(user);
    setIsLoggedIn(true);
    
    // Check if we have a pending redirect
    const redirectPage = localStorage.getItem('redirectAfterLogin');
    if (redirectPage) {
      localStorage.removeItem('redirectAfterLogin');
          navigate(`/${redirectPage}`);
    } else if (eVisaApplication) {
      // If there's an eVisa application in progress
          navigate('/evisa');
    } else if (checkoutPlan) {
      // If the user was trying to purchase a subscription
          navigate('/checkout');
    } else {
      // Default path
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
    }
  };

  // Handle signup action
  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      const { user, session, error } = await authService.signUp(email, password, {
        full_name: name,
        nationality: 'UNKNOWN',
        residency: 'UNKNOWN'
      });
      
      if (error) {
        console.error("Signup error:", error.message);
        return;
      }
      
      if (user && session) {
        setCurrentUser(user);
    setIsLoggedIn(true);
    
    // If redirected from eVisa application, go to eVisa page
    if (eVisaApplication) {
          navigate('/evisa');
    } else if (checkoutPlan) {
      // If we were trying to subscribe, go to checkout
          navigate('/checkout');
    } else {
          navigate('/questionnaire');
        }
      }
    } catch (err) {
      console.error("Unexpected signup error:", err);
    }
  };

  // Handle logout action
  const handleLogout = async () => {
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        console.error("Logout error:", error.message);
        return;
      }
      
      setCurrentUser(null);
    setIsLoggedIn(false);
      navigate('/');
    setEVisaData(null);
    } catch (err) {
      console.error("Unexpected logout error:", err);
    }
  };

  // Handle eVisa application initiation
  const startEVisaApplication = (nationalityCode: string, destinationCode: string) => {
    setEVisaData({ nationalityCode, destinationCode });
    
    if (isLoggedIn) {
      // User is already logged in, go directly to eVisa page
      navigate(`/evisa/${nationalityCode}/${destinationCode}`);
    } else {
      // User needs to log in first, redirect to login page
      navigate('/login');
    }
  };

  // Function to handle subscription flow
  const handleSubscribe = (plan: string, cycle: 'monthly' | 'annual' | 'lifetime') => {
    if (!isLoggedIn) {
      // Store plan info and redirect to signup
      setCheckoutPlan(plan);
      setCheckoutCycle(cycle);
      navigate('/signup');
    } else {
      // Already logged in, go directly to checkout
      setCheckoutPlan(plan);
      setCheckoutCycle(cycle);
      navigate('/checkout');
    }
  };

  // Function to handle successful checkout
  const handleCheckoutComplete = () => {
    navigate('/subscription-success');
  };

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Pages that render their own app shell (header/sidebar) — hide global header/footer
  const routeRoot = (location.pathname.slice(1).split('/')[0] || 'landing');
  const appShellRoutes = [
    'dashboard',
    'travel-score',
    'trips',
    'documents',
    'settings',
    'profile',
    'world-map',
    'assistant',
    '404',
    'notfound',
    'subscription',
  ];
  const isDashboardShell = appShellRoutes.includes(routeRoot);
  const isEvisaFlow = routeRoot === 'evisa';
  const showHeader = !isDashboardShell;
  const showFooter = !isDashboardShell && !isEvisaFlow;

  // Login Required Higher Order Component
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="loader">Loading...</div>
        </div>
      );
    }
    
    return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {showHeader && (
          <Header 
            isLoggedIn={isLoggedIn}
            userName={currentUser?.full_name}
          onLoginClick={() => navigate('/login')}
          onSignUpClick={() => navigate('/signup')}
            onLogoutClick={handleLogout}
          onDashboardClick={() => navigate('/dashboard')}
          onHomeClick={() => navigate('/')}
          onFeaturesClick={() => navigate('/features')}
          onPricingClick={() => navigate('/pricing')}
          onContactClick={() => navigate('/contact')}
          />
        )}
        
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
            key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              className="w-full"
            >
            <Routes location={location}>
              <Route path="/" element={
                <Landing 
                  onGetStarted={() => navigate('/questionnaire')}
                  onExploreFeatures={() => navigate('/features')}
                  onApplyEVisa={startEVisaApplication}
                  onPricingSubscribe={handleSubscribe}
                  isLoggedIn={isLoggedIn}
                  onLoginRequired={() => navigate('/login')}
                />
              } />
              <Route path="/login" element={
                <Login 
                  onLogin={handleLogin} 
                  onNavigateToSignUp={() => navigate('/signup')} 
                />
              } />
              <Route path="/signup" element={
                <SignUp 
                  onSignUp={handleSignUp} 
                  onNavigateToLogin={() => navigate('/login')} 
                />
              } />
              <Route path="/visa-checker" element={
                <VisaChecker 
                  isLoggedIn={isLoggedIn}
                  onLoginRequired={() => navigate('/login')}
                  onApplyEVisa={startEVisaApplication}
                />
              } />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={
                <Pricing
                  isLoggedIn={isLoggedIn}
                  onGetStarted={() => navigate('/login')}
                  onSubscribe={handleSubscribe}
                />
              } />
              <Route path="/contact" element={<Contact />} />
              <Route path="/evisa" element={<Navigate to="/visa-checker" replace />} />
              <Route path="/evisa/:nationality/:destination" element={
                <RequireAuth>
                  <EVisa />
                </RequireAuth>
              } />
              <Route path="/dashboard" element={
                <RequireAuth>
                  <Dashboard isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} />
                </RequireAuth>
              } />
              <Route path="/travel-score" element={
                <RequireAuth>
                  <Dashboard isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} initialTab="travel-score" />
                </RequireAuth>
              } />
              <Route path="/assistant" element={
                <RequireAuth>
                  <AIAssistant isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} />
                </RequireAuth>
              } />
              <Route path="/trips" element={
                <RequireAuth>
                  <Dashboard isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} initialTab="trips" />
                </RequireAuth>
              } />
              <Route path="/documents" element={
                <RequireAuth>
                  <Dashboard isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} initialTab="documents" />
                </RequireAuth>
              } />
              <Route path="/settings" element={
                <RequireAuth>
                  <Dashboard isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} initialTab="settings" />
                </RequireAuth>
              } />
              <Route path="/world-map" element={
                <RequireAuth>
                  <WorldMap isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} />
                </RequireAuth>
              } />
              <Route path="/profile" element={
                <RequireAuth>
                  <Dashboard isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('/login')} initialTab="profile" />
                </RequireAuth>
              } />
              <Route path="/subscription" element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              } />
              <Route path="/questionnaire" element={<TravelScoreQuestionnaire onSignUp={() => navigate('/signup')} isLoggedIn={isLoggedIn} />} />
              <Route path="/checkout" element={<RequireAuth><Checkout subscriptionType={checkoutPlan as 'premium' | 'enterprise'} billingCycle={checkoutCycle} onBack={() => navigate('/pricing')} onComplete={handleCheckoutComplete} /></RequireAuth>} />
              <Route path="/subscription-success" element={<RequireAuth><SubscriptionSuccess subscriptionType={checkoutPlan as 'premium' | 'enterprise'} billingCycle={checkoutCycle} onContinue={() => navigate('/dashboard')} /></RequireAuth>} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
              <Route path="/visa/:countryCode" element={<VisaProduct />} />
              <Route path="/visa/browse" element={<VisaProductBrowser />} />
              <Route path="/visa/apply/:nationality/:destination" element={<VisaApplicationPage />} />
              <Route path="/payment/:applicationId" element={<PaymentPage />} />
              <Route path="/payment-test" element={<PaymentPage />} />
              <Route path="/visa/confirmation/:applicationId" element={<VisaConfirmationPage />} />
              <Route path="/blogs" element={<BlogListing />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/blogs/:countryCode" element={<RequireAuth><BlogListing /></RequireAuth>} />
              <Route path="*" element={<NotFound onGoHome={() => navigate('/')} />} />
            </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
        
        {showFooter && <Footer />}

        {/* Always show ChatBubble when logged in, regardless of page */}
        {isLoggedIn && (
          <ChatBubble 
            isLoggedIn={isLoggedIn} 
          onLoginRequired={() => navigate('/login')} 
          />
        )}
      </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
};

export default App;
