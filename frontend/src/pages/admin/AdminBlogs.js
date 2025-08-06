import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogAPI, categoryAPI } from '../../services/api';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: ''
  });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [pagination.page, filters]);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        category: filters.category
      };

      const response = await blogAPI.getAll(params);
      setBlogs(response.data.data.blogs || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Error loading blogs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilter = (e) => {
    setFilters(prev => ({ ...prev, category: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      setDeletingId(id);
      await blogAPI.delete(id);
      toast.success('Blog deleted successfully');
      fetchBlogs(); // Refresh the list
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Error deleting blog');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <>
      <Helmet>
        <title>Manage Blogs - Banglay IELTS Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Blogs</h1>
            <p className="text-gray-600">Create, edit, and manage your blog posts</p>
          </div>
          <Link
            to="/admin/blogs/new"
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <FiPlus size={16} />
            <span>New Blog</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="form-input pl-10"
                />
              </div>
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={filters.category}
                  onChange={handleCategoryFilter}
                  className="form-select pl-10"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                Showing {blogs.length} of {pagination.total} blogs
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="card">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="large" />
              </div>
            ) : blogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blog
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {blog.image && (
                              <img
                                className="w-12 h-12 rounded-lg object-cover mr-4"
                                src={`http://localhost:5000/${blog.image}`}
                                alt={blog.title}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {truncateText(blog.title, 60)}
                              </div>
                              <div className="text-sm text-gray-500">
                                /blog/{blog.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {blog.category_name ? (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {blog.category_name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No category</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {blog.author}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {blog.views || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(blog.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 p-1 rounded"
                              title="View"
                            >
                              <FiEye size={16} />
                            </a>
                            <button
                              onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                              className="text-blue-600 hover:text-blue-700 p-1 rounded"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(blog.id)}
                              disabled={deletingId === blog.id}
                              className="text-red-600 hover:text-red-700 p-1 rounded disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === blog.id ? (
                                <LoadingSpinner size="small" />
                              ) : (
                                <FiTrash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search || filters.category 
                    ? 'Try adjusting your search filters.'
                    : 'Get started by creating a new blog post.'
                  }
                </p>
                <div className="mt-6">
                  <Link
                    to="/admin/blogs/new"
                    className="btn btn-primary inline-flex items-center space-x-2"
                  >
                    <FiPlus size={16} />
                    <span>New Blog</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={16} />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = Math.max(1, pagination.page - 2) + i;
                if (page > pagination.pages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 text-sm rounded-md ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBlogs;