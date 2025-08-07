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
} from 'react-icons/fi';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { redirectToBlog } from '../../utils/subdomain';

const PublicLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { settings, getLogoUrl } = useSiteSettings();

  const navigation = [
    { name: 'Home', href: '/', icon: FiHome },
    { name: 'Blogs', href: '/blogs', icon: FiFileText },
    { name: 'About', href: '/about', icon: FiUser },
    { name: 'Contact', href: '/contact', icon: FiMail },
  ];

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const logoUrl = getLogoUrl();

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FiPhone size={14} />
                <span>01303-537667</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiMail size={14} />
                <span>info@banglayielts.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-red-100">Follow us:</span>
              <a href="https://www.facebook.com/BanglayIELTS" className="hover:text-red-200 transition-colors">
                <FiFacebook size={16} />
              </a>
              <a href="https://www.youtube.com/@banglayielts" className="hover:text-red-200 transition-colors">
                <FiYoutube size={16} />
              </a>
              <a href="https://www.instagram.com/banglayielts/?hl=en" className="hover:text-red-200 transition-colors">
                <FiInstagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-xl sticky top-0 z-50 border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              {logoUrl ? (
                // Show only logo image when uploaded
                <div className="h-16">
                  <img 
                    src={logoUrl} 
                    alt={settings.site_title?.value || 'Banglay IELTS'} 
                    className="h-full w-auto object-contain"
                  />
                </div>
              ) : (
                // Show text logo when no image uploaded
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <FiAward className="text-white text-xl" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                      {settings.site_logo?.value || 'Banglay IELTS'}
                    </span>
                    <p className="text-xs text-gray-500 -mt-1">Your Gateway to Success</p>
                  </div>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActivePath(item.href)
                        ? 'text-red-600 bg-red-50 shadow-sm'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                    {isActivePath(item.href) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
              
              {/* CTA Button */}
              <button
                onClick={() => window.location.href = 'http://blog.localhost:3000'}
                className="ml-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Visit Blog
              </button>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-red-100 shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      isActivePath(item.href)
                        ? 'text-red-600 bg-red-50 shadow-sm'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile CTA */}
              <div className="pt-4 border-t border-red-100">
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full bg-gradient-to-r from-red-500 to-red-600 text-white text-center px-4 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Brand Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  {logoUrl ? (
                    // Show logo image in footer when uploaded
                    <div className="h-12">
                      <img 
                        src={logoUrl} 
                        alt={settings.site_title?.value || 'Banglay IELTS'} 
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  ) : (
                    // Show text logo in footer when no image uploaded
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FiAward className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
                          {settings.site_logo?.value || 'Banglay IELTS'}
                        </h3>
                        <p className="text-gray-400 text-sm">Your Gateway to Success</p>
                      </div>
                    </>
                  )}
                </div>
                
                <p className="text-gray-300 text-base leading-relaxed mb-6 max-w-md">
                  The highest quality education and guidance for IELTS success. Achieve your dream score with us.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <FiMapPin className="text-red-400" size={18} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Office</p>
                      <p className="text-gray-400 text-sm">
                      Rahman Heights, Plot-01, 3rd floor, Road-13, Sector-4, Rajlokkhi, Uttara, Dhaka- 1230</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <FiPhone className="text-red-400" size={18} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Call Us</p>
                      <p className="text-gray-400 text-sm"> 01303-537667</p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <p className="text-white font-medium mb-3">Follow Us</p>
                  <div className="flex space-x-3">
                    <a
                      href="https://www.facebook.com/BanglayIELTS"
                      className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-300 hover:scale-110"
                      aria-label="Facebook"
                    >
                      <FiFacebook size={18} className="text-white" />
                    </a>
                    <a
                      href="https://www.youtube.com/@banglayielts"
                      className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-all duration-300 hover:scale-110"
                      aria-label="YouTube"
                    >
                      <FiYoutube size={18} className="text-white" />
                    </a>
                    <a
                      href="https://www.instagram.com/banglayielts/?hl=en"
                      className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center hover:bg-pink-700 transition-all duration-300 hover:scale-110"
                      aria-label="Instagram"
                    >
                      <FiInstagram size={18} className="text-white" />
                    </a>
                    <a
                      href="https://www.linkedin.com/company/banglay-ielts/"
                      className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-blue-900 transition-all duration-300 hover:scale-110"
                      aria-label="LinkedIn"
                    >
                      <FiLinkedin size={18} className="text-white" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <FiBook className="mr-2 text-red-400" size={20} />
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      to="/blogs" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      IELTS Tips & Articles
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/about" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      About Banglay IELTS
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/contact" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Contact & Support
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>

              {/* IELTS Resources */}
              <div>
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <FiAward className="mr-2 text-red-400" size={20} />
                  IELTS Resources
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Reading Practice
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Writing Templates
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Listening Tests
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Speaking Topics
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-300 hover:text-red-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1 h-1 bg-red-400 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                      Score Calculator
                    </a>
                  </li>
                </ul>

                {/* Newsletter */}
                <div className="mt-8 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
                  <h4 className="text-white font-medium mb-2 flex items-center">
                    <FiMail className="mr-2 text-red-400" size={16} />
                    Newsletter
                  </h4>
                  <p className="text-gray-400 text-sm mb-3">Get IELTS tips weekly</p>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Email address"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white text-sm focus:outline-none focus:border-red-400"
                    />
                    <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-r-lg transition-colors duration-200">
                      <FiMail size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-gray-400 text-sm">
                  © {new Date().getFullYear()} Banglay IELTS. All rights reserved. Your trusted partner for IELTS success.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;