import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';
import JourneyTimeline from '@/components/admin/JourneyTimeline';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-mono-tech tracking-widest text-vapor/40">{label}</span>
      <span className="text-xs text-vapor/80 font-mono-tech break-all">{value || '—'}</span>
    </div>
  );
}

export default function CustomerJourneyCard({ customer, partnerName = '', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
  const phone = customer.phone || '—';
  const email = customer.email || '—';

  const loadEntries = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const list = await base44.entities.CustomerJourney.filter({ customer_id: customer.id }, '-created_date', 200);
      setEntries(list || []);
      setLoaded(true);
    } catch (e) { console.error(e); setEntries([]); }
    finally { setLoading(false); }
  };

  const onToggle = (o) => {
    setOpen(o);
    if (o) loadEntries();
  };

  return (
    <div className={`glass-panel border rounded-sm transition-colors ${open ? 'border-gold/30' : 'border-vapor/10'}`}>
      <button
        type="button"
        onClick={() => onToggle(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left min-w-0"
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-grotesk font-bold text-vapor truncate">{fullName}</h3>
          <p className="text-xs text-vapor/40 font-mono-tech truncate">{phone} · {email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono-tech tracking-widest text-vapor/30 hidden sm:inline">
            {customer.total_jobs || 0} JOBS · ${(customer.lifetime_revenue || 0).toLocaleString()}
          </span>
          <Clock size={16} className={`text-gold/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-vapor/10 px-4 pb-4 pt-3 space-y-4">
          {/* Customer ID */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono-tech tracking-widest text-vapor/40">CUSTOMER ID</span>
            <code className="text-[11px] font-mono-tech text-gold bg-gold/5 border border-gold/20 px-2 py-0.5 rounded-sm break-all">{customer.id}</code>
          </div>

          {/* Full info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <InfoRow label="FIRST NAME" value={customer.first_name} />
            <InfoRow label="LAST NAME" value={customer.last_name} />
            <InfoRow label="PHONE" value={customer.phone} />
            <InfoRow label="EMAIL" value={customer.email} />
            <InfoRow label="LINKED USER ID" value={customer.linked_user_id} />
            <InfoRow label="CUSTOMER SINCE" value={customer.customer_since} />
            <InfoRow label="ACCOUNT STATUS" value={customer.account_status} />
            <InfoRow label="REVIEW STATUS" value={(customer.review_status || 'no_review').replace(/_/g, ' ')} />
            <InfoRow label="PREFERRED CONTACT" value={customer.preferred_contact_method} />
            <InfoRow label="SMS CONSENT" value={customer.sms_consent ? 'Yes' : 'No'} />
            <InfoRow label="EMAIL CONSENT" value={customer.email_consent ? 'Yes' : 'No'} />
            <InfoRow label="LIFETIME REVENUE" value={`$${(customer.lifetime_revenue || 0).toLocaleString()}`} />
            <InfoRow label="TOTAL JOBS" value={customer.total_jobs || 0} />
            <InfoRow label="REFERRAL SOURCE" value={customer.referral_source || (partnerName ? 'Partner Referral' : '')} />
            <InfoRow label="REFERRED BY PARTNER" value={partnerName || (customer.referred_by_partner_id ? customer.referred_by_partner_id : '')} />
            <InfoRow label="BILLING ADDRESS" value={customer.billing_address} />
            <InfoRow label="CREATED" value={fmtDate(customer.created_date)} />
          </div>

          {(customer.service_addresses || []).length > 0 && (
            <div>
              <span className="text-[10px] font-mono-tech tracking-widest text-vapor/40">SERVICE ADDRESSES</span>
              <ul className="mt-1 space-y-1">
                {(customer.service_addresses || []).map((a, i) => (
                  <li key={i} className="text-xs text-vapor/70 font-mono-tech">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {customer.notes && (
            <div>
              <span className="text-[10px] font-mono-tech tracking-widest text-vapor/40">NOTES</span>
              <p className="text-xs text-vapor/70 mt-1 leading-relaxed">{customer.notes}</p>
            </div>
          )}

          {/* Journey history */}
          <div>
            <span className="text-[10px] font-mono-tech tracking-widest text-gold/70">JOURNEY HISTORY</span>
            <div className="mt-2">
              {loading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
              ) : entries.length === 0 ? (
                <p className="text-xs text-vapor/30 font-mono-tech py-4">No journey entries yet.</p>
              ) : (
                <JourneyTimeline entries={entries} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}