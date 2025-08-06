import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiFileText, 
  FiTag, 
  FiLogOut,
  FiUser,
  FiPlus
} from 'react-icons/fi';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, exact: true },
    { name: 'Blogs', href: '/admin/blogs', icon: FiFileText },
    { name: 'Categories', href: '/admin/categories', icon: FiTag },
  ];

  const isActivePath = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-16'
      } lg:w-64`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className={`text-xl font-bold text-gray-900 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0'
            } lg:opacity-100`}>
              Admin Panel
            </span>
          </div>
        </div>

        <nav className="mt-6">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href, item.exact);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span className={`transition-opacity duration-300 ${
                    isSidebarOpen ? 'opacity-100' : 'opacity-0'
                  } lg:opacity-100`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 px-4">
            <h3 className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0'
            } lg:opacity-100`}>
              Quick Actions
            </h3>
            <Link
              to="/admin/blogs/new"
              className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200"
            >
              <FiPlus size={16} />
              <span className={`transition-opacity duration-300 ${
                isSidebarOpen ? 'opacity-100' : 'opacity-0'
              } lg:opacity-100`}>
                New Blog
              </span>
            </Link>
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <FiUser size={16} className="text-gray-600" />
            </div>
            <div className={`flex-1 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0'
            } lg:opacity-100`}>
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
              title="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                View Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;