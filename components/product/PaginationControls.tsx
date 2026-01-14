'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface PaginationControlsProps {
  hasNextPage: boolean;
  nextToken?: string;
  isFirstPage: boolean;
}

export default function PaginationControls({ 
  hasNextPage, 
  nextToken,
  isFirstPage 
}: PaginationControlsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleNextPage = () => {
    if (nextToken) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('nextToken', nextToken);
      router.push(`${pathname}?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('nextToken');
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-8 sm:mt-12">
      <button
        onClick={handlePreviousPage}
        disabled={isFirstPage}
        className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
          isFirstPage
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <button
        onClick={handleNextPage}
        disabled={!hasNextPage}
        className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
          !hasNextPage
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        }`}
      >
        Next
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
