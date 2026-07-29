import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UserAvatar from '../components/UserAvatar';
import CardModal from '../components/billing/CardModal';
import * as billingApi from '../api/billing';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default function ProfilePage() {
  const { user, updateAvatar, removeAvatar } = useAuth();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [cardModal, setCardModal] = useState(null); // 'subscribe' | 'update' | null
  const [subBusy, setSubBusy] = useState(false);
  const [subError, setSubError] = useState('');
  const [tab, setTab] = useState('profile'); // 'profile' | 'subscription'
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    billingApi.getStatus().then(setSubscription).catch(() => {});
    billingApi.getInvoices().then(setInvoices).catch(() => {});
  }, []);

  async function handleCancel() {
    if (!window.confirm(t('billing.confirmCancel'))) return;
    setSubBusy(true);
    setSubError('');
    try {
      setSubscription(await billingApi.cancelSubscription());
    } catch (err) {
      setSubError(err.response?.data?.message || t('billing.actionFailed'));
    } finally {
      setSubBusy(false);
    }
  }

  async function handleResume() {
    setSubBusy(true);
    setSubError('');
    try {
      setSubscription(await billingApi.resumeSubscription());
    } catch (err) {
      setSubError(err.response?.data?.message || t('billing.actionFailed'));
    } finally {
      setSubBusy(false);
    }
  }

  async function handleCardSubmit(token) {
    if (cardModal === 'subscribe') {
      setSubscription(await billingApi.subscribe(token));
    } else {
      await billingApi.updatePaymentMethod(token);
      setSubscription(await billingApi.getStatus());
    }
    setCardModal(null);
  }

  if (!user) return null;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setError(t('profile.photoInvalidType'));
      return;
    }

    setUploading(true);
    setError('');
    try {
      await updateAvatar(file);
    } catch (err) {
      setError(err.response?.data?.message || t('profile.photoUploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    setRemoving(true);
    setError('');
    try {
      await removeAvatar();
    } catch (err) {
      setError(err.response?.data?.message || t('profile.photoRemoveFailed'));
    } finally {
      setRemoving(false);
    }
  }

  const locale = lang === 'en' ? 'en-US' : 'tr-TR';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(locale) : '—');

  const tabClass = (name) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
      tab === name ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto bg-gray-50">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('profile.title')}</h1>

      {/* Sekmeler */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        <button onClick={() => setTab('profile')} className={tabClass('profile')}>
          {t('profile.tabProfile')}
        </button>
        <button onClick={() => setTab('subscription')} className={tabClass('subscription')}>
          {t('profile.tabSubscription')}
        </button>
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-card p-5 space-y-4 text-sm">
          <div className="flex items-center gap-4">
            <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || removing}
                  className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-full transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {uploading ? t('profile.uploadingPhoto') : t('profile.changePhoto')}
                </button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading || removing}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full transition hover:bg-gray-200 disabled:opacity-50"
                  >
                    {removing ? t('profile.removingPhoto') : t('profile.removePhoto')}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('profile.photoHint')}</p>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p>
              <span className="text-gray-500">{t('profile.name')}</span> {user.name}
            </p>
            {user.companyName && (
              <p>
                <span className="text-gray-500">{t('profile.company')}</span> {user.companyName}
              </p>
            )}
            <p>
              <span className="text-gray-500">{t('profile.email')}</span> {user.email}
            </p>
            <p>
              <span className="text-gray-500">{t('profile.role')}</span>{' '}
              {user.role === 'ADMIN' ? t('profile.roleAdmin') : t('profile.roleUser')}
            </p>
            <p>
              <span className="text-gray-500">{t('profile.memberSince')}</span>{' '}
              {fmtDate(user.createdAt)}
            </p>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="bg-white rounded-2xl shadow-card p-5 text-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">{t('profile.subTitle')}</h2>
            {subscription?.isPremium && (
              <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                ⭐ Pro
              </span>
            )}
          </div>

          {!subscription ? (
            <p className="text-gray-400">{t('common.loading')}</p>
          ) : (
            <>
              <dl className="divide-y divide-gray-100">
                <Row label={t('profile.subPlan')} value={subscription.planName || t('profile.subPlanFree')} />
                <Row label={t('profile.subStatus')} value={t(`profile.status${subscription.status}`)} highlight={subscription.isPremium} />
                <Row label={t('profile.subStart')} value={fmtDate(subscription.startedAt)} />
                <Row label={t('profile.subTrialEnd')} value={fmtDate(subscription.trialEndsAt)} />
                <Row label={t('profile.subLastPayment')} value={fmtDate(subscription.lastPaymentAt)} />
                <Row
                  label={t('profile.subNextPayment')}
                  value={
                    subscription.status === 'ACTIVE'
                      ? fmtDate(subscription.currentPeriodEnd)
                      : subscription.status === 'TRIAL'
                        ? fmtDate(subscription.trialEndsAt)
                        : '—'
                  }
                />
              </dl>

              {/* Aksiyonlar */}
              <div className="flex flex-wrap gap-2 pt-4 mt-2 border-t border-gray-100">
                {(subscription.status === 'FREE' || subscription.status === 'EXPIRED' || subscription.status === 'TRIAL') && (
                  <button onClick={() => setCardModal('subscribe')} disabled={subBusy}
                    className="text-sm bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-700 disabled:opacity-50">
                    {t('billing.subscribeNow')}
                  </button>
                )}
                {subscription.status === 'CANCELED' && (
                  <button onClick={handleResume} disabled={subBusy}
                    className="text-sm bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-700 disabled:opacity-50">
                    {t('billing.resume')}
                  </button>
                )}
                {(subscription.status === 'ACTIVE' || subscription.status === 'TRIAL' || subscription.status === 'PAST_DUE') && (
                  <button onClick={() => setCardModal('update')} disabled={subBusy}
                    className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 disabled:opacity-50">
                    {t('billing.updateCard')}
                  </button>
                )}
                {(subscription.status === 'ACTIVE' || subscription.status === 'TRIAL') && (
                  <button onClick={handleCancel} disabled={subBusy}
                    className="text-sm text-red-600 px-4 py-2 rounded-full hover:bg-red-50 disabled:opacity-50">
                    {t('billing.cancel')}
                  </button>
                )}
                {!subscription.isPremium && (
                  <Link to="/pro" className="text-sm text-brand-600 hover:underline px-1 py-2 self-center">
                    {t('profile.subExplore')}
                  </Link>
                )}
              </div>
              {subError && <p className="text-xs text-red-600 mt-2">{subError}</p>}

              {invoices.length > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('profile.invoicesTitle')}</h3>
                  <div className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-gray-500">{fmtDate(inv.issuedAt)}</span>
                        <span className="text-gray-900">
                          {(inv.amount / 100).toLocaleString(locale)} ₺
                          <span className={`ml-2 text-xs ${inv.status === 'paid' ? 'text-brand-700' : 'text-gray-400'}`}>
                            {inv.status === 'paid' ? t('profile.invoicePaid') : inv.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <CardModal
        open={Boolean(cardModal)}
        title={cardModal === 'subscribe' ? t('billing.subscribeTitle') : t('billing.updateCardTitle')}
        onClose={() => setCardModal(null)}
        onSubmit={handleCardSubmit}
      />
    </div>
  );
}

// Abonelik sekmesinde etiket/değer satırı.
function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right ${highlight ? 'font-medium text-brand-700' : 'text-gray-900'}`}>{value}</dd>
    </div>
  );
}
