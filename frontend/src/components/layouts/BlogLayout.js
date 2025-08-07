import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiFileText, 
  FiUser, 
  FiMail,
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiYoutube,
  FiPhone,
  FiMapPin,
  FiAward,
  FiBook,
  FiSearch
} from 'react-icons/fi';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { redirectToMain } from '../../utils/subdomain';

const BlogLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings, getLogoUrl } = useSiteSettings();
  
  const logoUrl = getLogoUrl();

  const handleHomeClick = (e) => {
    e.preventDefault();
    redirectToMain();
  };

  const navigation = [
    { name: 'Blog Home', href: '/', icon: FiHome, current: location.pathname === '/' },
    { name: 'All Posts', href: '/posts', icon: FiFileText, current: location.pathname === '/posts' },
    { name: 'Categories', href: '/categories', icon: FiBook, current: location.pathname === '/categories' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        {/* Top Contact Bar */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-2 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-gray-700">
                  <FiPhone size={14} className="text-red-600" />
                  <span>+880 1234-567890</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-700">
                  <FiMail size={14} className="text-red-600" />
                  <span>info@banglayielts.com</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <FiFacebook size={16} />
                </a>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <FiYoutube size={16} />
                </a>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <FiInstagram size={16} />
                </a>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  <FiLinkedin size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <button onClick={handleHomeClick} className="flex items-center group cursor-pointer">
                {logoUrl ? (
                  <div className="h-12">
                    <img 
                      src={logoUrl} 
                      alt={settings.site_title?.value || 'Banglay IELTS Blog'} 
                      className="h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <FiAward className="text-white text-xl" />
                    </div>
                    <div>
                      <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                        Banglay IELTS Blog
                      </span>
                      <p className="text-xs text-gray-500 -mt-1">IELTS Tips & Strategies</p>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      item.current
                        ? 'bg-red-100 text-red-700 shadow-sm'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Search and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <FiSearch size={20} />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                {logoUrl ? (
                  <div className="h-10">
                    <img 
                      src={logoUrl} 
                      alt={settings.site_title?.value || 'Banglay IELTS'} 
                      className="h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <FiAward className="text-white text-lg" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">Banglay IELTS Blog</h3>
                  <p className="text-gray-300 text-sm">Your Gateway to IELTS Success</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Discover comprehensive IELTS preparation resources, expert tips, and proven strategies 
                to achieve your target band score. From practice tests to study guides, we've got 
                everything you need for IELTS success.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiFacebook size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiYoutube size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiInstagram size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiLinkedin size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Blog Home</Link></li>
                <li><Link to="/posts" className="text-gray-300 hover:text-white transition-colors">All Posts</Link></li>
                <li><Link to="/categories" className="text-gray-300 hover:text-white transition-colors">Categories</Link></li>
                <li><button onClick={handleHomeClick} className="text-gray-300 hover:text-white transition-colors">Main Site</button></li>
              </ul>
            </div>

            {/* IELTS Resources */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">IELTS Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/category/reading" className="text-gray-300 hover:text-white transition-colors">Reading Tips</Link></li>
                <li><Link to="/category/writing" className="text-gray-300 hover:text-white transition-colors">Writing Guide</Link></li>
                <li><Link to="/category/listening" className="text-gray-300 hover:text-white transition-colors">Listening Practice</Link></li>
                <li><Link to="/category/speaking" className="text-gray-300 hover:text-white transition-colors">Speaking Skills</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Banglay IELTS Blog. Your trusted partner for IELTS success.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button onClick={handleHomeClick} className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </button>
              <button onClick={handleHomeClick} className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </button>
              <button onClick={handleHomeClick} className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLayout;