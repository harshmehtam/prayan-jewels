'use client';

import Link from 'next/link';

interface PriceRange {
  maxPrice: number;
  title: string;
  catchPhrase: string;
  backgroundColor: string;
  textColor: string;
  hoverColor: string;
  accentColor: string;
}

const priceRanges: PriceRange[] = [
  {
    maxPrice: 1099,
    title: "Under ₹1,099",
    catchPhrase: "Everyday Elegance",
    backgroundColor: "bg-slate-100",
    textColor: "text-slate-800",
    hoverColor: "hover:bg-slate-200",
    accentColor: "bg-slate-600"
  },
  {
    maxPrice: 1999,
    title: "Under ₹1,999",
    catchPhrase: "Classic Beauty",
    backgroundColor: "bg-zinc-100",
    textColor: "text-zinc-800",
    hoverColor: "hover:bg-zinc-200",
    accentColor: "bg-zinc-600"
  },
  {
    maxPrice: 2999,
    title: "Under ₹2,999",
    catchPhrase: "Premium Style",
    backgroundColor: "bg-gray-100",
    textColor: "text-gray-800",
    hoverColor: "hover:bg-gray-200",
    accentColor: "bg-gray-600"
  },
  {
    maxPrice: 3999,
    title: "Under ₹3,999",
    catchPhrase: "Luxury Collection",
    backgroundColor: "bg-stone-100",
    textColor: "text-stone-800",
    hoverColor: "hover:bg-stone-200",
    accentColor: "bg-stone-600"
  }
];

export default function PriceRangeCards() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 pb-6 sm:pb-8 lg:pb-10">
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
                ${range.backgroundColor} ${range.hoverColor}
                transition-all duration-200 ease-out
                hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50
                border border-gray-200 hover:border-gray-300
              `}>
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 className={`
                      text-xl sm:text-2xl lg:text-3xl font-bold ${range.textColor} mb-3
                    `}>
                      {range.title}
                    </h3>
                    <p className={`
                      text-base sm:text-lg lg:text-xl ${range.textColor} font-medium opacity-80
                    `}>
                      {range.catchPhrase}
                    </p>
                  </div>
                  
                  {/* Call to Action */}
                  <div className="flex items-center justify-between">
                    <div className={`
                      bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200
                      group-hover:shadow transition-shadow duration-200
                    `}>
                      <span className={`
                        text-sm sm:text-base ${range.textColor} font-semibold uppercase tracking-wider
                      `}>
                        Shop Now
                      </span>
                    </div>
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full ${range.accentColor} flex items-center justify-center
                      transition-transform duration-200
                      shadow-sm
                    `}>
                      <svg 
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-0.5 transition-transform duration-200`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        {/* <div className="text-center mt-8 sm:mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-lg group"
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
        </div> */}
      </div>
    </section>
  );
}