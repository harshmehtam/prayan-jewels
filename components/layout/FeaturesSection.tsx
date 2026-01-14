import { FEATURES_SECTION_FEATURES, type Feature } from '@/lib/constants/features';

export default function FeaturesSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-4 tracking-wide">
            Why Choose Us
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Experience the finest quality and service with every purchase
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-6 max-w-7xl mx-auto">
          {FEATURES_SECTION_FEATURES.map((feature: Feature, index: number) => (
            <div
              key={index}
              className="group text-center p-4 sm:p-6 rounded-2xl bg-white border border-gray-200"
            >
              {/* Icon */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-700">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {feature.icon}
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}