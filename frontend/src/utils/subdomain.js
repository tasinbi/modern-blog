// Subdomain detection and configuration utility

export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // For development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // No subdomain on localhost
  }
  
  // For blog.localhost in development
  if (hostname === 'blog.localhost') {
    return 'blog';
  }
  
  // For production (blog.banglayielts.com)
  const parts = hostname.split('.');
  
  // If hostname has more than 2 parts, first part is subdomain
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
};

export const isBlogSubdomain = () => {
  const subdomain = getSubdomain();
  return subdomain === 'blog';
};

export const getMainDomain = () => {
  const hostname = window.location.hostname;
  
  // Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost:3000';
  }
  
  if (hostname === 'blog.localhost') {
    return 'localhost:3000';
  }
  
  // Production
  if (hostname.includes('banglayielts.com')) {
    return 'banglayielts.com';
  }
  
  // Fallback
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts.slice(1).join('.');
  }
  
  return hostname;
};

export const getBlogDomain = () => {
  const hostname = window.location.hostname;
  
  // Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'blog.localhost';
  }
  
  if (hostname === 'blog.localhost') {
    return 'blog.localhost';
  }
  
  // Production
  if (hostname.includes('banglayielts.com')) {
    return 'blog.banglayielts.com';
  }
  
  // Fallback for other domains
  const mainDomain = getMainDomain();
  return `blog.${mainDomain}`;
};

export const redirectToBlog = (slug = '') => {
  const blogDomain = getBlogDomain();
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  let url = `${protocol}//${blogDomain}`;
  
  // Add port for development
  if (port && (blogDomain.includes('localhost') || blogDomain.includes('127.0.0.1'))) {
    url = `${protocol}//${blogDomain}:${port}`;
  }
  
  if (slug) {
    url += `/${slug}`;
  }
  
  window.location.href = url;
};

export const redirectToMain = (path = '') => {
  const mainDomain = getMainDomain();
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  let url = `${protocol}//${mainDomain}`;
  
  // Add port for development
  if (port && (mainDomain.includes('localhost') || mainDomain.includes('127.0.0.1'))) {
    url = `${protocol}//${mainDomain}:${port}`;
  }
  
  if (path) {
    url += `/${path}`;
  }
  
  window.location.href = url;
};

export const getApiBaseUrl = () => {
  // Always use the main domain for API calls
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Development
  if (window.location.hostname.includes('localhost')) {
    return `${protocol}//localhost:5000`;
  }
  
  // Production
  if (window.location.hostname.includes('banglayielts.com')) {
    return `${protocol}//banglayielts.com/api`;
  }
  
  // Fallback
  return `${protocol}//${getMainDomain()}/api`;
};