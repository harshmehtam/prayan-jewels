'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductService } from '@/lib/data/products';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search products...",
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          const suggestions = await ProductService.getSearchSuggestions(query.trim(), 5);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
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
  }, [query]);

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    onSearch(searchQuery.trim());
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    // Trigger search immediately if query is empty (to show all products)
    if (!value.trim()) {
      onSearch('');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selectedSuggestion = suggestions[selectedIndex];
          setQuery(selectedSuggestion);
          handleSearch(selectedSuggestion);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Search Button */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          {loading ? (
            <div className="pr-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <button
              onClick={() => handleSearch()}
              className="mr-1 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              type="button"
            >
              <span className="sr-only">Search</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No suggestions message */}
      {showSuggestions && !loading && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No suggestions found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}