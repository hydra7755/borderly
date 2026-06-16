import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { FaArrowRight, FaBookOpen } from 'react-icons/fa';
import { blogPosts } from '../../data/blogs-data';
import { BlogPost } from '../../types/blog';
import { generateCloudinaryUrls } from '../../types/visaProduct';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface BlogSliderProps {
  countryCode: string;
  limit?: number;
}

const FALLBACK_IMAGE =
  'https://res.cloudinary.com/drdpxs3je/image/upload/f_auto,q_auto/sample';

function getBlogImageCandidates(blog: BlogPost): string[] {
  const code = blog.country.code.toLowerCase();
  return [
    blog.image,
    ...generateCloudinaryUrls(code).slice(0, 3),
    FALLBACK_IMAGE,
  ];
}

const BlogImage: React.FC<{ blog: BlogPost; className?: string }> = ({ blog, className = '' }) => {
  const candidates = getBlogImageCandidates(blog);
  const [index, setIndex] = useState(0);

  return (
    <img
      src={candidates[index]}
      alt={blog.title}
      className={className}
      loading="lazy"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex((prev) => prev + 1);
        }
      }}
    />
  );
};

const BlogCard: React.FC<{ blog: BlogPost; featured?: boolean }> = ({ blog, featured = false }) => {
  if (featured) {
    return (
      <Link to={`/blog/${blog.id}`} className="group block h-full">
        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 md:flex-row">
          <div className="relative md:w-2/5 lg:w-5/12">
            <BlogImage
              blog={blog}
              className="h-52 w-full object-cover md:h-full md:min-h-[260px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-black/30" />
          </div>
          <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                {blog.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{blog.readTime}</span>
            </div>
            <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white md:text-2xl">
              {blog.title}
            </h3>
            <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:text-base">
              {blog.excerpt}
            </p>
            <span className="mt-auto inline-flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400">
              Read the full guide
              <FaArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${blog.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="relative aspect-[16/10] overflow-hidden">
          <BlogImage
            blog={blog}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 backdrop-blur-sm">
            {blog.country.name}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
              {blog.category}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{blog.readTime}</span>
          </div>
          <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white">
            {blog.title}
          </h3>
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {blog.excerpt}
          </p>
          <span className="inline-flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400">
            Read more
            <FaArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
};

const BlogSlider: React.FC<BlogSliderProps> = ({ countryCode, limit = 5 }) => {
  const countryBlogs = blogPosts
    .filter((blog) => blog.country.code.toLowerCase() === countryCode.toLowerCase())
    .slice(0, limit);

  const blogs = countryBlogs.length > 0 ? countryBlogs : blogPosts.slice(0, limit);
  const countryName = countryBlogs[0]?.country.name;

  if (blogs.length === 0) return null;

  const useCarousel = blogs.length > 3;

  return (
    <section className="-mx-8 mt-12 border-t border-gray-200 bg-gradient-to-br from-slate-50 via-white to-primary-50/40 px-6 py-12 dark:border-gray-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              <FaBookOpen className="h-3 w-3" />
              Travel inspiration
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {countryName ? `Guides for ${countryName}` : 'Popular travel guides'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              Stories, tips, and visa-ready advice to help you plan your trip with confidence.
            </p>
          </div>
          <Link
            to={countryBlogs.length > 0 ? `/blogs?country=${countryCode.toLowerCase()}` : '/blogs'}
            className="inline-flex shrink-0 items-center text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
          >
            View all guides
            <FaArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </div>

        {useCarousel ? (
          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="blog-swiper !pb-14"
          >
            {blogs.map((blog) => (
              <SwiperSlide key={blog.id} className="!h-auto">
                <BlogCard blog={blog} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div
            className={
              blogs.length === 1
                ? 'mx-auto max-w-4xl'
                : `grid gap-6 ${blogs.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`
            }
          >
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} featured={blogs.length === 1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSlider;
