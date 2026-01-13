'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SearchBarProps {
  isScrolled: boolean;
  isHomePage: boolean;
  isMobile?: boolean;
  onSearchStart?: () => void;
}

export default function SearchBar({ isScrolled, isHomePage, isMobile = false, onSearchStart }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const router = useRouter();
  const pathname = usePathname();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch search suggestions with debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}&limit=5`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const data = await response.json();
          if (data.success) {
            setSuggestions(data.data.suggestions);
            setShowSuggestions(data.data.suggestions.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Clear search when navigating to products page
  useEffect(() => {
    if (pathname === '/products') {
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string = searchQuery) => {
    const trimmedQuery = query.trim();
    const currentPath = window.location.pathname;
    const currentSearch = new URLSearchParams(window.location.search).get('search');

    if (trimmedQuery) {
      const newUrl = `/products?search=${encodeURIComponent(trimmedQuery)}`;
      if (currentPath === '/products' && currentSearch !== trimmedQuery) {
        router.replace(newUrl);
      } else {
        router.push(newUrl);
      }
      setTimeout(() => setSearchQuery(''), 100);
    } else {
      if (currentPath === '/products' && currentSearch) {
        router.replace('/products');
      } else {
        router.push('/products');
      }
    }

    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    onSearchStart?.();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSearch(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const inputClasses = `${isMobile ? 'w-full' : 'w-72'} pl-5 pr-12 py-3 text-base rounded-full focus:outline-none focus:ring-1 backdrop-blur-sm transition-all duration-300 ${
    isScrolled || !isHomePage
      ? 'bg-gray-100 border border-gray-300 placeholder-gray-500 text-black focus:ring-gray-500 focus:border-gray-500'
      : isMobile
      ? 'bg-white bg-opacity-90 border border-gray-300 border-opacity-50 placeholder-gray-600 text-black focus:ring-gray-500 focus:border-gray-500'
      : 'bg-white bg-opacity-20 border border-gray-400 border-opacity-30 placeholder-gray-600 text-black focus:ring-gray-500 focus:border-gray-500'
  }`;

  const buttonClasses = `absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors cursor-pointer outline-none focus:outline-none ${
    isScrolled || !isHomePage ? 'text-gray-500 hover:text-black' : 'text-gray-600 hover:text-black'
  }`;

  return (
    <div ref={searchRef} className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSelectedSuggestionIndex(-1);
        }}
        onKeyDown={handleSearchKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        placeholder="Search for a product or finish"
        className={inputClasses}
      />
      <button 
        onClick={() => handleSearch()}
        className={buttonClasses}
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSearch(suggestion)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
