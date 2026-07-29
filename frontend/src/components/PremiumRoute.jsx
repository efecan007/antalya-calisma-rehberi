import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as billingApi from '../api/billing';

/**
 * Sosyal bölümü yalnızca aktif RemoteRehber Pro üyelerine açar. Giriş yapmamış
 * kullanıcı /giris'e, premium olmayan kullanıcı /pro sayfasına yönlendirilir.
 * Mevcut JWT sistemi kullanılır (billing durumu backend'den okunur).
 */
export default function PremiumRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [premium, setPremium] = useState(null); // null: yükleniyor

  useEffect(() => {
    if (!user) {
      setPremium(false);
      return;
    }
    let active = true;
    billingApi
      .getStatus()
      .then((s) => active && setPremium(Boolean(s.isPremium)))
      .catch(() => active && setPremium(false));
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/giris" state={{ from: location }} replace />;
  if (premium === null) return null; // billing durumu yükleniyor
  if (!premium) return <Navigate to="/pro" replace />;

  return children;
}
