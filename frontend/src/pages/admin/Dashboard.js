import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { publicAPI, blogAPI, categoryAPI } from '../../services/api';
import { 
  FiFileText, 
  FiTag, 
  FiEye, 
  FiTrendingUp,
  FiPlus,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, blogsRes] = await Promise.all([
          publicAPI.getStats(),
          blogAPI.getAll({ limit: 5, page: 1 }),
        ]);

        setStats(statsRes.data.data);
        setRecentBlogs(blogsRes.data.data.blogs);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Banglay IELTS Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.username}!</p>
          </div>
          <Link
            to="/admin/blogs/new"
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <FiPlus size={16} />
            <span>New Blog</span>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Blogs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_blogs}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiFileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_categories}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiTag className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_views.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiEye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Views</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_blogs > 0 ? Math.round(stats.total_views / stats.total_blogs) : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Blogs */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Blogs</h2>
              <Link
                to="/admin/blogs"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body p-0">
            {recentBlogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
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
                    {recentBlogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {blog.image && (
                              <img
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                                src={`http://localhost:5000/${blog.image}`}
                                alt={blog.title}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {blog.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                By {blog.author}
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
                          {blog.views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(blog.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/admin/blogs/edit/${blog.id}`}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </Link>
                            <a
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700"
                              title="View"
                            >
                              <FiEye size={16} />
                            </a>
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new blog post.</p>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-body text-center">
              <FiFileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Blogs</h3>
              <p className="text-gray-600 mb-4">Create, edit, and manage your blog posts.</p>
              <Link to="/admin/blogs" className="btn btn-outline">
                Go to Blogs
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <FiTag className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Categories</h3>
              <p className="text-gray-600 mb-4">Organize your content with categories.</p>
              <Link to="/admin/categories" className="btn btn-outline">
                Go to Categories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;