import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogPosts } from '../data/blogs-data';
import { BlogPost } from '../types/blog';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!id) return;
    
    const foundBlog = blogPosts.find(blog => blog.id === id);
    
    if (foundBlog) {
      setBlog(foundBlog);
      
      // Find related blogs (same country or category, excluding current blog)
      const related = blogPosts
        .filter(b => 
          b.id !== id && 
          (b.country.code === foundBlog.country.code || b.category === foundBlog.category)
        )
        .slice(0, 3); // Limit to 3 related blogs
      
      setRelatedBlogs(related);
    } else {
      // If blog not found, redirect to blog listing
      navigate('/blogs');
    }
  }, [id, navigate]);
  
  if (!blog) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blogs" className="hover:text-gray-700">Blogs</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{blog.title}</span>
      </nav>
      
      {/* Blog Header */}
      <header className="mb-10">
        <div className="flex items-center mb-4 space-x-2">
          <span className="text-sm font-semibold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            {blog.category}
          </span>
          <span className="text-sm font-semibold px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
            {blog.country.name}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
        <h2 className="text-xl text-gray-600 mb-6">{blog.subtitle}</h2>
        <div className="flex items-center text-sm text-gray-500">
          <span>By {blog.author}</span>
          <span className="mx-2">•</span>
          <span>{blog.date}</span>
          <span className="mx-2">•</span>
          <span>{blog.readTime}</span>
        </div>
      </header>
      
      {/* Featured Image */}
      <div className="mb-10">
        <img 
          src={blog.image} 
          alt={blog.title} 
          className="w-full h-96 object-cover rounded-lg shadow-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/drdpxs3je/image/upload/v1625123456/default-blog-image.jpg';
          }}
        />
      </div>
      
      {/* Blog Content */}
      <article className="prose prose-lg max-w-none mb-16">
        {blog.content.map((paragraph: string, index: number) => (
          <p key={index} className="mb-4">{paragraph}</p>
        ))}
      </article>
      
      {/* Tags */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-3">Related Topics</h3>
        <div className="flex flex-wrap gap-2">
          {blog.tags.map((tag: string) => (
            <Link 
              key={tag}
              to={`/blogs?tag=${tag}`} 
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <div className="border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedBlogs.map(related => (
              <Link to={`/blog/${related.id}`} key={related.id} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 group-hover:shadow-lg">
                  <img 
                    src={related.image} 
                    alt={related.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/drdpxs3je/image/upload/v1625123456/default-blog-image.jpg';
                    }}
                  />
                  <div className="p-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {related.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2 line-clamp-2 group-hover:text-blue-600">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{related.readTime}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail; 