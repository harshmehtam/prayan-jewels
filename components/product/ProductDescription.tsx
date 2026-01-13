'use client';

import { useState } from 'react';

interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 md:mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
      >
        <h3 className="text-lg font-semibold text-gray-900">Product Description</h3>
        <svg 
          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg transition-all duration-300 ease-in-out">
          <div 
            className="text-gray-700 leading-relaxed product-description"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}
    </div>
  );
}
