import React, { createContext, useContext, useState, useEffect } from 'react';
import { siteSettingsAPI } from '../services/api';

const SiteSettingsContext = createContext();

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site_logo: { value: 'Banglay IELTS', filePath: null },
    site_favicon: { value: '', filePath: '/favicon.ico' },
    site_title: { value: 'Banglay IELTS - Your Trusted Partner for IELTS Success', filePath: null },
    site_description: { value: 'Get expert IELTS preparation, tips, and guidance from Banglay IELTS. Your success is our mission.', filePath: null },
    theme_mode: { value: 'light', filePath: null }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings from server
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await siteSettingsAPI.getSettings();
      
      if (response.data.success) {
        setSettings(response.data.settings);
        setError(null);
        
        // Update favicon dynamically
        updateFavicon(response.data.settings.site_favicon?.filePath || '/favicon.ico');
        
        // Update page title dynamically
        updatePageTitle(response.data.settings.site_title?.value || 'Banglay IELTS');
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
      setError('Failed to load site settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Update favicon in the document head
  const updateFavicon = (faviconPath) => {
    try {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Add new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = faviconPath.startsWith('/uploads') 
        ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${faviconPath}`
        : faviconPath;
      
      document.head.appendChild(link);
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  };

  // Update page title in the document head
  const updatePageTitle = (title) => {
    try {
      document.title = title;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && settings.site_description?.value) {
        metaDesc.setAttribute('content', settings.site_description.value);
      }
    } catch (error) {
      console.error('Error updating page title:', error);
    }
  };

  // Upload logo
  const uploadLogo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await siteSettingsAPI.uploadLogo(formData);
      
      if (response.data.success) {
        await fetchSettings(); // Refresh settings
        return { success: true, logoPath: response.data.logoPath };
      } else {
        throw new Error(response.data.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload logo');
    }
  };

  // Upload favicon
  const uploadFavicon = async (file) => {
    try {
      const formData = new FormData();
      formData.append('favicon', file);
      
      const response = await siteSettingsAPI.uploadFavicon(formData);
      
      if (response.data.success) {
        await fetchSettings(); // Refresh settings
        return { success: true, faviconPath: response.data.faviconPath };
      } else {
        throw new Error(response.data.message || 'Failed to upload favicon');
      }
    } catch (error) {
      console.error('Error uploading favicon:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload favicon');
    }
  };

  // Update setting
  const updateSetting = async (key, value) => {
    try {
      const response = await siteSettingsAPI.updateSetting(key, value);
      
      if (response.data.success) {
        await fetchSettings(); // Refresh settings
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      throw new Error(error.response?.data?.message || 'Failed to update setting');
    }
  };

  // Reset logo
  const resetLogo = async () => {
    try {
      const response = await siteSettingsAPI.resetLogo();
      
      if (response.data.success) {
        await fetchSettings(); // Refresh settings
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to reset logo');
      }
    } catch (error) {
      console.error('Error resetting logo:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset logo');
    }
  };

  // Reset favicon
  const resetFavicon = async () => {
    try {
      const response = await siteSettingsAPI.resetFavicon();
      
      if (response.data.success) {
        await fetchSettings(); // Refresh settings
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to reset favicon');
      }
    } catch (error) {
      console.error('Error resetting favicon:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset favicon');
    }
  };

  // Get logo URL for display
  const getLogoUrl = () => {
    if (settings.site_logo?.filePath) {
      return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${settings.site_logo.filePath}`;
    }
    return null; // Use text logo
  };

  // Get favicon URL for display
  const getFaviconUrl = () => {
    const faviconPath = settings.site_favicon?.filePath || '/favicon.ico';
    if (faviconPath.startsWith('/uploads')) {
      return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${faviconPath}`;
    }
    return faviconPath;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings,
    isLoading,
    error,
    fetchSettings,
    uploadLogo,
    uploadFavicon,
    updateSetting,
    resetLogo,
    resetFavicon,
    getLogoUrl,
    getFaviconUrl
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};