import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { blogPosts } from '../../data/blogs-data';
import { BlogPost } from '../../types/blog';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface BlogSliderProps {
  countryCode: string;
  limit?: number;
}

const BlogSlider: React.FC<BlogSliderProps> = ({ countryCode, limit = 5 }) => {
  // Filter blogs for the specified country
  const countryBlogs = blogPosts.filter(blog => 
    blog.country.code.toLowerCase() === countryCode.toLowerCase()
  ).slice(0, limit);
  
  // If no blogs for this country, show popular blogs instead
  const blogs = countryBlogs.length > 0 
    ? countryBlogs 
    : blogPosts.slice(0, limit);

  if (blogs.length === 0) return null;

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {countryBlogs.length > 0 
              ? `Travel Guides for ${countryBlogs[0].country.name}` 
              : 'Popular Travel Guides'}
          </h2>
          <Link to="/blogs" className="text-blue-600 hover:text-blue-800 font-medium">
            View all guides →
          </Link>
        </div>
        
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="pb-12"
        >
          {blogs.map((blog) => (
            <SwiperSlide key={blog.id}>
              <BlogCard blog={blog} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

const BlogCard: React.FC<{ blog: BlogPost }> = ({ blog }) => {
  return (
    <Link to={`/blog/${blog.id}`} className="block h-full">
      <div className="bg-white rounded-lg overflow-hidden shadow-md h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
        <img 
          src={blog.image} 
          alt={blog.title} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/drdpxs3je/image/upload/v1625123456/default-blog-image.jpg';
          }}
        />
        <div className="p-5">
          <div className="flex items-center mb-3">
            <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {blog.category}
            </span>
            <span className="text-xs text-gray-500 ml-2">{blog.readTime}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3 mb-3">{blog.excerpt}</p>
          <div className="text-blue-600 text-sm font-medium">Read more →</div>
        </div>
      </div>
    </Link>
  );
};

export default BlogSlider; 