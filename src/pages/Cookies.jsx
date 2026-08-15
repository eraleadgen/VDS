import { Link } from 'react-router-dom';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import { useLegalContext } from '@/lib/useLegalContext';

// Every legal-identity reference — entity name, brand, jurisdiction, domain, contact
// email — is templated from the tenant's BusinessConfig via useLegalContext. See
// useLegalContext for the field mapping.
const buildSections = (c) => [
  {
    num: '1.',
    title: 'Cookies Policy',
    content: `${c.legalName} ("${c.businessName}," "we," "us," or "our") uses cookies and similar tracking technologies on our website at ${c.domain}. This Cookies Policy explains what cookies are, how we use them, and the choices you have. This policy is provided in compliance with A2P 10DLC messaging requirements and applicable data protection regulations.`,
  },
  {
    num: '2.',
    title: 'What Are Cookies',
    content: 'Cookies are small text files placed on your device by the websites you visit. They are widely used to make websites work more efficiently and to provide information to the site owners. Cookies do not contain personal information on their own and cannot be used to identify you personally on their own, but they may be linked to personal information we hold about you.',
  },
  {
    num: '3.',
    title: 'How We Use Cookies',
    content: 'We use cookies to: remember your preferences and settings (such as login state and vehicle selections); understand how visitors use our website so we can improve its content and functionality; remember that you have given consent to receive SMS communications from us; and provide a personalized experience when booking appointments or managing your membership.',
  },
  {
    num: '4.',
    title: 'Types of Cookies We Use',
    content: 'Essential cookies: These are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services, such as logging into your account or booking an appointment. Preference cookies: These remember information that changes the way the website behaves or looks, such as your preferred language or region. Analytics cookies: These allow us to count visits and traffic sources so we can measure and improve site performance. SMS Consent cookies: These record whether you have provided consent to receive SMS messages from us, as required for A2P 10DLC compliance.',
  },
  {
    num: '5.',
    title: 'SMS Messaging and A2P 10DLC Consent',
    content: `By providing your phone number and checking the SMS consent box on our website forms, you consent to receive conversational SMS messages from ${c.legalName} (${c.businessName}) related to detailing services, including appointment confirmations, reminders, service updates, and customer support. Your SMS consent is recorded via cookies and our database to maintain compliance with A2P 10DLC registration requirements. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe from SMS messages. Reply HELP for assistance. Carriers are not liable for delayed or undelivered messages.`,
  },
  {
    num: '6.',
    title: 'Third-Party Cookies',
    content: 'In some special cases, we may use cookies provided by trusted third parties. These third-party cookies may be used for analytics purposes (such as Google Analytics) or payment processing (such as Stripe). We do not control these third-party cookies and their use is subject to their own privacy policies.',
  },
  {
    num: '7.',
    title: 'Managing and Deleting Cookies',
    content: `You can control and delete cookies through your browser settings. Most web browsers provide instructions on how to manage cookies in the help or settings section. If you disable cookies, some features of our website may not function properly, including the ability to log into your member account, book appointments, or record your SMS consent. Disabling cookies does not revoke SMS consent you have already provided; to revoke SMS consent, reply STOP to any message from ${c.businessName}.`,
  },
  {
    num: '8.',
    title: 'Changes to This Policy',
    content: `${c.legalName} may update this Cookies Policy from time to time to reflect changes in technology, regulation, or our business practices. The most current version will always be posted on our website. Your continued use of our website after any changes constitutes your acceptance of the updated policy.`,
  },
  {
    num: '9.',
    title: 'Contact Us',
    content: `If you have any questions about this Cookies Policy or our use of cookies and tracking technologies, please contact us through the official channels listed on our website at ${c.domain} or via email at ${c.email}.`,
  },
];

export default function Cookies() {
  const c = useLegalContext();
  const sections = buildSections(c);
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-36 pb-20 max-w-4xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">LEGAL</p>
        <h1 className="text-5xl font-grotesk font-bold text-vapor mb-3">COOKIES POLICY</h1>
        <p className="text-xs font-mono-tech text-vapor/30 mb-16 tracking-widest">{c.legalName.toUpperCase()} · LAST UPDATED: JULY 16, 2026</p>

        <div className="space-y-10">
          {sections.map(sec => (
            <div key={sec.title} className="border-l border-gold/20 pl-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono-tech text-gold/50">{sec.num}</span>
                <h2 className="text-lg font-grotesk font-semibold text-vapor">{sec.title}</h2>
              </div>
              <p className="text-vapor/60 leading-relaxed">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-vapor/10 flex flex-wrap gap-6">
          <Link to="/terms" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            TERMS & CONDITIONS →
          </Link>
          <Link to="/privacy" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            PRIVACY POLICY →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}