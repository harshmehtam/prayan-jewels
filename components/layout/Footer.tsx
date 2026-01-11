import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 text-gray-800 border-t border-gray-200">
      <div className="container mx-auto container-mobile py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* About Us */}
          <div className="lg:col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-6 text-gray-900">About Us</h4>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Discover our exquisite collection of traditional and modern silver mangalsutra designs.
              Crafted with precision and love, each piece tells a story of elegance and tradition.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-6 text-gray-900">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  All Products
                </Link>
              </li>
              {/* <li>
                <Link href="/products?category=traditional" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Traditional Designs
                </Link>
              </li>
              <li>
                <Link href="/products?category=modern" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Modern Designs
                </Link>
              </li> */}
              <li>
                <Link href="/track-order" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="lg:col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-6 text-gray-900">Contact Us</h4>
            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <p className="font-medium text-gray-900">Prayan Jewels</p>
                <p className="text-gray-600 leading-relaxed mt-1">
                  B, Sparsh, Malik Sheri, Surat 395002, Gujarat, India
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> support@prayanjewels.in
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Tel:</span> +91 9426674994
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">WhatsApp:</span> +91 9426674994
                </p>
              </div>
              
              <p className="text-gray-600">
                <span className="font-medium">Working Hours:</span> Mon to Sat from 10:00 AM to 7:30 PM
              </p>
            </div>
          </div>

          {/* Customer Service */}
          <div className="lg:col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-6 text-gray-900">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Terms Of Use
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Return & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base focus-ring rounded-md px-1 py-1">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-12 pt-8 sm:pt-10 flex flex-col sm:flex-row justify-end items-center space-y-4 sm:space-y-0">
          {/* <div className="flex flex-wrap justify-center sm:justify-start space-x-4 sm:space-x-6">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors focus-ring rounded-md px-1 py-1">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors focus-ring rounded-md px-1 py-1">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors focus-ring rounded-md px-1 py-1">
              Cookie Policy
            </Link>
          </div> */}
          <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-right">
            © {currentYear} Prayan Jewels. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}