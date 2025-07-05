import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaGlobe, FaPassport, FaMapMarkedAlt, FaUtensils, FaRoute, FaCameraRetro } from 'react-icons/fa';
import { blogPosts } from '../data/blogs-data';
import { BlogPost } from '../types/blog';

// Top 10 eVisa destination blog posts
const eVisaBlogs: BlogPost[] = [
  {
    id: 'turkey-evisa-guide',
    title: 'Complete Guide to Turkey eVisa',
    subtitle: 'Simplifying Your Entry to the Land of Two Continents',
    excerpt: 'Turkey\'s electronic visa system makes entry to this fascinating country easier than ever. Learn about the requirements, application process, and tips for a hassle-free experience.',
    author: 'Mehmet Yilmaz',
    date: 'April 15, 2023',
    readTime: '7 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/tr_image_1',
    category: 'Visa Guides',
    country: { name: 'Turkey', code: 'TR' },
    tags: ['evisa', 'turkey travel', 'visa application']
  },
  {
    id: 'india-evisa-explained',
    title: 'India eVisa: Everything You Need to Know',
    subtitle: 'Your Gateway to the Subcontinent',
    excerpt: 'India\'s electronic visa system has revolutionized travel to this diverse and culturally rich country. Discover the different types of eVisas available, documentation requirements, and processing times.',
    author: 'Priya Sharma',
    date: 'May 22, 2023',
    readTime: '8 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/in_image_1',
    category: 'Visa Guides',
    country: { name: 'India', code: 'IN' },
    tags: ['india travel', 'evisa', 'travel documents']
  },
  {
    id: 'vietnam-evisa-update',
    title: 'Vietnam eVisa: 2023 Updates and Changes',
    subtitle: 'Navigate the New System with Confidence',
    excerpt: 'Vietnam has updated its eVisa system with new features and requirements. This comprehensive guide covers all the recent changes and provides step-by-step instructions for a successful application.',
    author: 'Nguyen Van',
    date: 'March 10, 2023',
    readTime: '6 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/vn_image_1',
    category: 'Visa Guides',
    country: { name: 'Vietnam', code: 'VN' },
    tags: ['vietnam travel', 'evisa', 'visa requirements']
  },
  {
    id: 'thailand-evisa-tips',
    title: '5 Essential Tips for Your Thailand eVisa Application',
    subtitle: 'Smooth Entry to the Land of Smiles',
    excerpt: 'Thailand\'s eVisa system is user-friendly, but there are still common mistakes that travelers make. Learn how to avoid pitfalls and ensure your application is approved quickly.',
    author: 'Somchai Thongsuk',
    date: 'June 5, 2023',
    readTime: '5 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/th_image_1',
    category: 'Visa Guides',
    country: { name: 'Thailand', code: 'TH' },
    tags: ['thailand travel', 'evisa', 'travel tips']
  },
  {
    id: 'egypt-evisa-adventure',
    title: 'Egypt eVisa: Your Passport to Ancient Wonders',
    subtitle: 'Digital Entry to the Land of Pharaohs',
    excerpt: 'Egypt\'s electronic visa has made it easier than ever to explore this historic country. From pyramids to pristine beaches, discover how to secure your entry with the convenient eVisa system.',
    author: 'Ahmed Hassan',
    date: 'February 18, 2023',
    readTime: '7 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/eg_image_1',
    category: 'Visa Guides',
    country: { name: 'Egypt', code: 'EG' },
    tags: ['egypt travel', 'evisa', 'historical sites']
  },
  {
    id: 'sri-lanka-evisa-guide',
    title: 'Sri Lanka eVisa: Complete Application Guide',
    subtitle: 'Electronic Entry to the Pearl of the Indian Ocean',
    excerpt: 'Sri Lanka\'s ETA (Electronic Travel Authorization) system offers a straightforward way to visit this tropical paradise. Learn about the requirements, fees, and processing times.',
    author: 'Kumara Perera',
    date: 'July 12, 2023',
    readTime: '6 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/lk_image_1',
    category: 'Visa Guides',
    country: { name: 'Sri Lanka', code: 'LK' },
    tags: ['sri lanka travel', 'evisa', 'travel authorization']
  },
  {
    id: 'malaysia-evisa-process',
    title: 'Malaysia eVisa: Streamlined Application Process',
    subtitle: 'Digital Entry to Southeast Asia\'s Melting Pot',
    excerpt: 'Malaysia offers an efficient eVisa system for travelers from many countries. This guide walks through the entire process and highlights important considerations for different types of visits.',
    author: 'Fatima Yusof',
    date: 'April 30, 2023',
    readTime: '7 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/my_image_1',
    category: 'Visa Guides',
    country: { name: 'Malaysia', code: 'MY' },
    tags: ['malaysia travel', 'evisa', 'entry requirements']
  },
  {
    id: 'kenya-evisa-safari',
    title: 'Kenya eVisa: Your Gateway to Safari Adventures',
    subtitle: 'Digital Access to Wildlife and Natural Beauty',
    excerpt: 'Kenya\'s eVisa system makes it easier to experience the country\'s incredible safaris and landscapes. This comprehensive guide covers all aspects of the application process.',
    author: 'James Mwangi',
    date: 'March 25, 2023',
    readTime: '8 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/ke_image_1',
    category: 'Visa Guides',
    country: { name: 'Kenya', code: 'KE' },
    tags: ['kenya travel', 'evisa', 'safari', 'wildlife']
  },
  {
    id: 'azerbaijan-evisa-tips',
    title: 'Azerbaijan eVisa: Insider Tips and Requirements',
    subtitle: 'Electronic Entry to the Land of Fire',
    excerpt: 'Azerbaijan\'s ASAN Visa system offers one of the fastest electronic visa processes. Discover how to navigate the system efficiently and explore this fascinating country at the crossroads of Europe and Asia.',
    author: 'Eldar Mammadov',
    date: 'May 8, 2023',
    readTime: '6 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/az_image_1',
    category: 'Visa Guides',
    country: { name: 'Azerbaijan', code: 'AZ' },
    tags: ['azerbaijan travel', 'evisa', 'caucasus']
  },
  {
    id: 'albania-evisa-guide',
    title: 'Albania eVisa: Complete Application Guide',
    subtitle: 'Digital Entry to the Mediterranean\'s Hidden Gem',
    excerpt: 'Albania\'s new electronic visa system is making it easier to explore this underrated European destination. Learn about documentation requirements, processing times, and entry protocols.',
    author: 'Elena Hoxha',
    date: 'June 22, 2023',
    readTime: '5 min read',
    image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/al_image_1',
    category: 'Visa Guides',
    country: { name: 'Albania', code: 'AL' },
    tags: ['albania travel', 'evisa', 'european travel']
  }
];

