'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MockProductService } from '@/lib/data/mockProducts';
import { AddToCartButton } from '@/components/cart';
import { DELIVERY_CONFIG } from '@/lib/config/delivery';
import type { Product } from '@/types';

interface ProductDetailProps {
  productId: string;
}

interface ProductWithInventory {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string | null;
  material: string | null;
  weight?: number | null;
  length?: number | null;
  style?: string | null;
  occasion?: string[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[] | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
  inventory?: {
    stockQuantity: number;
    reservedQuantity: number;
    reorderPoint: number;
  } | null;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<ProductWithInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await MockProductService.getProduct(productId);
        
        if (response.product) {
          setProduct(response.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    console.log('Buy now:', { productId });
  };

  const openFullscreen = (imageIndex: number) => {
    setFullscreenImageIndex(imageIndex);
    setIsFullscreenOpen(true);
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
    setZoomLevel(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * (zoomLevel - 1) * -100;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * (zoomLevel - 1) * -100;
      setZoomPosition({ x, y });
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 1) {
      setFullscreenImageIndex(prev => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 1) {
      setFullscreenImageIndex(prev => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeFullscreen();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen, product]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 animate-pulse md:hidden"></div>
            <div className="hidden md:flex gap-0">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex-1 aspect-square bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Product Info Skeleton */}
          <div className="space-y-4 p-4 md:p-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Image Gallery - Takes 2/3 of the width on desktop */}
          <div className="relative w-full lg:col-span-2">
            {/* Back Arrow - Top left */}
            <button 
              onClick={() => window.history.back()}
              className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <div className="relative w-full aspect-square overflow-hidden">
                <div 
                  className="flex w-full h-full transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
                >
                  {product.images.map((image, index) => (
                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                      {!imageError[index] ? (
                        <Image
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          fill
                          className="object-cover cursor-pointer"
                          onError={() => handleImageError(index)}
                          onClick={() => openFullscreen(index)}
                          sizes="100vw"
                          priority={index === 0}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : product.images.length - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 z-10"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(selectedImageIndex < product.images.length - 1 ? selectedImageIndex + 1 : 0)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 z-10"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Dots Indicator */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {product.images.map((_, index) => (
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

                {/* Zoom icon for mobile */}
                <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Desktop Grid Layout - 2x2 for 4 images or 2x1 + 1 for 3 images */}
            <div className="hidden md:block">
              <div className="aspect-square w-full overflow-hidden">
                {product.images.length === 2 && (
                  /* 2 Images - Side by side */
                  <div className="grid grid-cols-2 h-full">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => openFullscreen(index)}
                        className="relative overflow-hidden border-r border-gray-200 last:border-r-0 cursor-pointer group h-full"
                      >
                        {!imageError[index] ? (
                          <Image
                            src={image}
                            alt={`${product.name} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(index)}
                            sizes="50vw"
                            priority={index === 0}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Zoom indicator only on second image */}
                        {index === 1 && (
                          <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {product.images.length === 3 && (
                  /* 3 Images - 2 on top, 1 on bottom */
                  <div className="grid grid-rows-2 h-full">
                    <div className="grid grid-cols-2">
                      {product.images.slice(0, 2).map((image, index) => (
                        <button
                          key={index}
                          onClick={() => openFullscreen(index)}
                          className="relative overflow-hidden border-r border-gray-200 last:border-r-0 border-b border-gray-200 cursor-pointer group h-full"
                        >
                          {!imageError[index] ? (
                            <Image
                              src={image}
                              alt={`${product.name} - Image ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={() => handleImageError(index)}
                              sizes="25vw"
                              priority={index === 0}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Zoom indicator only on second image */}
                          {index === 1 && (
                            <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => openFullscreen(2)}
                      className="relative overflow-hidden cursor-pointer group h-full"
                    >
                      {!imageError[2] ? (
                        <Image
                          src={product.images[2]}
                          alt={`${product.name} - Image 3`}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(2)}
                          sizes="50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {product.images.length >= 4 && (
                  /* 4+ Images - 2x2 grid */
                  <div className="grid grid-cols-2 grid-rows-2 h-full">
                    {product.images.slice(0, 4).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => openFullscreen(index)}
                        className="relative overflow-hidden border-r border-gray-200 last:border-r-0 border-b border-gray-200 cursor-pointer group h-full"
                      >
                        {!imageError[index] ? (
                          <Image
                            src={image}
                            alt={`${product.name} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(index)}
                            sizes="25vw"
                            priority={index === 0}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Zoom indicator only on second image (index 1) */}
                        {index === 1 && (
                          <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        )}

                        {/* Show +X more indicator on 4th image if more than 4 images */}
                        {index === 3 && product.images.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xl font-semibold">
                              +{product.images.length - 4}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {product.images.length === 1 && (
                  /* Single Image */
                  <button
                    onClick={() => openFullscreen(0)}
                    className="relative overflow-hidden cursor-pointer group h-full w-full"
                  >
                    {!imageError[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={`${product.name} - Image 1`}
                        fill
                        className="object-cover"
                        onError={() => handleImageError(0)}
                        sizes="50vw"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Information - Takes 1/3 of the width on desktop */}
          <div className="space-y-6 md:space-y-8 p-4 md:p-6 lg:col-span-1">
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">{product.name}</h1>
              <p className="text-lg md:text-xl text-gray-600 mb-4 md:mb-6">{product.description}</p>
              
              {/* Price */}
              <div className="mb-6 md:mb-8">
                <div className="text-3xl md:text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Inclusive of all taxes
                </div>
              </div>
            </div>

            {/* Why Choose Us - Right after price */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Why Choose Us</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* 92.5 Silver */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">92.5 Silver</p>
                    <p className="text-gray-600">Premium quality</p>
                  </div>
                </div>

                {/* BIS Hallmarked */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">BIS Hallmarked</p>
                    <p className="text-gray-600">Certified quality</p>
                  </div>
                </div>

                {/* 7-Day Return */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">7-Day Return</p>
                    <p className="text-gray-600">Easy returns</p>
                  </div>
                </div>

                {/* Purity Certificate */}
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Purity Certificate</p>
                    <p className="text-gray-600">Authenticity guaranteed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Specifications</h3>
              <div className="grid grid-cols-2 gap-6 text-base">
                {product.material && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Material</p>
                      <p className="text-gray-600 capitalize">{product.material}</p>
                    </div>
                  </div>
                )}
                {product.weight && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 4.97z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Weight</p>
                      <p className="text-gray-600">{product.weight}g</p>
                    </div>
                  </div>
                )}
                {product.length && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Length</p>
                      <p className="text-gray-600">{product.length}"</p>
                    </div>
                  </div>
                )}
                {product.style && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Style</p>
                      <p className="text-gray-600">{product.style}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information - After specifications */}
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-2 md:mb-3">
                <svg className="w-5 md:w-6 h-5 md:h-6 text-gray-700 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm md:text-base font-medium text-gray-900">
                  {DELIVERY_CONFIG.getDeliveryMessage()}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                Free shipping on orders above ₹{DELIVERY_CONFIG.freeShippingThreshold}
              </p>
            </div>

            {/* Offers & Coupons */}
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-3 md:mb-4">
                <svg className="w-5 md:w-6 h-5 md:h-6 text-gray-700 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm md:text-base font-medium text-gray-900">Available Offers</span>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {/* Coupon 1 */}
                <div className="flex items-start justify-between p-3 md:p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center mb-1 md:mb-2">
                      <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded mr-3">FIRST10</span>
                      <span className="text-sm font-medium text-green-600">10% OFF</span>
                    </div>
                    <p className="text-sm text-gray-600">Get 10% off on your first order. Valid for new customers only.</p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText('FIRST10')}
                    className="text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors duration-200 ml-3 flex-shrink-0 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>

                {/* Coupon 2 */}
                <div className="flex items-start justify-between p-3 md:p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center mb-1 md:mb-2">
                      <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded mr-3">SAVE500</span>
                      <span className="text-sm font-medium text-green-600">₹500 OFF</span>
                    </div>
                    <p className="text-sm text-gray-600">Save ₹500 on orders above ₹5,000. Limited time offer.</p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText('SAVE500')}
                    className="text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors duration-200 ml-3 flex-shrink-0 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>

                {/* Coupon 3 */}
                <div className="flex items-start justify-between p-3 md:p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center mb-1 md:mb-2">
                      <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded mr-3">SILVER15</span>
                      <span className="text-sm font-medium text-green-600">15% OFF</span>
                    </div>
                    <p className="text-sm text-gray-600">Special discount on silver jewelry. Valid till month end.</p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText('SILVER15')}
                    className="text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors duration-200 ml-3 flex-shrink-0 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:gap-4">
              {/* All screen sizes layout with wishlist heart */}
              <div className="flex items-center gap-3 md:gap-4">
                <AddToCartButton 
                  product={product as unknown as Product}
                  quantity={1}
                  className="flex-1 bg-black text-white px-6 py-3 md:py-4 text-sm md:text-base font-medium uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-none"
                  buttonText="ADD TO BAG"
                />
                <button
                  className="w-12 h-12 md:w-12 md:h-12 border-2 border-gray-300 hover:border-gray-900 transition-all duration-300 flex items-center justify-center group flex-shrink-0"
                  aria-label="Add to wishlist"
                  style={{ height: '48px' }} // Match the button height
                >
                  <svg 
                    className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-red-500 transition-colors duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                    />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={handleBuyNow}
                className="w-full bg-white text-gray-900 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold uppercase tracking-wider border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-none"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreenOpen && product && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-60 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-60 flex gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="bg-white/20 text-white px-3 py-2 rounded-full text-sm">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            </div>

            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 z-60"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 z-60"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Container */}
            <div 
              className="relative max-w-full max-h-full overflow-hidden cursor-move"
              onMouseMove={handleMouseMove}
              style={{ 
                width: '90vw', 
                height: '90vh',
                cursor: zoomLevel > 1 ? 'move' : 'default'
              }}
            >
              <Image
                src={product.images[fullscreenImageIndex]}
                alt={`${product.name} - Fullscreen Image ${fullscreenImageIndex + 1}`}
                fill
                className="object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`,
                }}
                sizes="90vw"
                priority
              />
            </div>

            {/* Image Counter */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full text-sm">
                {fullscreenImageIndex + 1} / {product.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}