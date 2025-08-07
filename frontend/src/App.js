import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';

// Public Pages
import Home from './pages/public/Home';
import BlogList from './pages/public/BlogList';
import BlogPost from './pages/public/BlogPost';
import Category from './pages/public/Category';
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

// Components
import PrivateRoute from './components/PrivateRoute';
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';

function App() {
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
              <Route path="blog/:slug" element={<BlogPost />} />
              <Route path="category/:categoryId" element={<Category />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Admin Auth Routes (outside layout) */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />

            {/* Private Admin Routes */}
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

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Page not found</p>
                  <a href="/" className="btn btn-primary mt-6 inline-block">
                    Go Home
                  </a>
                </div>
              </div>
            } />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
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
}

export default App;