// Blog listing page component
const BlogListing: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>(blogPosts);

  // All unique categories from blog posts
  const categories = ['all', ...Array.from(new Set(blogPosts.map(blog => blog.category)))];
  
  // Filter blogs based on category and search term
  useEffect(() => {
    let filtered = blogPosts;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(blog => blog.category === selectedCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(blog => 
        blog.title.toLowerCase().includes(term) || 
        blog.excerpt.toLowerCase().includes(term) ||
        blog.country.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredBlogs(filtered);
  }, [selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Travel Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover tips, guides, and insights for top eVisa destinations around the world
          </p>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search blogs..."
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map(category => (
              <button
                key={category}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Blog grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map(blog => (
              <div 
                key={blog.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <Link to={`/blogs/${blog.id}`} className="block relative overflow-hidden aspect-video">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      // Fallback image if the country image fails to load
                      (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/sample';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {blog.category}
                      </span>
                      <span className="mx-2 text-xs text-white opacity-80">•</span>
                      <span className="text-xs text-white opacity-80 flex items-center">
                        <FaGlobe className="mr-1" />
                        {blog.country.name}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-6">
                  <Link to={`/blogs/${blog.id}`} className="block">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{blog.excerpt}</p>
                  </Link>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-500">{blog.date}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-500">{blog.readTime}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-600">No blogs found matching your criteria.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
        
        {/* Featured destinations section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FaMapMarkedAlt className="mr-2 text-primary-600" />
            Popular eVisa Destinations
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {['Turkey', 'India', 'Vietnam', 'Thailand', 'Egypt', 'Sri Lanka', 'Malaysia', 'Kenya', 'Azerbaijan', 'Albania'].map((country, index) => (
              <Link 
                key={index}
                to={`/blogs/category/visa-guides?country=${country.toLowerCase()}`}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <span className="block text-gray-800 dark:text-gray-200 font-medium">{country}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Call to action */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to explore?</h2>
          <p className="mb-6 max-w-2xl mx-auto">Check visa requirements for your destination and apply online with our easy-to-use platform</p>
          <Link 
            to="/visa-checker" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FaPassport className="mr-2" />
            Check Visa Requirements
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogListing; 