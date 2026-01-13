export default function WhyChooseUs() {
  const features = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      ),
      title: '92.5 Silver',
      subtitle: 'Premium quality'
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      ),
      title: 'BIS Hallmarked',
      subtitle: 'Certified quality'
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      ),
      title: '7-Day Return',
      subtitle: 'Easy returns'
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      ),
      title: 'Purity Certificate',
      subtitle: 'Authenticity guaranteed'
    }
  ];

  return (
    <div className="mb-6 md:mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Why Choose Us</h3>
      <div className="grid grid-cols-2 gap-6">
        {features.map((feature, index) => (
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
