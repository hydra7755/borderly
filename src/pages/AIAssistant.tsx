import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { handleAIAssistantRequest } from '../api/ai-assistant';
import { userProfileService } from '../lib/api/userProfile';
import {
  canSendAiMessage,
  getAiAssistantLimits,
  getRemainingAiMessages,
  incrementAiDailyUsage,
} from '../config/aiAssistantAccess';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface AIAssistantProps {
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isLoggedIn, onLoginRequired }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Borderly AI travel assistant powered by Gemini. How can I help you today?",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiLimits = getAiAssistantLimits(subscriptionTier);

  const suggestions = [
    'What documents do I need for a US visa?',
    'Can I travel to Japan with an EU passport?',
    "What's the best time to visit Thailand?",
    'How do I apply for an eVisa for Turkey?',
    'How long can I stay in Canada as a tourist?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoggedIn) return;
    userProfileService.getCurrentUserProfile().then(({ profile }) => {
      const tier = profile?.subscription_tier || 'free';
      setSubscriptionTier(tier);
      setRemainingMessages(getRemainingAiMessages(tier));
    });
  }, [isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (!canSendAiMessage(subscriptionTier)) {
      const text = aiLimits.hasAccess
        ? "You've reached today's AI message limit."
        : 'AI Assistant requires a Premium or Enterprise subscription.';
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() },
        {
          id: (Date.now() + 1).toString(),
          text,
          sender: 'assistant',
          timestamp: new Date(),
        },
      ]);
      setInput('');
      return;
    }

    const userText = input.trim();
    setInput('');
    setIsTyping(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userText },
    ];
    setConversationHistory(updatedHistory);

    try {
      const { response } = await handleAIAssistantRequest(
        userText,
        updatedHistory,
        subscriptionTier
      );

      incrementAiDailyUsage();
      setRemainingMessages(getRemainingAiMessages(subscriptionTier));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: response },
      ]);
    } catch (error) {
      const errText =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: errText,
          sender: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="bg-primary-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">AI Travel Assistant</h1>
            <p className="text-primary-100 text-sm">
              Powered by Gemini Flash ·{' '}
              {aiLimits.hasAccess
                ? Number.isFinite(remainingMessages)
                  ? `${remainingMessages} messages left today`
                  : 'Unlimited messages'
                : 'Premium & Enterprise only'}
            </p>
          </div>

          {!aiLimits.hasAccess && isLoggedIn && (
            <div className="mx-6 mt-4 p-4 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-900">
              Upgrade to{' '}
              <Link to="/pricing" className="font-semibold underline">
                Premium
              </Link>{' '}
              or Enterprise to unlock the AI assistant.
            </div>
          )}

          <div className="flex flex-col h-[70vh]">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm sm:text-base whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '200ms' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '400ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    disabled={!aiLimits.hasAccess}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    aiLimits.hasAccess ? 'Type your question here...' : 'Upgrade to Premium to chat'
                  }
                  className="flex-1 focus:ring-primary-500 focus:border-primary-500 rounded-l-md block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={isTyping || !aiLimits.hasAccess}
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim() || !aiLimits.hasAccess}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIAssistant;
