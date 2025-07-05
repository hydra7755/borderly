import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  readTime: string;
  country: {
    name: string;
    code: string;
  };
}

// Sample blog data - in a real application this would come from an API
const blogData: Record<string, BlogPost[]> = {
  TR: [
    {
      id: 'turkey-evisa-guide',
      title: 'Complete Guide to Turkey eVisa',
      excerpt: 'Turkey\'s electronic visa system makes entry to this fascinating country easier than ever. Learn about the requirements, application process, and tips for a hassle-free experience.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/tr_image_1',
      readTime: '7 min read',
      country: { name: 'Turkey', code: 'TR' }
    },
    {
      id: 'istanbul-top-attractions',
      title: 'Top 10 Attractions in Istanbul',
      excerpt: 'Discover the most iconic sights and hidden gems in Istanbul, where East meets West across the Bosphorus Strait.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/tr_image_2',
      readTime: '5 min read',
      country: { name: 'Turkey', code: 'TR' }
    },
    {
      id: 'turkish-cuisine-guide',
      title: 'An Introduction to Turkish Cuisine',
      excerpt: 'From kebabs to baklava, explore the rich flavors and traditions of Turkish food that have influenced culinary traditions worldwide.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/tr_image_3',
      readTime: '6 min read',
      country: { name: 'Turkey', code: 'TR' }
    }
  ],
  IN: [
    {
      id: 'india-evisa-explained',
      title: 'India eVisa: Everything You Need to Know',
      excerpt: 'India\'s electronic visa system has revolutionized travel to this diverse and culturally rich country. Discover the different types of eVisas available.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/in_image_1',
      readTime: '8 min read',
      country: { name: 'India', code: 'IN' }
    },
    {
      id: 'taj-mahal-visit-guide',
      title: 'Complete Guide to Visiting the Taj Mahal',
      excerpt: 'Planning to visit the iconic Taj Mahal? Read our comprehensive guide covering the best times to visit, ticket information, and photography tips.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/in_image_2',
      readTime: '6 min read',
      country: { name: 'India', code: 'IN' }
    },
    {
      id: 'india-train-travel',
      title: 'Train Travel in India: A Comprehensive Guide',
      excerpt: 'Explore India\'s vast railway network, from luxury trains to local services, and learn how to navigate this authentic travel experience.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/in_image_3',
      readTime: '9 min read',
      country: { name: 'India', code: 'IN' }
    }
  ],
  // Fallback default blogs for countries without specific content
  default: [
    {
      id: 'travel-documentation-tips',
      title: 'Essential Travel Documentation Tips',
      excerpt: 'Learn how to prepare your travel documents, from passports to visas, to ensure smooth international travel experiences.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/sample',
      readTime: '5 min read',
      country: { name: 'Global', code: 'GLOBAL' }
    },
    {
      id: 'airport-security-guide',
      title: 'Airport Security: What You Need to Know',
      excerpt: 'Navigate airport security checks with confidence using these expert tips and understanding current regulations.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/sample',
      readTime: '4 min read',
      country: { name: 'Global', code: 'GLOBAL' }
    },
    {
      id: 'packing-essentials',
      title: 'Packing Essentials for International Travel',
      excerpt: 'Pack like a pro with our comprehensive guide to essential items for any international journey.',
      image: 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/sample',
      readTime: '6 min read',
      country: { name: 'Global', code: 'GLOBAL' }
    }
  ]
};

interface BlogSliderProps {
  countryCode: string;
}

const BlogSlider: React.FC<BlogSliderProps> = ({ countryCode }) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    // In a real application, this would be an API call
    // For now, we'll use our static data
    const countryBlogs = blogData[countryCode] || blogData.default;
    setBlogs(countryBlogs);
  }, [countryCode]);

  if (blogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore Travel Guides</h2>
        
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            }
          }}
          className="blog-slider"
        >
          {blogs.map((blog) => (
            <SwiperSlide key={blog.id}>
              <Link 
                to={`/blogs/${blog.id}`}
                className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 relative">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Fallback image if the blog image fails to load
                      (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/sample';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{blog.excerpt}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary-600 font-medium">Read more</span>
                    <span className="text-gray-500">{blog.readTime}</span>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
        
        <div className="mt-8 text-center">
          <Link
            to="/blogs"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            View All Travel Guides
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogSlider; 