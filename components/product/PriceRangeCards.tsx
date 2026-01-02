'use client';

import Link from 'next/link';

interface PriceRange {
  maxPrice: number;
  title: string;
  catchPhrase: string;
  gradient: string;
  textColor: string;
  hoverGradient: string;
}

const priceRanges: PriceRange[] = [
  {
    maxPrice: 1099,
    title: "Under ₹1,099",
    catchPhrase: "Everyday Elegance",
    gradient: "bg-gradient-to-br from-amber-100 via-amber-150 to-orange-200",
    textColor: "text-amber-900",
    hoverGradient: "hover:from-amber-150 hover:via-amber-200 hover:to-orange-250"
  },
  {
    maxPrice: 1999,
    title: "Under ₹1,999",
    catchPhrase: "Classic Beauty",
    gradient: "bg-gradient-to-br from-orange-100 via-orange-150 to-pink-200",
    textColor: "text-orange-900",
    hoverGradient: "hover:from-orange-150 hover:via-orange-200 hover:to-pink-250"
  },
  {
    maxPrice: 2999,
    title: "Under ₹2,999",
    catchPhrase: "Premium Style",
    gradient: "bg-gradient-to-br from-pink-100 via-pink-150 to-rose-200",
    textColor: "text-pink-900",
    hoverGradient: "hover:from-pink-150 hover:via-pink-200 hover:to-rose-250"
  },
  {
    maxPrice: 3999,
    title: "Under ₹3,999",
    catchPhrase: "Luxury Collection",
    gradient: "bg-gradient-to-br from-rose-100 via-rose-150 to-pink-300",
    textColor: "text-rose-900",
    hoverGradient: "hover:from-rose-150 hover:via-rose-200 hover:to-pink-350"
  }
];

export default function PriceRangeCards() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-4 tracking-wide">
            Shop by Price Range
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Find the perfect mangalsutra that fits your budget and style
          </p>
        </div>

        {/* Price Range Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {priceRanges.map((range, index) => (
            <Link
              key={index}
              href={`/products?maxPrice=${range.maxPrice}`}
              className="group block"
            >
              <div className={`
                relative overflow-hidden rounded-2xl p-6 sm:p-8 h-56 sm:h-64 lg:h-72
                ${range.gradient} ${range.hoverGradient}
                transform transition-all duration-300 ease-out
                hover:scale-101 hover:shadow-lg hover:shadow-amber-200/15
                focus:outline-none focus:ring-4 focus:ring-amber-200 focus:ring-opacity-50
                border border-white/20
              `}>
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 sm:w-16 sm:h-16 bg-white/15 rounded-full blur-lg"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 bg-white/5 rounded-full blur-3xl"></div>
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 className={`
                      text-xl sm:text-2xl lg:text-3xl font-bold ${range.textColor} mb-3
                      transition-transform duration-300
                      drop-shadow-sm
                    `}>
                      {range.title}
                    </h3>
                    <p className={`
                      text-base sm:text-lg lg:text-xl ${range.textColor} font-bold
                      transition-all duration-300
                      drop-shadow-lg
                    `}>
                      {range.catchPhrase}
                    </p>
                  </div>
                  
                  {/* Call to Action */}
                  <div className="flex items-center justify-between">
                    <div className={`
                      bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/40
                      group-hover:bg-white/35 transition-all duration-300
                    `}>
                      <span className={`
                        text-sm sm:text-base ${range.textColor} font-bold uppercase tracking-wider
                        drop-shadow-sm
                      `}>
                        Shop Now
                      </span>
                    </div>
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/40 flex items-center justify-center
                      group-hover:bg-white/45 group-hover:scale-102 transition-all duration-300
                      backdrop-blur-sm border border-white/30 shadow-lg
                    `}>
                      <svg 
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${range.textColor} group-hover:translate-x-1 transition-transform duration-300 font-bold`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-wider border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-lg group"
          >
            View All Products
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}