import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Exchanges | Prayan Jewels',
  description: 'Return and Exchange Policy for Prayan Jewels - Learn about our return process and exchange options.',
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto container-mobile py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Return & Exchanges</h1>
        
        <div className="max-w-none">
          <p className="text-lg text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Exchange, Return and Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Making a purchase indicates that you have acknowledged, understood, and agree to adhere to the following terms and conditions. We are committed to make your shopping experience as fuss-free and enjoyable as much as possible! Please read through the following terms & conditions prior to making a purchase.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We offer seamless exchanges and returns in case you don't like the product. A return request must be made by call/WhatsApp on <strong>+91 9426674994</strong> within <strong>5 DAYS of DELIVERY</strong> of the order. The customer will be issued a replacement/refund/store credit as per preference once the returned goods are received and verified at the Prayan Jewels warehouse.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Process</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For prepaid orders, the refund would be in the source of payment and for COD orders, it would ONLY be in the bank account of the individual whose name is there in the billing details.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important:</strong> Kindly note that only the amount of product is eligible for refund. Other fees like gift wrap charges, shipping charges, cash on delivery charges, custom duty etc are non-refundable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Product Photography Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The units have been photographed under lights and the actual product may differ slightly when seen under normal lights, though we maintain the originality in the photographs to utmost extent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Timeline</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We generally deliver all our products within 6-8 business days of placing the order. The dispatch time goes higher in cases where the customization is required by the customer or the product is to be made on order. Such cases will be intimated to the customer in advance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cancellations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If unfortunately you have to cancel an order, please do so within 6 hours of placing the order by contacting us at <strong>support@prayanjewels.in</strong>. We appreciate if you inform us as soon as possible in case you do not want an order, so that we do not dispatch the order and save on the courier cost and the effort.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Before Dispatch</h3>
              <p className="text-gray-700 leading-relaxed">
                If you cancel your order before your product has been dispatched, we will credit the full amount (in case of pre-paid order) in the original mode of payment.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">After Dispatch</h3>
              <p className="text-gray-700 leading-relaxed">
                If you cancel your order after your product has been dispatched, we will refund the amount minus shipping charges (in case of pre-paid order) for both Forward and RTO. Also, the charges will be refunded in original payment mode once we have received the product.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              The customer agrees not to dispute the decision made by Prayan Jewels and accept Prayan Jewels' decision regarding the cancellation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Damaged or Wrong Product</h2>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
              <p className="text-red-800 leading-relaxed mb-4">
                <strong>Important:</strong> In case you have received a damaged product or wrong product, please intimate to Prayan Jewels within <strong>3 days</strong> of receiving the order.
              </p>
              <p className="text-red-800 leading-relaxed">
                Please email us at <strong>support@prayanjewels.in</strong> or WhatsApp at <strong>+91 9426674994</strong>. PLEASE DO NOT FORGET TO MENTION YOUR ORDER ID.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Taxes and Duties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Taxes and duties are included in the price of the product listed on the Website, for deliveries in India.
            </p>
            {/* <p className="text-gray-700 leading-relaxed mb-4">
              For deliveries outside India, customs duties and local taxes, if applicable, have to be paid by customers to our shipping partner at the time of shipment delivery. The amount of duties and taxes depend on the policies of your destination country.
            </p> */}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Return Process Steps</h2>
            <ol className="list-decimal pl-6 text-gray-700 space-y-3 mb-4">
              <li>Contact us within 5 days of delivery via call or WhatsApp at +91 9426674994</li>
              <li>Provide your order ID and reason for return</li>
              <li>Receive return authorization and instructions</li>
              <li>Pack the item securely in original packaging</li>
              <li>Ship the item using provided return method</li>
              <li>Receive confirmation once item is received and verified</li>
              <li>Get your refund/replacement/store credit as requested</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For returns, exchanges, or any queries, please contact us:
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