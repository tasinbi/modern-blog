import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../../services/api';
import { FiUser, FiEye, FiCalendar, FiSearch, FiTrendingUp, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';

const BlogHome = () => {
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, recentRes, categoriesRes] = await Promise.all([
          publicAPI.getFeaturedBlogs(),
          publicAPI.getRecentBlogs(),
          publicAPI.getCategories()
        ]);

        setFeaturedBlogs(featuredRes.data?.data || []);
        setRecentBlogs(recentRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
      } catch (error) {
        console.error('Error fetching blog data:', error);
        setFeaturedBlogs([]);
        setRecentBlogs([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const truncateContent = (content, wordLimit = 20) => {
    if (!content) return '';
    
    const cleanText = content
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim();
    
    const words = cleanText.split(/\s+/);
    if (words.length <= wordLimit) return cleanText;
    
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderBlogCard = (blog, featured = false) => (
    <article key={blog.id} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${featured ? 'lg:col-span-2' : ''}`}>
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
        {blog.image ? (
          <img
            src={`http://localhost:5000/${blog.image}`}
            alt={blog.title}
            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <FiFileText className="text-red-400 text-4xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {blog.category_name || 'General'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h2 className={`font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-red-600 transition-colors ${featured ? 'text-xl' : 'text-lg'}`}>
          <Link to={`/${blog.slug}`}>
            {blog.title}
          </Link>
        </h2>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {truncateContent(blog.content, featured ? 25 : 20)}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiUser size={14} />
              <span>{blog.author || 'Banglay IELTS'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiCalendar size={14} />
              <span>{formatDate(blog.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <FiEye size={14} />
            <span>{blog.views || 0}</span>
          </div>
        </div>

        {/* Read More */}
        <Link
          to={`/${blog.slug}`}
          className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-sm group"
        >
          Read More
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Banglay IELTS Blog - IELTS Tips, Strategies & Preparation Guide</title>
        <meta name="description" content="Discover expert IELTS preparation tips, strategies, and practice materials. Get the latest insights on IELTS Reading, Writing, Listening, and Speaking from Banglay IELTS experts." />
        <meta name="keywords" content="IELTS, IELTS preparation, IELTS tips, IELTS practice, IELTS blog, Banglay IELTS" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 via-white to-red-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master IELTS with 
              <span className="text-red-600"> Expert Insights</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover proven strategies, tips, and practice materials from IELTS experts. 
              Get the guidance you need to achieve your target band score.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search IELTS tips, strategies, practice tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-lg"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <FiTrendingUp className="mr-3 text-red-600" />
              Featured Posts
            </h2>
            <Link
              to="/posts"
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              View All Posts
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredBlogs.slice(0, 3).map((blog, index) => 
              renderBlogCard(blog, index === 0)
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore by Category</h2>
            <p className="text-lg text-gray-600">Find resources tailored to specific IELTS skills</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 group border border-gray-200"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <FiBook className="text-red-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <FiClock className="mr-3 text-red-600" />
              Latest Posts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentBlogs.slice(0, 6).map((blog) => renderBlogCard(blog))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/posts"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              View All Posts
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogHome;