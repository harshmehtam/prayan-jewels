import { WHY_CHOOSE_US_FEATURES, type Feature } from '@/lib/constants/features';

export default function WhyChooseUs() {
  return (
    <div className="mb-6 md:mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Why Choose Us</h3>
      <div className="grid grid-cols-2 gap-6">
        {WHY_CHOOSE_US_FEATURES.map((feature: Feature, index: number) => (
          <div key={index} className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {feature.icon}
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{feature.title}</p>
              <p className="text-gray-600">{feature.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
