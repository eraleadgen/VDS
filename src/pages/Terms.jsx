import { Link } from 'react-router-dom';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const SECTIONS = [
  {
    num: '1.',
    title: 'Services',
    content: 'We provide professional mobile detailing, ceramic coating, and paint correction services for vehicles, specializing in high-end and luxury automobiles. Our services are performed at your specified location (home, office, etc.) in the North Atlanta, Georgia area. We provide all necessary equipment, supplies, and insurance for our operations.',
  },
  {
    num: '2.',
    title: 'SMS Messaging Terms',
    content: 'By providing your phone number and opting in through our website forms, you consent to receive SMS messages from Valet Detailing Service LLC (VDS Mobile). These messages may include appointment confirmations, appointment reminders, service updates, customer support responses, and promotional offers or discounts. Message frequency may vary. You can opt out at any time by replying STOP. Reply HELP for assistance. Message and data rates may apply. Mobile carriers are not liable for delayed or undelivered messages. Users must be 18 years or older to opt into SMS messaging.',
  },
  {
    num: '3.',
    title: 'Booking and Appointments',
    content: "To secure our services, you must provide us with access to the vehicle and ensure there is adequate space for our team to work safely and efficiently around it. While you are not required to be present during the service, arrangements for key access must be made in advance.",
  },
  {
    num: '4.',
    title: 'Pricing and Payment',
    content: 'An estimate of the service duration, typically ranging from two to five hours, will be provided before your appointment begins. We accept payment via Cash, Zelle, Venmo, Cash App, and Debit/Credit Card via Invoice. Payment is due in full upon completion of the service, unless other arrangements have been explicitly agreed upon in writing beforehand.',
  },
  {
    num: '5.',
    title: 'Cancellation and Rescheduling Policy',
    content: 'We require at least 24 hours\' notice for any appointment cancellations or rescheduling requests. This policy allows us to manage our schedule and offer availability to other clients. Failure to provide sufficient notice may result in a cancellation fee.',
  },
  {
    num: '6.',
    title: 'Customer Responsibilities',
    content: 'Before the service begins, you are responsible for removing all personal belongings from the vehicle, particularly from the interior, trunk, and any compartments. While we will exercise the utmost care, Valet Detailing Service LLC is not responsible for any personal items that are lost, damaged, or stolen.',
  },
  {
    num: '7.',
    title: 'Limitation of Liability',
    content: 'We are fully insured and committed to providing the highest standard of care. However, VDS is not liable for pre-existing damage to the vehicle (whether visible or not), any damage that may occur to loose or fragile parts including aged or degraded plastic trim, emblems, or clear coat failure, or mechanical or electrical issues, as our services are strictly cosmetic. Any claim of damage caused by our service must be reported to us before our team leaves the premises.',
  },
  {
    num: '8.',
    title: 'Satisfaction Guarantee',
    content: 'Your satisfaction is our priority. Upon completion of the service, we encourage you to inspect our work. If you are not satisfied with any aspect of the service, please notify our on-site detailer immediately. We will make reasonable efforts to address and rectify the issue to your satisfaction before we depart.',
  },
  {
    num: '9.',
    title: 'Use of Photographic and Video Materials',
    content: 'We reserve the right to capture photographic or video content of your vehicle before, during, and after our services for training, quality control, and marketing purposes. These materials may be used on our website (vdsmobile.com), social media channels (Instagram, TikTok), and other promotional materials. No personally identifiable information will be associated with these images without your explicit consent.',
  },
  {
    num: '10.',
    title: 'VDS Gold Membership',
    content: 'VDS Gold is a recurring monthly membership program that provides enrolled vehicles with unlimited exterior details and one (1) full interior detail per month, each service including ceramic sealant protection. Membership is billed on a per-vehicle basis at a flat monthly rate of $250/month for Sedan/Coupe vehicles and $300/month for Truck/SUV vehicles, charged automatically via Stripe. Membership benefits are non-transferable and apply only to the specific enrolled vehicle(s).',
  },
  {
    num: '11.',
    title: 'VDS Gold Cancellation & Refund Policy',
    content: 'Members may cancel their VDS Gold subscription at any time from the Member Dashboard. A full refund will be issued only if: (1) the cancellation request is submitted within 48 hours of the initial subscription start date, AND (2) no VDS Gold membership services (exterior detail or interior detail) have been redeemed or scheduled during that period. If either condition is not met — the 48-hour window has passed, or any Gold service has been used — no refund will be issued and membership benefits will continue through the end of the current billing period. Approved refunds will be processed within 3–5 business days and returned to the original payment method. Cancellations after the refund window will take effect at the end of the active billing cycle. Valet Detailing Service LLC reserves the right to revoke membership access in cases of abuse or violation of these terms.',
  },
  {
    num: '12.',
    title: 'Governing Law',
    content: 'These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of Georgia.',
  },
  {
    num: '13.',
    title: 'Changes to Terms',
    content: 'Valet Detailing Service LLC reserves the right to modify these Terms and Conditions at any time. The most current version will always be posted on our website. Your continued use of our services after any changes constitutes your acceptance of the new terms.',
  },
  {
    num: '14.',
    title: 'Contact Us',
    content: 'If you have any questions about these Terms and Conditions, please contact us through the official channels listed on our website at vdsmobile.com or via email at Valetdetailingservice@gmail.com.',
  },
];

export default function Terms() {
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-36 pb-20 max-w-4xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">LEGAL</p>
        <h1 className="text-5xl font-grotesk font-bold text-vapor mb-3">TERMS & CONDITIONS</h1>
        <p className="text-xs font-mono-tech text-vapor/30 mb-16 tracking-widest">VALET DETAILING SERVICE LLC · LAST UPDATED: JUNE 17, 2026</p>

        <div className="space-y-10">
          {SECTIONS.map(sec => (
            <div key={sec.title} className="border-l border-gold/20 pl-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono-tech text-gold/50">{sec.num}</span>
                <h2 className="text-lg font-grotesk font-semibold text-vapor">{sec.title}</h2>
              </div>
              <p className="text-vapor/60 leading-relaxed">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-vapor/10 flex gap-6">
          <Link to="/privacy" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            PRIVACY POLICY →
          </Link>
          <Link to="/contact" className="text-sm font-mono-tech text-vapor/40 hover:text-vapor transition-colors">
            CONTACT US →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}