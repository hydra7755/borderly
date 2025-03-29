import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
      text: 'Hi there! I\'m your AI Travel Assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample travel-related topics for suggestions
  const suggestions = [
    "What documents do I need for a US visa?",
    "Can I travel to Japan with a EU passport?",
    "What's the best time to visit Thailand?",
    "How do I apply for an eVisa for Turkey?",
    "What are the COVID restrictions for Spain?",
    "How long can I stay in Canada as a tourist?"
  ];

  // Sample responses for demonstration
  const sampleResponses: { [key: string]: string } = {
    'visa': "For visa requirements, I'd need to know your nationality and destination country. Different countries have different requirements depending on your passport.",
    'document': "Common travel documents include passports, visas, proof of accommodation, return tickets, and proof of sufficient funds. Some countries may require additional documents.",
    'covid': "COVID travel restrictions vary by country and are frequently updated. Many countries have removed most restrictions, but some still require vaccination certificates or testing.",
    'passport': "Make sure your passport is valid for at least 6 months beyond your planned stay. This is a common requirement for many countries.",
    'schengen': "The Schengen Area allows free movement between member countries. Visitors can typically stay for up to 90 days in any 180-day period without additional visas.",
    'turkey': "For Turkey, many nationalities can apply for an e-Visa online. The process is usually quick and straightforward.",
    'japan': "Japan offers visa exemptions for many countries for stays up to 90 days. You'll need a valid passport and a return ticket.",
    'thailand': "The best time to visit Thailand is during the cool and dry season between November and early April. The weather is more comfortable and rainfall is at its minimum."
  };

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking and responding
    setTimeout(() => {
      const responseText = generateResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Generate a simple response based on keywords (in a real app, this would be an API call)
  const generateResponse = (query: string): string => {
    query = query.toLowerCase();
    
    // Check for keywords in the query
    for (const [keyword, response] of Object.entries(sampleResponses)) {
      if (query.includes(keyword.toLowerCase())) {
        return response;
      }
    }
    
    // Default response if no keyword matches
    return "I'd be happy to help with your travel questions. Could you provide more details about what you're looking for?";
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
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
              Ask me anything about visa requirements, travel documents, or destination advice
            </p>
          </div>
          
          <div className="flex flex-col h-[70vh]">
            {/* Messages container */}
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
                      <p className="text-sm sm:text-base">{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Suggestions */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Input form */}
            <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 focus:ring-primary-500 focus:border-primary-500 rounded-l-md block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            This AI assistant is for demonstration purposes. In a real application, responses would be generated using a sophisticated AI model.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 