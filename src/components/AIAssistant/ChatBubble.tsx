import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { handleAIAssistantRequest } from '../../api/ai-assistant';
import { userProfileService } from '../../lib/api/userProfile';
import {
  canSendAiMessage,
  getAiAssistantLimits,
  getRemainingAiMessages,
  incrementAiDailyUsage,
} from '../../config/aiAssistantAccess';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBubbleProps {
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const WELCOME_MESSAGE = `Hi! I'm your Borderly AI Assistant. I can help with visa requirements, travel plans, and more. How can I help you today?`;

const ERROR_MESSAGES = {
  network: 'Unable to connect to the AI service. Please check your internet connection and try again.',
  api: 'The AI service is currently unavailable. Please try again in a moment.',
  auth: 'Unable to authenticate with the AI service. Our team has been notified and is working on a fix.',
  default: 'I apologize, but I encountered an error while processing your request. Please try again.'
};

// Add link processing function
const processLinks = (text: string): React.ReactNode => {
  // Pattern to match visa application links like borderly.net/visa/[country]
  const visaLinkPattern = /\[Borderly\.net\/visa\/([a-z]+)\]|\(https:\/\/borderly\.net\/visa\/([a-z]+)\)/gi;
  
  // Pattern to match explicit visa mentions like "apply for a [country] visa"
  const visaMentionPattern = /apply for an? ([a-z]+) visa|check ([a-z]+) visa requirements|([a-z]+) visa application/gi;
  
  // Common countries that might be mentioned for visa applications
  const commonCountries = [
    'turkey', 'usa', 'uk', 'canada', 'australia', 'schengen', 'japan', 'china', 
    'india', 'brazil', 'russia', 'south korea', 'thailand', 'vietnam', 'dubai', 
    'uae', 'singapore', 'malaysia', 'indonesia', 'new zealand'
  ];
  
  let processedText = text;
  let segments: (string | JSX.Element)[] = [processedText];
  
  // Function to create visa application button for a country
  const createVisaButton = (country: string) => {
    const countryCode = getCountryCode(country.toLowerCase());
    return (
      <button 
        key={`visa-${country}-${Math.random()}`}
        onClick={(e) => {
          e.preventDefault();
          // Navigate to the country's visa page without closing the chat
          window.location.href = `/visa/${countryCode}`;
        }}
        className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm px-3 py-1 rounded transition-colors mt-2"
      >
        Go to {country.charAt(0).toUpperCase() + country.slice(1)} eVisa Application
      </button>
    );
  };
  
  // Helper function to convert country names to country codes
  const getCountryCode = (country: string): string => {
    const countryCodes: Record<string, string> = {
      'turkey': 'tr',
      'usa': 'us',
      'uk': 'gb',
      'canada': 'ca',
      'australia': 'au',
      'japan': 'jp',
      'china': 'cn',
      'india': 'in',
      'brazil': 'br',
      'russia': 'ru',
      'south korea': 'kr',
      'thailand': 'th',
      'vietnam': 'vn',
      'dubai': 'ae',
      'uae': 'ae',
      'singapore': 'sg',
      'malaysia': 'my',
      'indonesia': 'id',
      'new zealand': 'nz',
      'schengen': 'eu'
    };
    
    return countryCodes[country] || country.substring(0, 2);
  };
  
  // Process the text for specific visa application links
  let match;
  let newSegments: (string | JSX.Element)[] = [];
  
  // Check for visa application links pattern
  visaLinkPattern.lastIndex = 0; // Reset regex index
  while ((match = visaLinkPattern.exec(text)) !== null) {
    const country = match[1] || match[2];
    
    const parts = text.split(match[0]);
    
    if (parts.length > 0) {
      // Add text before the match
      newSegments.push(parts[0]);
      
      // Add the button
      newSegments.push(createVisaButton(country));
      
      // Update text to remaining content
      text = parts.slice(1).join(match[0]);
      visaLinkPattern.lastIndex = 0; // Reset regex index for the new text
    }
  }
  
  if (newSegments.length === 0) {
    // If no specific links found, check for visa mentions
    for (const country of commonCountries) {
      const countryPattern = new RegExp(`\\b${country}\\b visa|visa for \\b${country}\\b`, 'gi');
      
      if (countryPattern.test(text)) {
        const parts = text.split(new RegExp(`(\\b${country}\\b visa|visa for \\b${country}\\b)`, 'i'));
        
        if (parts.length > 1) {
          let newTextSegments: (string | JSX.Element)[] = [];
          
          for (let i = 0; i < parts.length; i++) {
            newTextSegments.push(parts[i]);
            
            // After a match (which would be at odd indices), add the button
            if (i % 2 === 1 || (i < parts.length - 1 && countryPattern.test(parts[i]))) {
              newTextSegments.push(createVisaButton(country));
            }
          }
          
          return (
            <>
              {newTextSegments.map((segment, i) => (
                <React.Fragment key={i}>{segment}</React.Fragment>
              ))}
            </>
          );
        }
      }
    }
  }
  
  // If we processed visa links, return the segments
  if (newSegments.length > 0) {
    // Add any remaining text
    if (text) {
      newSegments.push(text);
    }
    
    return (
      <>
        {newSegments.map((segment, i) => (
          <React.Fragment key={i}>{segment}</React.Fragment>
        ))}
      </>
    );
  }
  
  // If no visa links or mentions were found, return the original text
  return text;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ isLoggedIn, onLoginRequired }) => {
  // Load saved state from localStorage
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const savedIsOpen = localStorage.getItem('chatIsOpen');
    return savedIsOpen ? JSON.parse(savedIsOpen) : false;
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  
  const [conversationHistory, setConversationHistory] = useState<Message[]>(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [remainingMessages, setRemainingMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiLimits = getAiAssistantLimits(subscriptionTier);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile } = await userProfileService.getCurrentUserProfile();
        const tier = profile?.subscription_tier || 'free';
        setSubscriptionTier(tier);
        setRemainingMessages(getRemainingAiMessages(tier));
      } catch {
        setSubscriptionTier('free');
        setRemainingMessages(0);
      }
    };

    const handleSubscriptionUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ tier?: string }>;
      const tier = custom.detail?.tier || 'free';
      setSubscriptionTier(tier);
      setRemainingMessages(getRemainingAiMessages(tier));
    };

    if (isLoggedIn) loadProfile();
    window.addEventListener('borderly:subscription-updated', handleSubscriptionUpdated);
    return () => window.removeEventListener('borderly:subscription-updated', handleSubscriptionUpdated);
  }, [isLoggedIn, isOpen]);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatIsOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Add welcome message when chat is opened for the first time
    if (isOpen && messages.length === 0) {
      const welcomeMessage = { role: 'assistant' as const, content: WELCOME_MESSAGE };
      setMessages([welcomeMessage]);
      setConversationHistory([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (!canSendAiMessage(subscriptionTier)) {
      const upgradeMsg = aiLimits.hasAccess
        ? "You've reached today's AI message limit. Try again tomorrow or upgrade to Enterprise for unlimited access."
        : 'AI Assistant is included with Premium and Enterprise plans.';
      setMessages((prev) => [
        ...prev,
        { role: 'user' as const, content: inputValue.trim() },
        { role: 'assistant' as const, content: upgradeMsg },
      ]);
      setInputValue('');
      return;
    }

    setError(null);
    const userMessage = inputValue.trim();
    const userMessageObj = { role: 'user' as const, content: userMessage };
    setInputValue('');
    
    // Update UI immediately with user message
    setMessages(prev => [...prev, userMessageObj]);
    
    // Update conversation history for context
    const updatedHistory = [...conversationHistory, userMessageObj];
    setConversationHistory(updatedHistory);
    
    setIsLoading(true);

    try {
      console.log('Sending message to AI with conversation history:', updatedHistory);
      const { response } = await handleAIAssistantRequest(
        userMessage,
        updatedHistory,
        subscriptionTier
      );
      console.log('Received AI response:', response);

      incrementAiDailyUsage();
      setRemainingMessages(getRemainingAiMessages(subscriptionTier));
      
      const assistantMessage = { role: 'assistant' as const, content: response };
      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [...prev, assistantMessage]);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Determine the type of error
      let userErrorMessage = ERROR_MESSAGES.default;
      if (errorMessage.toLowerCase().includes('network error') || errorMessage.toLowerCase().includes('failed to fetch')) {
        userErrorMessage = ERROR_MESSAGES.network;
      } else if (errorMessage.toLowerCase().includes('api error') || errorMessage.toLowerCase().includes('status: 429')) {
        userErrorMessage = ERROR_MESSAGES.api;
      } else if (errorMessage.toLowerCase().includes('authentication') || errorMessage.toLowerCase().includes('api key')) {
        userErrorMessage = ERROR_MESSAGES.auth;
        // Disable further attempts if it's an auth error
        setRetryCount(999);
      }
      
      setError(errorMessage);
      const errorResponseMsg = { role: 'assistant' as const, content: userErrorMessage };
      setMessages(prev => [...prev, errorResponseMsg]);
      // Don't add error messages to conversation history

      // Increment retry count for non-auth errors
      if (!errorMessage.toLowerCase().includes('authentication')) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    const welcomeMessage = { role: 'assistant' as const, content: WELCOME_MESSAGE };
    setMessages([welcomeMessage]);
    setConversationHistory([welcomeMessage]);
    setError(null);
    setRetryCount(0);
  };

  // Handle toggle chat without losing state
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Initialize with welcome message if opening for first time
      const welcomeMessage = { role: 'assistant' as const, content: WELCOME_MESSAGE };
      setMessages([welcomeMessage]);
      setConversationHistory([welcomeMessage]);
    }
    if (!isOpen) {
      setError(null); // Clear any errors when opening chat
      setRetryCount(0); // Reset retry count when opening chat
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={toggleChat}
          className="w-14 h-14 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 flex flex-col"
            style={{ height: '600px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Travel Assistant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aiLimits.hasAccess
                    ? Number.isFinite(remainingMessages)
                      ? `${remainingMessages} messages left today`
                      : 'Unlimited messages'
                    : 'Premium feature — upgrade to chat'}
                </p>
              </div>
              <button 
                onClick={clearConversation}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {!aiLimits.hasAccess && (
              <div className="mx-4 mt-3 p-3 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-800">
                Upgrade to{' '}
                <Link to="/pricing" className="font-semibold underline">
                  Premium
                </Link>{' '}
                to use Gemini-powered travel & visa help.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.role === 'assistant' ? processLinks(message.content) : message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-lg p-3 text-sm">
                    {error}
                    {retryCount >= 3 && !error.toLowerCase().includes('authentication') && (
                      <div className="mt-2 text-xs">
                        If this problem persists, please try again later or contact support.
                      </div>
                    )}
                    {error.toLowerCase().includes('authentication') && (
                      <div className="mt-2 text-xs">
                        This appears to be a configuration issue. Please contact support for assistance.
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    aiLimits.hasAccess ? 'Type your question...' : 'Upgrade to Premium to chat'
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading || !aiLimits.hasAccess}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading || !aiLimits.hasAccess}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBubble; 