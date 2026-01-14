'use client';

import { useRouter, usePathname } from 'next/navigation';

interface ClearFiltersButtonProps {
  searchQuery?: string;
}

export default function ClearFiltersButton({ searchQuery }: ClearFiltersButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClearFilters = () => {
    const params = new URLSearchParams();
    // Keep search query if it exists
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      onClick={handleClearFilters}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      Clear Filters
    </button>
  );
}
