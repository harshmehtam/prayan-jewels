'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface SortDropdownProps {
  currentSort: string;
}

export default function SortDropdown({ currentSort }: SortDropdownProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', newSort);
    params.delete('nextToken'); // Reset to first page when sorting changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700 shrink-0">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="flex-1 sm:flex-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white sm:min-w-[180px]"
      >
        <option value="most-relevant">Most Relevant</option>
        <option value="newest">New In</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="rating">Ratings</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>
  );
}
