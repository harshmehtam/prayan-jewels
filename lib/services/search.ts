// Search service for managing search history and saved searches
import type { SearchHistory, SavedSearch, ProductFilters } from '@/types';
import { ProductService } from '@/lib/services/product-service';

// In-memory storage for search history and saved searches
// In a production app, these would be stored in Amplify DataStore or a database
const searchHistoryStore: SearchHistory[] = [];
const savedSearchesStore: SavedSearch[] = [];

// Popular search terms based on common jewelry searches
const popularSearchTerms = [
  'mangalsutra',
  'traditional',
  'modern',
  'designer',
  'silver',
  'wedding',
  'festival',
  'daily wear',
  'elegant',
  'minimalist',
  'luxury',
  'premium',
  'lightweight',
  'heavy',
  'chain',
  'pendant',
  'beads',
  'oxidized',
  'antique',
  'contemporary'
];

export class SearchService {
  // Get search history for a user
  static async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    try {
      // Filter by userId and sort by timestamp
      return searchHistoryStore
        .filter((history: SearchHistory) => history.userId === userId)
        .sort((a: SearchHistory, b: SearchHistory) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  // Add a search to history
  static async addToSearchHistory(
    userId: string, 
    query: string, 
    resultCount: number
  ): Promise<SearchHistory> {
    try {
      // Create new search history entry
      const newHistory: SearchHistory = {
        id: `sh-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        userId,
        query,
        timestamp: new Date().toISOString(),
        resultCount
      };

      // Add to store
      searchHistoryStore.unshift(newHistory);
      
      // Keep only last 50 searches per user
      const userHistories = searchHistoryStore.filter((h: SearchHistory) => h.userId === userId);
      if (userHistories.length > 50) {
        const toRemove = userHistories.slice(50);
        toRemove.forEach((history: SearchHistory) => {
          const index = searchHistoryStore.findIndex((h: SearchHistory) => h.id === history.id);
          if (index > -1) {
            searchHistoryStore.splice(index, 1);
          }
        });
      }

      return newHistory;
    } catch (error) {
      console.error('Error adding to search history:', error);
      throw error;
    }
  }

  // Clear search history for a user
  static async clearSearchHistory(userId: string): Promise<void> {
    try {
      // Remove all history for user
      for (let i = searchHistoryStore.length - 1; i >= 0; i--) {
        if (searchHistoryStore[i].userId === userId) {
          searchHistoryStore.splice(i, 1);
        }
      }
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }

  // Get saved searches for a user
  static async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      // Filter by userId and sort by updated date
      return savedSearchesStore
        .filter((search: SavedSearch) => search.userId === userId)
        .sort((a: SavedSearch, b: SavedSearch) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  }

  // Save a search
  static async saveSearch(
    userId: string,
    name: string,
    query: string,
    filters?: ProductFilters
  ): Promise<SavedSearch> {
    try {
      // Create new saved search
      const newSavedSearch: SavedSearch = {
        id: `ss-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        userId,
        name,
        query,
        filters,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to store
      savedSearchesStore.unshift(newSavedSearch);

      return newSavedSearch;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  // Update a saved search
  static async updateSavedSearch(
    id: string,
    name: string,
    query: string,
    filters?: ProductFilters
  ): Promise<SavedSearch | null> {
    try {
      // Find and update saved search
      const savedSearch = savedSearchesStore.find((s: SavedSearch) => s.id === id);
      if (!savedSearch) {
        return null;
      }

      savedSearch.name = name;
      savedSearch.query = query;
      savedSearch.filters = filters;
      savedSearch.updatedAt = new Date().toISOString();

      return savedSearch;
    } catch (error) {
      console.error('Error updating saved search:', error);
      throw error;
    }
  }

  // Delete a saved search
  static async deleteSavedSearch(id: string): Promise<boolean> {
    try {
      // Remove saved search
      const index = savedSearchesStore.findIndex((s: SavedSearch) => s.id === id);
      if (index > -1) {
        savedSearchesStore.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      return false;
    }
  }

  // Get popular search terms for suggestions
  static async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    try {
      return popularSearchTerms.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular search terms:', error);
      return [];
    }
  }

  // Get search suggestions based on query
  static async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      if (!query.trim()) {
        return popularSearchTerms.slice(0, limit);
      }

      const lowerQuery = query.toLowerCase();
      
      // Filter popular terms that match the query
      const matchingTerms = popularSearchTerms.filter((term: string) =>
        term.toLowerCase().includes(lowerQuery)
      );

      // If we don't have enough matches, add some popular terms
      if (matchingTerms.length < limit) {
        const additionalTerms = popularSearchTerms
          .filter((term: string) => !matchingTerms.includes(term))
          .slice(0, limit - matchingTerms.length);
        
        return [...matchingTerms, ...additionalTerms].slice(0, limit);
      }

      return matchingTerms.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Perform actual product search using ProductService
  static async searchProducts(
    query: string, 
    filters?: ProductFilters, 
    limit?: number,
    userId?: string
  ) {
    try {
      // Use ProductService to perform the actual search
      const result = await ProductService.getProducts({ searchQuery: query, ...filters }, limit);
      
      // Add to search history if user is provided
      if (userId && query.trim()) {
        await this.addToSearchHistory(userId, query, result.totalCount);
      }

      return result;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Execute a saved search
  static async executeSavedSearch(savedSearchId: string, userId?: string) {
    try {
      const savedSearch = savedSearchesStore.find((s: SavedSearch) => s.id === savedSearchId);
      if (!savedSearch) {
        throw new Error('Saved search not found');
      }

      // Execute the search using the saved query and filters
      return await this.searchProducts(
        savedSearch.query, 
        savedSearch.filters, 
        undefined, 
        userId
      );
    } catch (error) {
      console.error('Error executing saved search:', error);
      throw error;
    }
  }

  // Get trending searches based on recent search history
  static async getTrendingSearches(limit: number = 5): Promise<string[]> {
    try {
      // Get recent searches from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentSearches = searchHistoryStore.filter((history: SearchHistory) => 
        new Date(history.timestamp) > sevenDaysAgo
      );

      // Count frequency of each query
      const queryCount: { [key: string]: number } = {};
      recentSearches.forEach((history: SearchHistory) => {
        const query = history.query.toLowerCase().trim();
        if (query) {
          queryCount[query] = (queryCount[query] || 0) + 1;
        }
      });

      // Sort by frequency and return top queries
      return Object.entries(queryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([query]) => query);
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }
}