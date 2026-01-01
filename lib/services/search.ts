// Search service for managing search history and saved searches
import type { SearchHistory, SavedSearch, ProductFilters } from '@/types';
import { mockSearchHistory, mockSavedSearches } from '@/lib/data/mock-products';

export class SearchService {
  // Get search history for a user
  static async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    // Mock implementation - filter by userId and sort by timestamp
    return mockSearchHistory
      .filter(history => history.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Add a search to history
  static async addToSearchHistory(
    userId: string, 
    query: string, 
    resultCount: number
  ): Promise<SearchHistory> {
    // Mock implementation - create new search history entry
    const newHistory: SearchHistory = {
      id: `sh-${Date.now()}`,
      userId,
      query,
      timestamp: new Date().toISOString(),
      resultCount
    };

    // In a real implementation, this would save to database
    mockSearchHistory.unshift(newHistory);
    
    // Keep only last 50 searches per user
    const userHistories = mockSearchHistory.filter(h => h.userId === userId);
    if (userHistories.length > 50) {
      const toRemove = userHistories.slice(50);
      toRemove.forEach(history => {
        const index = mockSearchHistory.findIndex(h => h.id === history.id);
        if (index > -1) {
          mockSearchHistory.splice(index, 1);
        }
      });
    }

    return newHistory;
  }

  // Clear search history for a user
  static async clearSearchHistory(userId: string): Promise<void> {
    // Mock implementation - remove all history for user
    for (let i = mockSearchHistory.length - 1; i >= 0; i--) {
      if (mockSearchHistory[i].userId === userId) {
        mockSearchHistory.splice(i, 1);
      }
    }
  }

  // Get saved searches for a user
  static async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    // Mock implementation - filter by userId and sort by updated date
    return mockSavedSearches
      .filter(search => search.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Save a search
  static async saveSearch(
    userId: string,
    name: string,
    query: string,
    filters?: ProductFilters
  ): Promise<SavedSearch> {
    // Mock implementation - create new saved search
    const newSavedSearch: SavedSearch = {
      id: `ss-${Date.now()}`,
      userId,
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, this would save to database
    mockSavedSearches.unshift(newSavedSearch);

    return newSavedSearch;
  }

  // Update a saved search
  static async updateSavedSearch(
    id: string,
    name: string,
    query: string,
    filters?: ProductFilters
  ): Promise<SavedSearch | null> {
    // Mock implementation - find and update saved search
    const savedSearch = mockSavedSearches.find(s => s.id === id);
    if (!savedSearch) {
      return null;
    }

    savedSearch.name = name;
    savedSearch.query = query;
    savedSearch.filters = filters;
    savedSearch.updatedAt = new Date().toISOString();

    return savedSearch;
  }

  // Delete a saved search
  static async deleteSavedSearch(id: string): Promise<boolean> {
    // Mock implementation - remove saved search
    const index = mockSavedSearches.findIndex(s => s.id === id);
    if (index > -1) {
      mockSavedSearches.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get popular search terms for suggestions
  static async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    // Mock implementation - return popular terms
    const { popularSearchTerms } = await import('@/lib/data/mock-products');
    return popularSearchTerms.slice(0, limit);
  }

  // Get search suggestions based on query
  static async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const { popularSearchTerms } = await import('@/lib/data/mock-products');
    
    if (!query.trim()) {
      return popularSearchTerms.slice(0, limit);
    }

    const lowerQuery = query.toLowerCase();
    
    // Filter popular terms that match the query
    const matchingTerms = popularSearchTerms.filter(term =>
      term.toLowerCase().includes(lowerQuery)
    );

    // If we don't have enough matches, add some popular terms
    if (matchingTerms.length < limit) {
      const additionalTerms = popularSearchTerms
        .filter(term => !matchingTerms.includes(term))
        .slice(0, limit - matchingTerms.length);
      
      return [...matchingTerms, ...additionalTerms].slice(0, limit);
    }

    return matchingTerms.slice(0, limit);
  }
}