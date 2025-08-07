import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { FiUpload, FiSave, FiRefreshCw, FiImage, FiSettings, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const SiteSettings = () => {
  const {
    settings,
    isLoading,
    uploadLogo,
    uploadFavicon,
    updateSetting,
    resetLogo,
    resetFavicon,
    getLogoUrl
  } = useSiteSettings();
  
  const [localSettings, setLocalSettings] = useState({});
  const [uploading, setUploading] = useState({ logo: false, favicon: false });
  const [updating, setUpdating] = useState(false);
  
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  // Update local settings when global settings change
  React.useEffect(() => {
    setLocalSettings({
      site_title: settings.site_title?.value || '',
      site_description: settings.site_description?.value || ''
    });
  }, [settings]);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(prev => ({ ...prev, logo: true }));
    
    try {
      await uploadLogo(file);
      toast.success('Logo uploaded successfully!');
      
      // Clear the input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploading(prev => ({ ...prev, logo: false }));
    }
  };

  const handleFaviconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.ico')) {
      toast.error('Please select a valid favicon file (ICO, PNG, JPG, GIF, WEBP)');
      return;
    }

    // Validate file size (2MB max for favicon)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Favicon size should be less than 2MB');
      return;
    }

    setUploading(prev => ({ ...prev, favicon: true }));
    
    try {
      await uploadFavicon(file);
      toast.success('Favicon uploaded successfully!');
      
      // Clear the input
      if (faviconInputRef.current) {
        faviconInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload favicon');
    } finally {
      setUploading(prev => ({ ...prev, favicon: false }));
    }
  };

  const handleResetLogo = async () => {
    if (!window.confirm('Are you sure you want to reset the logo to default?')) {
      return;
    }

    try {
      await resetLogo();
      toast.success('Logo reset to default successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to reset logo');
    }
  };

  const handleResetFavicon = async () => {
    if (!window.confirm('Are you sure you want to reset the favicon to default?')) {
      return;
    }

    try {
      await resetFavicon();
      toast.success('Favicon reset to default successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to reset favicon');
    }
  };

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setUpdating(true);
    
    try {
      const promises = [];
      
      // Update site title if changed
      if (localSettings.site_title !== settings.site_title?.value) {
        promises.push(updateSetting('site_title', localSettings.site_title));
      }
      
      // Update site description if changed
      if (localSettings.site_description !== settings.site_description?.value) {
        promises.push(updateSetting('site_description', localSettings.site_description));
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success('Settings updated successfully!');
      } else {
        toast.info('No changes to save');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const logoUrl = getLogoUrl();

  return (
    <div className="p-6">
      <Helmet>
        <title>Site Settings - Banglay IELTS Admin</title>
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your website logo, favicon, theme, and other site-wide settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logo Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiImage className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Logo Management</h2>
          </div>

          {/* Current Logo Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current Logo
            </label>
            <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Current Logo"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500 mb-1">
                                                  <FiAward className="inline mr-1" />
                              Banglay IELTS
                  </div>
                  <span className="text-xs text-gray-500">Text Logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Logo
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploading.logo}
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading.logo}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition-colors duration-200 disabled:opacity-50"
              >
                {uploading.logo ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FiUpload className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {uploading.logo ? 'Uploading...' : 'Choose Logo Image'}
                </span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: JPG, PNG, GIF, WEBP. Max size: 5MB
              </p>
            </div>

            {/* Reset Logo */}
            {logoUrl && (
              <button
                onClick={handleResetLogo}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <FiRefreshCw className="w-4 h-4" />
                Reset to Default
              </button>
            )}
          </div>
        </div>

        {/* Favicon Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiSettings className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Favicon Management</h2>
          </div>

          {/* Current Favicon Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current Favicon
            </label>
            <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded-sm flex items-center justify-center">
                                              <FiAward className="text-xs text-gray-600" />
                </div>
                <span className="text-xs text-gray-500">
                  {settings.site_favicon?.filePath?.includes('/uploads') ? 'Custom Favicon' : 'Default Favicon'}
                </span>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Favicon
              </label>
              <input
                ref={faviconInputRef}
                type="file"
                accept=".ico,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleFaviconUpload}
                className="hidden"
                disabled={uploading.favicon}
              />
              <button
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading.favicon}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition-colors duration-200 disabled:opacity-50"
              >
                {uploading.favicon ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FiUpload className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {uploading.favicon ? 'Uploading...' : 'Choose Favicon'}
                </span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: ICO, PNG, JPG, GIF, WEBP. Max size: 2MB
              </p>
            </div>

            {/* Reset Favicon */}
            {settings.site_favicon?.filePath?.includes('/uploads') && (
              <button
                onClick={handleResetFavicon}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <FiRefreshCw className="w-4 h-4" />
                Reset to Default
              </button>
            )}
          </div>
        </div>

        {/* Site Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FiSettings className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Site Information</h2>
          </div>

          <div className="space-y-6">
            {/* Site Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Title
              </label>
              <input
                type="text"
                value={localSettings.site_title || ''}
                onChange={(e) => handleSettingChange('site_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter site title"
              />
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={localSettings.site_description || ''}
                onChange={(e) => handleSettingChange('site_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
                placeholder="Enter site description"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
            >
              {updating ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;