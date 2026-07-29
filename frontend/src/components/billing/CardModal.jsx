import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Kart markasını ilk haneden tahmin eder (gösterim amaçlı).
function guessBrand(number) {
  const first = number.replace(/\D/g, '')[0];
  if (first === '4') return 'visa';
  if (first === '5') return 'mastercard';
  if (first === '3') return 'amex';
  return 'card';
}

/**
 * Kart giriş modalı. GÜVENLİK: Tam kart numarası backend'e GÖNDERİLMEZ. İstemcide
 * yalnızca marka + son 4 haneden bir token türetilir ("tok_<brand>_<last4>") ve
 * sadece bu token backend'e iletilir. Gerçek dağıtımda bu, Stripe.js gibi bir
 * SDK ile yapılan gerçek tokenizasyonla değiştirilir (aynı sözleşme).
 */
export default function CardModal({ open, title, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const digits = number.replace(/\D/g, '');
  const valid = digits.length >= 12 && /^\d{2}\/\d{2}$/.test(exp) && cvc.length >= 3;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) {
      setError(t('billing.cardInvalid'));
      return;
    }
    setSubmitting(true);
    setError('');
    // İstemci tarafı (simüle) tokenizasyon: PAN gönderilmez.
    const token = `tok_${guessBrand(number)}_${digits.slice(-4)}`;
    try {
      await onSubmit(token);
    } catch (err) {
      setError(err.response?.data?.message || t('billing.cardFailed'));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-card-hover w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            type="text"
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder={t('billing.cardNumber')}
            maxLength={19}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              placeholder={t('billing.cardExp')}
              maxLength={5}
              className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
              placeholder="CVC"
              maxLength={4}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400">{t('billing.cardSecurityNote')}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !valid}
            className="w-full bg-brand-600 text-white text-sm font-medium py-2.5 rounded-full hover:bg-brand-700 transition disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('billing.cardSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
