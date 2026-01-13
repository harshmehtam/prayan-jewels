'use client';
import { useState } from 'react';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  // Mobile Carousel
  const MobileCarousel = () => (
    <div className="md:hidden">
      <div className="relative w-full aspect-square overflow-hidden">
        <div 
          className="flex w-full h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              {!imageError[index] ? (
                <CachedAmplifyImage
                  path={image}
                  alt={`${productName} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
          ))}
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 z-10"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 z-10"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  selectedImageIndex === index ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
    </div>
  );

  // Desktop Grid
  const DesktopGrid = () => (
    <div className="hidden md:block">
      <div className="aspect-square w-full overflow-hidden">
        {images.length === 1 && (
          <div className="relative h-full w-full">
            {!imageError[0] ? (
              <CachedAmplifyImage
                path={images[0]}
                alt={`${productName} - Image 1`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(0)}
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        )}

        {images.length === 2 && (
          <div className="grid grid-cols-2 h-full">
            {images.map((image, index) => (
              <div key={index} className="relative overflow-hidden border-r border-gray-200 last:border-r-0 h-full">
                {!imageError[index] ? (
                  <CachedAmplifyImage
                    path={image}
                    alt={`${productName} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>
            ))}
          </div>
        )}

        {images.length === 3 && (
          <div className="grid grid-rows-2 h-full">
            <div className="grid grid-cols-2">
              {images.slice(0, 2).map((image, index) => (
                <div key={index} className="relative overflow-hidden border-r border-gray-200 last:border-r-0 border-b border-gray-200 h-full">
                  {!imageError[index] ? (
                    <CachedAmplifyImage
                      path={image}
                      alt={`${productName} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
              ))}
            </div>
            <div className="relative overflow-hidden h-full">
              {!imageError[2] ? (
                <CachedAmplifyImage
                  path={images[2]}
                  alt={`${productName} - Image 3`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(2)}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
          </div>
        )}

        {images.length >= 4 && (
          <div className="grid grid-cols-2 grid-rows-2 h-full">
            {images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative overflow-hidden border-r border-gray-200 last:border-r-0 border-b border-gray-200 h-full">
                {!imageError[index] ? (
                  <CachedAmplifyImage
                    path={image}
                    alt={`${productName} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                ) : (
                  <ImagePlaceholder />
                )}
                {index === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full lg:col-span-2">
      <button 
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <MobileCarousel />
      <DesktopGrid />
    </div>
  );
}
