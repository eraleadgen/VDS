import { Check, MessageCircle } from 'lucide-react';
import { lookupTier, CATEGORY_LABEL } from '@/lib/quoteCalc';

export default function ServicePicker({ config, classification, pricingGroup, selected, addOns, consultations, onToggleService, onToggleAddOn, onToggleConsultation }) {
  const allServices = config?.services || [];
  const detailServices = allServices.filter(s => s.category === 'detail');
  const addOnServices = allServices.filter(s => s.category === 'addon');
  const coatingServices = allServices.filter(s => s.category === 'coating');
  const correctionServices = allServices.filter(s => s.category === 'correction');

  const ServiceButton = ({ svc, checked, onClick, prefix }) => (
    <button type="button" onClick={onClick}
      className={`flex items-center justify-between gap-3 p-4 rounded-sm border text-left transition-all ${checked ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-gold border-gold' : 'border-vapor/30'}`}>
          {checked && <Check size={13} className="text-obsidian" />}
        </span>
        <span className="text-sm text-vapor font-grotesk truncate">{svc.label}</span>
      </div>
      <span className="text-gold font-grotesk font-bold text-base shrink-0">{prefix}{lookupTier(svc, classification, pricingGroup)?.price ?? 0}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.detail}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {detailServices.map(svc => (
            <ServiceButton key={svc.key} svc={svc} checked={selected.includes(svc.key)} onClick={() => onToggleService(svc.key)} prefix="$" />
          ))}
        </div>
      </div>

      {addOnServices.length > 0 && (
        <div>
          <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.addon}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addOnServices.map(svc => (
              <ServiceButton key={svc.key} svc={svc} checked={addOns.includes(svc.key)} onClick={() => onToggleAddOn(svc.key)} prefix="+$" />
            ))}
          </div>
        </div>
      )}

      {coatingServices.length > 0 && (
        <div>
          <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.coating}</p>
          <div className="space-y-2">
            {coatingServices.map(svc => {
              const checked = consultations.includes(svc.key);
              return (
                <button key={svc.key} type="button" onClick={() => onToggleConsultation(svc.key)}
                  className={`w-full flex items-center justify-between gap-3 p-5 rounded-sm border text-left transition-all ${checked ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
                  <div className="flex items-center gap-3">
                    <MessageCircle size={18} className={checked ? 'text-gold' : 'text-vapor/40'} />
                    <div>
                      <span className="block text-sm text-vapor font-grotesk">{svc.label} Consultation</span>
                      <span className="text-xs font-mono-tech text-vapor/40">Free 15-min consultation · Custom quote on-site</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono-tech tracking-widest shrink-0 ${checked ? 'text-gold' : 'text-vapor/50'}`}>
                    {checked ? '✓ ADDED' : 'CONSULTATION'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {correctionServices.length > 0 && (
        <div>
          <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.correction}</p>
          <div className="space-y-2">
            {correctionServices.map(svc => {
              const checked = consultations.includes(svc.key);
              return (
                <button key={svc.key} type="button" onClick={() => onToggleConsultation(svc.key)}
                  className={`w-full flex items-center justify-between gap-3 p-5 rounded-sm border text-left transition-all ${checked ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
                  <div className="flex items-center gap-3">
                    <MessageCircle size={18} className={checked ? 'text-gold' : 'text-vapor/40'} />
                    <div>
                      <span className="block text-sm text-vapor font-grotesk">{svc.label} Consultation</span>
                      <span className="text-xs font-mono-tech text-vapor/40">Free 15-min consultation · Custom quote on-site</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono-tech tracking-widest shrink-0 ${checked ? 'text-gold' : 'text-vapor/50'}`}>
                    {checked ? '✓ ADDED' : 'CONSULTATION'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}