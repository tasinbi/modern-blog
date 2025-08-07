import React from 'react';
import { FiYoutube, FiVideo } from 'react-icons/fi';
import { FaFacebookSquare } from 'react-icons/fa';
import { FiPlay, FiExternalLink } from 'react-icons/fi';

const VideoEmbed = ({ type, embedId, title, description, thumbnail }) => {
  const getEmbedUrl = () => {
    switch (type) {
      case 'youtube':
        return `https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`;
      case 'facebook':
        return `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D${embedId}&show_text=false&width=560&height=315`;
      default:
        return '';
    }
  };

  const getWatchUrl = () => {
    switch (type) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${embedId}`;
      case 'facebook':
        return `https://www.facebook.com/watch/?v=${embedId}`;
      default:
        return '#';
    }
  };

  const getPlatformIcon = () => {
    switch (type) {
      case 'youtube':
        return <FiYoutube className="text-red-500" />;
      case 'facebook':
        return <FaFacebookSquare className="text-blue-600" />;
      default:
        return <FiVideo className="text-gray-500" />;
    }
  };

  const getPlatformName = () => {
    switch (type) {
      case 'youtube':
        return 'YouTube';
      case 'facebook':
        return 'Facebook';
      default:
        return 'Video';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-100">
        <iframe
          src={getEmbedUrl()}
          title={title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Video Info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getPlatformIcon()}</span>
            <span className="text-sm font-medium text-gray-500">{getPlatformName()}</span>
          </div>
          <a
            href={getWatchUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-red-500 hover:text-red-600 transition-colors duration-200"
          >
            <FiExternalLink size={16} />
            <span className="text-sm font-medium">Watch</span>
          </a>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-gray-600 text-sm line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoEmbed;