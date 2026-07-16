import { Link } from 'react-router-dom';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const SECTIONS = [
  {
    num: '1.',
    title: 'Information We Collect',
    content: 'We may collect personal information from you in a variety of ways, including when you request a quote, book an appointment, or communicate with us. The types of personal information we may collect include: Personal Identifiers (your full name, phone number, and physical address including street, city, state, and postal code) and Communication Data (information you provide when you contact us, including consent to receive text messages for appointment reminders and updates).',
  },
  {
    num: '2.',
    title: 'How We Use Your Information',
    content: 'We use the information we collect to provide and manage services (schedule and confirm appointments, provide mobile detailing services, and process payments), to communicate with you (send appointment reminders, service updates, and respond to inquiries — with consent, these may be via SMS), and for internal business purposes such as data analysis and improving our services.',
  },
  {
    num: '3.',
    title: 'Disclosure of Your Information',
    content: 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your information may be shared only with trusted third-party vendors who assist in operating our website and business (so long as those parties agree to keep information confidential), or when required by law in response to valid requests by public authorities.',
  },
  {
    num: '4.',
    title: 'SMS/Text Message Policy',
    content: 'By providing your mobile phone number and opting in, you consent to receive SMS text messages from Valet Detailing Service LLC (VDS Mobile) sent from (470) 412-8986 regarding your appointments, service updates, and promotional offers. Message frequency varies. You can opt out at any time by replying "STOP" to any message. For help, reply "HELP." Standard message and data rates may apply. We will not share your SMS opt-in data or consent with any third parties. To withdraw consent or change your number, contact us at Valetdetailingservice@gmail.com.',
  },
  {
    num: '5.',
    title: 'Data Security',
    content: 'We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.',
  },
  {
    num: '6.',
    title: 'Your Data Protection Rights',
    content: 'You have the right to access, correct, or delete your personal information that we hold. If you wish to exercise any of these rights, please contact us using the information provided on our website.',
  },
  {
    num: '7.',
    title: "Children's Privacy",
    content: 'Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information.',
  },
  {
    num: '8.',
    title: 'Changes to This Privacy Policy',
    content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.',
  },
  {
    num: '9.',
    title: 'Contact Us',
    content: 'If you have any questions about this Privacy Policy, please contact us through the official channels listed on our website at vdsmobile.com or via email at Valetdetailingservice@gmail.com.',
  },
  {
    num: '10.',
    title: 'Cookie & Tracking Practices',
    content: 'Valet Detailing Service LLC (VDS Mobile) may use cookies and similar tracking technologies to enhance user experience, analyze website traffic, and improve our services. Cookies may collect information such as browser type, pages visited, and time spent on the website. Users may disable cookies through their browser settings.',
  },
  {
    num: '11.',
    title: 'Mobile Information Sharing Statement',
    content: 'No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. All categories above exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.',
  },
];

export default function Privacy() {
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-36 pb-20 max-w-4xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">LEGAL</p>
        <h1 className="text-5xl font-grotesk font-bold text-vapor mb-3">PRIVACY POLICY</h1>
        <p className="text-xs font-mono-tech text-vapor/30 mb-16 tracking-widest">VALET DETAILING SERVICE LLC · LAST UPDATED: JULY 16, 2026</p>

        <p className="text-vapor/60 leading-relaxed mb-12 border-l border-gold/20 pl-8">
          Valet Detailing Service LLC ("VDS," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our mobile detailing services.
        </p>

        <div className="space-y-10">
          {SECTIONS.map(sec => (
            <div key={sec.num} className="border-l border-gold/20 pl-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono-tech text-gold/50">{sec.num}</span>
                <h2 className="text-lg font-grotesk font-semibold text-vapor">{sec.title}</h2>
              </div>
              <p className="text-vapor/60 leading-relaxed">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-vapor/10 flex gap-6">
          <Link to="/terms" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            TERMS & CONDITIONS →
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