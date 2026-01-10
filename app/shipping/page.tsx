import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment & Shipping Policy | Prayan Jewels',
  description: 'Payment and Shipping Policy for Prayan Jewels - Learn about our payment methods and shipping options.',
};

export default function ShippingPage() {
  return (
    <div className="container mx-auto container-mobile py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Payment & Shipping Policy</h1>
        
        <div className="max-w-none">
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payments</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The payments on Prayan Jewels can be made using one of the following options:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              {/* <li>Paytm</li> */}
              {/* <li>Direct bank transfers</li> */}
              <li>Card Payment (Credit/Debit Cards)</li>
              <li>UPI (Google Pay, PhonePe, etc.)</li>
              <li>Cash on Delivery (COD)</li>
              {/* <li>PayPal</li> */}
            </ul>
            {/* <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
              <p className="text-yellow-800 leading-relaxed mb-2">
                <strong>Important Payment Notes:</strong>
              </p>
              <ul className="list-disc pl-6 text-yellow-800 space-y-1">
                <li>COD will be chargeable at ₹80/- extra (Cash handling charges)</li>
                <li>PayPal will be 10% extra over and above the total order amount</li>
                <li>Kindly mention your contact number as comment in the account transfers for us to trace the payment and confirm your order</li>
              </ul>
            </div> */}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Domestic Shipping Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Thank you for visiting and shopping at Prayan Jewels. Following are the terms and conditions that constitute our Shipping Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipment Processing Time</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All orders are processed within <strong>1-2 business days</strong> except for the customised orders or pre-orders or as communicated during the order placement. Orders may not be shipped or delivered on weekends or holidays.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Rates & Delivery Estimates</h2>
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
              <p className="text-green-800 leading-relaxed mb-2">
                <strong>Free Shipping Pan India!</strong>
              </p>
              <p className="text-green-800 leading-relaxed">
                We offer free shipping across India for all orders.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              In most cases delivery to over 95% pincodes occur within <strong>6-7 business days</strong>, but this may get delayed due to unforeseen circumstances. In such cases, we will try to resolve the issue as soon as possible and in case we are not able to deliver this within 45 days, we will issue a refund for your order.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cash on Delivery will be available for most of the pincodes at an additional charge of <strong>₹80/-</strong> per shipment. However, there will be no COD for customised orders.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Logistics Partners</h2>
            {/* <p className="text-gray-700 leading-relaxed mb-4">
              We have tie-up with all leading logistics partners:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Delhivery</li>
              <li>DTDC</li>
              <li>FedEx</li>
              <li>Blue Dart</li>
              <li>Aramex</li>
            </ul> */}
            <p className="text-gray-700 leading-relaxed mb-4">
              The carrier is chosen basis the availability, pricing and serviceability in the required pincode. For remote locations not covered by private couriers or locations with certain restrictions, we use Indian Postal Services (for domestic shipments).
            </p>
          </section>

          {/* <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Shipping</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For International shipments, the shipping will be chargeable and rates vary depending on the country (generally between ₹900 to ₹3000). The respective rates will be communicated while placing order for the same.
            </p>
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
              <p className="text-blue-800 leading-relaxed">
                <strong>International Orders:</strong> Please contact support at <strong>+91 9426674994</strong> before placing orders to be delivered on international addresses.
              </p>
            </div>
          </section> */}

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipment Confirmation & Order Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). It may take upto 10-12 business days in extreme cases to be able to ship the consignment (usually we ship it out in 1-3 days of receiving the order).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The tracking number will be active within 24 hours. Usual transit & delivery times for overseas shipments range from 15-25 business days from the date of shipping, varying from country to country and may extend even further in case the recipient is not available/contactable during delivery.
            </p>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
              <p className="text-red-800 leading-relaxed">
                <strong>Important:</strong> Any orders returned due to non claim or recipient not available during delivery or recipient refusing to accept the delivery will absolve Prayan Jewels of its liability and the customer would not be eligible for any refund.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Any issues with delivery has to be brought to Prayan Jewels' attention via email and the team will try to resolve the issue in the best possible manner.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Customs, Duties and Taxes</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All domestic orders are tax paid and no additional tax is to be paid by the customer.
            </p>
            {/* <p className="text-gray-700 leading-relaxed mb-4">
              However, for International orders, Prayan Jewels will not be responsible for any customs and taxes applied to your order. All fees imposed during or after shipping is the responsibility of the customer (import duties, brokerages, tariffs, taxes, etc.).
            </p> */}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Guidelines</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For successful delivery:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Ensure someone is available to receive the package</li>
              <li>Provide accurate and complete delivery address</li>
              <li>Include landmark details for easy location</li>
              <li>Keep your phone accessible for delivery updates</li>
              <li>Verify the package before accepting delivery</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Damages</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Please refer to our <a href="/returns" className="text-blue-600 hover:text-blue-800 underline">Return & Exchange Policy</a> for information regarding damaged items.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For payment or shipping queries, contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Prayan Jewels Customer Service</p>
              <p className="text-gray-700 mb-2">B, Sparsh, Malik Sheri, Surat 395002, Gujarat, India</p>
              <p className="text-gray-700 mb-2">Email: support@prayanjewels.in</p>
              <p className="text-gray-700 mb-2">Phone: +91 9426674994</p>
              <p className="text-gray-700 mb-2">WhatsApp: +91 9426674994</p>
              <p className="text-gray-700">Working Hours: Mon to Sat, 10:00 AM to 7:30 PM</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}