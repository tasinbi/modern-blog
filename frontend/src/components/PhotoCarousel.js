import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

const PhotoCarousel = ({ photos, title, autoPlay = true, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Auto-play functionality
  React.useEffect(() => {
    if (autoPlay && photos.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === photos.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoPlay, interval, photos.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
  };

  const openModal = (index) => {
    setModalIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToPreviousModal = () => {
    setModalIndex(modalIndex === 0 ? photos.length - 1 : modalIndex - 1);
  };

  const goToNextModal = () => {
    setModalIndex(modalIndex === photos.length - 1 ? 0 : modalIndex + 1);
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Main Carousel */}
        <div className="relative h-96 overflow-hidden">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out cursor-pointer ${
                index === currentIndex 
                  ? 'translate-x-0' 
                  : index < currentIndex 
                    ? '-translate-x-full' 
                    : 'translate-x-full'
              }`}
              onClick={() => openModal(index)}
            >
              <img
                src={photo.image}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">{photo.title}</h3>
                {photo.caption && (
                  <p className="text-gray-200 text-sm">{photo.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors duration-200"
            >
              <FiChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors duration-200"
            >
              <FiChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo Counter */}
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex 
                  ? 'border-red-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={photo.image}
                alt={photo.caption || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors duration-200"
            >
              <FiX className="w-6 h-6 text-white" />
            </button>

            {/* Modal Image */}
            <img
              src={photos[modalIndex].image}
              alt={photos[modalIndex].caption || `Photo ${modalIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Modal Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPreviousModal}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-3 transition-colors duration-200"
                >
                  <FiChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={goToNextModal}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-3 transition-colors duration-200"
                >
                  <FiChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* Modal Caption */}
            {photos[modalIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {photos[modalIndex].title}
                </h3>
                <p className="text-gray-200">{photos[modalIndex].caption}</p>
              </div>
            )}

            {/* Modal Counter */}
            <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full">
              {modalIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoCarousel;