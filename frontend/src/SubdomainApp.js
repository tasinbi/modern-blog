import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { isBlogSubdomain } from './utils/subdomain';

// Blog Pages
import BlogHome from './pages/blog/BlogHome';
import BlogList from './pages/public/BlogList';
import BlogPost from './pages/public/BlogPost';
import Category from './pages/public/Category';

// Main Site Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';

// Admin Pages
import Login from './pages/admin/Login';
import ForgotPassword from './pages/admin/ForgotPassword';
import ResetPassword from './pages/admin/ResetPassword';
import AdminRegister from './pages/admin/AdminRegister';
import Dashboard from './pages/admin/Dashboard';
import AdminBlogs from './pages/admin/AdminBlogs';
import BlogForm from './pages/admin/BlogForm';
import Categories from './pages/admin/Categories';
import SiteSettings from './pages/admin/SiteSettings';

// Layouts
import PrivateRoute from './components/PrivateRoute';
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';
import BlogLayout from './components/layouts/BlogLayout';

// Blog-specific App for subdomain
const BlogApp = () => {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Blog Routes (for blog.localhost or blog.banglayielts.com) */}
              <Route path="/" element={<BlogLayout />}>
                <Route index element={<BlogHome />} />
                <Route path="posts" element={<BlogList />} />
                <Route path="categories" element={<Category />} />
                <Route path="category/:categoryName" element={<Category />} />
                <Route path=":slug" element={<BlogPost />} />
              </Route>
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                success: { duration: 3000 },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </SiteSettingsProvider>
  );
};

// Main App for primary domain
const MainApp = () => {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="blogs" element={<BlogList />} />
                <Route path="blogs/:slug" element={<BlogPost />} />
                <Route path="category/:categoryName" element={<Category />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
              </Route>

              {/* Admin Auth Routes (outside layout) */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin/reset-password" element={<ResetPassword />} />

              {/* Admin Protected Routes */}
              <Route path="/admin" element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="blogs/new" element={<BlogForm />} />
                <Route path="blogs/edit/:id" element={<BlogForm />} />
                <Route path="categories" element={<Categories />} />
                <Route path="site-settings" element={<SiteSettings />} />
                <Route path="register" element={<AdminRegister />} />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                    <a
                      href="/"
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              } />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                success: { duration: 3000 },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </SiteSettingsProvider>
  );
};

// Main App Component that routes based on subdomain
function SubdomainApp() {
  const isBlogSubdomainActive = isBlogSubdomain();
  
  return isBlogSubdomainActive ? <BlogApp /> : <MainApp />;
}

export default SubdomainApp;