'use client';

import { useState, useEffect, useCallback } from 'react';
import { WishlistNotificationService, type WishlistNotification } from '@/lib/services/wishlist-notifications';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';

interface WishlistNotificationsProps {
  className?: string;
}

export default function WishlistNotifications({ className = '' }: WishlistNotificationsProps) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<WishlistNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const allNotifications = await WishlistNotificationService.getAllNotifications();
      setNotifications(allNotifications.slice(0, 5)); // Show only latest 5
    } catch (error) {
      console.error('Error loading wishlist notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await WishlistNotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Load notifications on mount and periodically
  useEffect(() => {
    if (user?.userId) {
      loadNotifications();
      
      // Check for new notifications every 5 minutes
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.userId, loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('wishlist-notifications-dropdown');
      const button = document.getElementById('wishlist-notifications-button');
      
      if (dropdown && button && 
          !dropdown.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        id="wishlist-notifications-button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
        title="Wishlist Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div
          id="wishlist-notifications-dropdown"
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Wishlist Alerts</h3>
              {notifications.length > 0 && (
                <Link
                  href="/account/wishlist"
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => setShowDropdown(false)}
                >
                  View Wishlist
                </Link>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-gray-600 text-sm">No wishlist alerts</p>
                <p className="text-gray-500 text-xs mt-1">We'll notify you of price drops and stock updates</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      setShowDropdown(false);
                    }}
                  >
                    <Link href={`/products/${notification.productId}`}>
                      <div className="flex items-start space-x-3">
                        {/* Notification Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === 'price_drop' ? 'bg-green-100' :
                          notification.type === 'back_in_stock' ? 'bg-blue-100' :
                          'bg-purple-100'
                        }`}>
                          {notification.type === 'price_drop' && (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l10-10M7 7h8M7 7v8" />
                            </svg>
                          )}
                          {notification.type === 'back_in_stock' && (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {notification.type === 'special_offer' && (
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          )}
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/account/wishlist"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowDropdown(false)}
              >
                View All Wishlist Items
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}