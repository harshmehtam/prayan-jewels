'use client';

import { useState } from 'react';

interface CustomerSupportProps {
  orderId?: string;
  className?: string;
}

export default function CustomerSupport({ orderId, className = '' }: CustomerSupportProps) {
  const [showContactModal, setShowContactModal] = useState(false);

  const supportChannels = [
    {
      name: 'Phone Support',
      value: '+91 98765 43210',
      description: 'Available Mon-Sat, 9 AM - 7 PM IST',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      action: () => window.open('tel:+919876543210')
    },
    {
      name: 'Email Support',
      value: 'support@silvermangalsutra.com',
      description: 'We respond within 24 hours',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => window.open(`mailto:support@silvermangalsutra.com${orderId ? `?subject=Order Support - ${orderId}` : ''}`)
    },
    {
      name: 'WhatsApp Support',
      value: '+91 98765 43210',
      description: 'Quick responses during business hours',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      action: () => window.open(`https://wa.me/919876543210${orderId ? `?text=Hi, I need help with my order ${orderId}` : ''}`)
    }
  ];

  return (
    <>
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Need Help?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Our customer support team is here to help you with any questions or concerns about your order.
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Customer Support
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {supportChannels.map((channel, index) => (
                  <div
                    key={index}
                    onClick={channel.action}
                    className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-shrink-0 text-blue-600 mt-1">
                      {channel.icon}
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {channel.name}
                      </h4>
                      <p className="text-sm text-blue-600 font-medium">
                        {channel.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {channel.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Frequently Asked Questions
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Order cancellation policy: 24 hours from order placement</li>
                  <li>• Refund processing time: 5-7 business days</li>
                  <li>• Shipping time: 3-7 business days within India</li>
                  <li>• Return policy: 30 days from delivery</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}