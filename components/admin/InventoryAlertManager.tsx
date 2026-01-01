// Inventory alert management and notification system
'use client';

import React, { useState, useEffect } from 'react';
import { InventoryAlert } from '@/types';
import { InventoryService } from '@/lib/data/inventory';
import { AdminProductService } from '@/lib/services/admin-products';
import { LoadingSpinner } from '@/components/ui';

interface InventoryAlertManagerProps {
  onClose: () => void;
}

interface AlertSettings {
  lowStockThreshold: number;
  outOfStockEnabled: boolean;
  lowStockEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  recipients: string[];
}

interface AlertRule {
  id: string;
  productId?: string;
  category?: string;
  threshold: number;
  enabled: boolean;
  notificationMethods: ('email' | 'sms' | 'dashboard')[];
}

export default function InventoryAlertManager({ onClose }: InventoryAlertManagerProps) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    lowStockThreshold: 5,
    outOfStockEnabled: true,
    lowStockEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    notificationFrequency: 'immediate',
    recipients: []
  });
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings' | 'rules'>('alerts');
  const [newRecipient, setNewRecipient] = useState('');
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    threshold: 5,
    enabled: true,
    notificationMethods: ['email', 'dashboard']
  });

  // Load current alerts and settings
  const loadAlertsAndSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get low stock items
      const lowStockResult = await InventoryService.getLowStockItems();
      
      // Get all products to generate alerts
      const productsResult = await AdminProductService.getProducts({}, 1000);
      const inventoryAlerts: InventoryAlert[] = [];

      for (const product of productsResult.products) {
        try {
          const inventoryResult = await InventoryService.getProductInventory(product.id);
          if (inventoryResult.inventory) {
            const available = inventoryResult.inventory.availableQuantity || 0;
            const reorderPoint = inventoryResult.inventory.reorderPoint || 5;
            
            if (available === 0 || available <= reorderPoint) {
              inventoryAlerts.push({
                productId: product.id,
                productName: product.name,
                currentStock: available,
                reorderPoint,
                alertType: available === 0 ? 'out_of_stock' : 'low_stock'
              });
            }
          }
        } catch (err) {
          console.warn(`Failed to check inventory for product ${product.id}:`, err);
        }
      }

      setAlerts(inventoryAlerts);

      // Load saved settings (in a real app, this would come from a database)
      const savedSettings = localStorage.getItem('inventory-alert-settings');
      if (savedSettings) {
        setAlertSettings(JSON.parse(savedSettings));
      }

      // Load alert rules (in a real app, this would come from a database)
      const savedRules = localStorage.getItem('inventory-alert-rules');
      if (savedRules) {
        setAlertRules(JSON.parse(savedRules));
      } else {
        // Default rules
        setAlertRules([
          {
            id: 'default-low-stock',
            threshold: 5,
            enabled: true,
            notificationMethods: ['email', 'dashboard']
          },
          {
            id: 'default-out-of-stock',
            threshold: 0,
            enabled: true,
            notificationMethods: ['email', 'sms', 'dashboard']
          }
        ]);
      }
    } catch (err) {
      console.error('Error loading alerts and settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts and settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsAndSettings();
  }, []);

  // Save alert settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real app, this would save to a database
      localStorage.setItem('inventory-alert-settings', JSON.stringify(alertSettings));
      localStorage.setItem('inventory-alert-rules', JSON.stringify(alertRules));

      // Here you would also update the backend notification system
      // await AdminInventoryService.updateAlertSettings(alertSettings);
      // await AdminInventoryService.updateAlertRules(alertRules);

      alert('Alert settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Add new recipient
  const addRecipient = () => {
    if (newRecipient.trim() && !alertSettings.recipients.includes(newRecipient.trim())) {
      setAlertSettings(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient.trim()]
      }));
      setNewRecipient('');
    }
  };

  // Remove recipient
  const removeRecipient = (email: string) => {
    setAlertSettings(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  // Add new alert rule
  const addAlertRule = () => {
    if (newRule.threshold !== undefined) {
      const rule: AlertRule = {
        id: `rule-${Date.now()}`,
        threshold: newRule.threshold,
        enabled: newRule.enabled || true,
        notificationMethods: newRule.notificationMethods || ['email', 'dashboard'],
        productId: newRule.productId,
        category: newRule.category
      };
      
      setAlertRules(prev => [...prev, rule]);
      setNewRule({
        threshold: 5,
        enabled: true,
        notificationMethods: ['email', 'dashboard']
      });
    }
  };

  // Remove alert rule
  const removeAlertRule = (ruleId: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  // Toggle alert rule
  const toggleAlertRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // Dismiss alert
  const dismissAlert = (productId: string) => {
    setAlerts(prev => prev.filter(alert => alert.productId !== productId));
  };

  // Test notifications
  const testNotifications = async () => {
    try {
      setError(null);
      // In a real app, this would send test notifications
      alert('Test notifications sent! (This is a demo - no actual notifications were sent)');
    } catch (err) {
      setError('Failed to send test notifications');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Inventory Alert Management</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'alerts', name: 'Current Alerts', count: alerts.length },
              { id: 'settings', name: 'Alert Settings' },
              { id: 'rules', name: 'Alert Rules', count: alertRules.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className={`${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  } inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Current Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-900">Active Inventory Alerts</h4>
                  <button
                    onClick={loadAlertsAndSettings}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Refresh Alerts
                  </button>
                </div>
                
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No active alerts</h3>
                    <p className="mt-1 text-sm text-gray-500">All inventory levels are within normal ranges.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        alert.alertType === 'out_of_stock' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              alert.alertType === 'out_of_stock' 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {alert.alertType === 'out_of_stock' ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${
                                alert.alertType === 'out_of_stock' ? 'text-red-800' : 'text-yellow-800'
                              }`}>
                                {alert.productName}
                              </p>
                              <p className={`text-xs ${
                                alert.alertType === 'out_of_stock' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {alert.alertType === 'out_of_stock' 
                                  ? 'Out of stock' 
                                  : `Low stock: ${alert.currentStock} remaining (reorder at ${alert.reorderPoint})`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => dismissAlert(alert.productId)}
                              className={`text-xs px-3 py-1 rounded ${
                                alert.alertType === 'out_of_stock' 
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-yellow-600 hover:text-yellow-800'
                              }`}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alert Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Alert Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-md font-medium text-gray-900">General Settings</h5>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={alertSettings.lowStockThreshold}
                        onChange={(e) => setAlertSettings(prev => ({
                          ...prev,
                          lowStockThreshold: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notification Frequency
                      </label>
                      <select
                        value={alertSettings.notificationFrequency}
                        onChange={(e) => setAlertSettings(prev => ({
                          ...prev,
                          notificationFrequency: e.target.value as any
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily Summary</option>
                        <option value="weekly">Weekly Summary</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="outOfStockEnabled"
                          checked={alertSettings.outOfStockEnabled}
                          onChange={(e) => setAlertSettings(prev => ({
                            ...prev,
                            outOfStockEnabled: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="outOfStockEnabled" className="ml-2 text-sm text-gray-700">
                          Enable out-of-stock alerts
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="lowStockEnabled"
                          checked={alertSettings.lowStockEnabled}
                          onChange={(e) => setAlertSettings(prev => ({
                            ...prev,
                            lowStockEnabled: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="lowStockEnabled" className="ml-2 text-sm text-gray-700">
                          Enable low stock alerts
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          checked={alertSettings.emailNotifications}
                          onChange={(e) => setAlertSettings(prev => ({
                            ...prev,
                            emailNotifications: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                          Enable email notifications
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="smsNotifications"
                          checked={alertSettings.smsNotifications}
                          onChange={(e) => setAlertSettings(prev => ({
                            ...prev,
                            smsNotifications: e.target.checked
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="smsNotifications" className="ml-2 text-sm text-gray-700">
                          Enable SMS notifications
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-md font-medium text-gray-900">Notification Recipients</h5>
                    
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={addRecipient}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {alertSettings.recipients.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            onClick={() => removeRecipient(email)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={testNotifications}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Test Notifications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-900">Alert Rules</h4>
                </div>

                {/* Add New Rule */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-md font-medium text-gray-900 mb-4">Add New Rule</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Threshold</label>
                      <input
                        type="number"
                        min="0"
                        value={newRule.threshold || 0}
                        onChange={(e) => setNewRule(prev => ({
                          ...prev,
                          threshold: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                      <select
                        value={newRule.category || ''}
                        onChange={(e) => setNewRule(prev => ({
                          ...prev,
                          category: e.target.value || undefined
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Categories</option>
                        <option value="traditional">Traditional</option>
                        <option value="modern">Modern</option>
                        <option value="designer">Designer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
                      <div className="flex items-center space-x-2 text-xs">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRule.notificationMethods?.includes('email') || false}
                            onChange={(e) => {
                              const methods = newRule.notificationMethods || [];
                              if (e.target.checked) {
                                setNewRule(prev => ({
                                  ...prev,
                                  notificationMethods: [...methods.filter(m => m !== 'email'), 'email']
                                }));
                              } else {
                                setNewRule(prev => ({
                                  ...prev,
                                  notificationMethods: methods.filter(m => m !== 'email')
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-1">Email</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRule.notificationMethods?.includes('dashboard') || false}
                            onChange={(e) => {
                              const methods = newRule.notificationMethods || [];
                              if (e.target.checked) {
                                setNewRule(prev => ({
                                  ...prev,
                                  notificationMethods: [...methods.filter(m => m !== 'dashboard'), 'dashboard']
                                }));
                              } else {
                                setNewRule(prev => ({
                                  ...prev,
                                  notificationMethods: methods.filter(m => m !== 'dashboard')
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-1">Dashboard</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addAlertRule}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Rules */}
                <div className="space-y-3">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleAlertRule(rule.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Alert when stock ≤ {rule.threshold}
                            {rule.category && ` (${rule.category} products)`}
                            {rule.productId && ` (specific product)`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Notifications: {rule.notificationMethods.join(', ')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAlertRule(rule.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && <LoadingSpinner size="sm" />}
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}