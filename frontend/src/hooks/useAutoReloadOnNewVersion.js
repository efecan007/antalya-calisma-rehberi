import { useEffect } from 'react';

const CHECK_INTERVAL_MS = 30_000;

export default function useAutoReloadOnNewVersion() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/version.txt', { cache: 'no-store' });
        const latest = (await res.text()).trim();
        if (latest && latest !== __BUILD_ID__) {
          window.location.reload();
        }
      } catch {
        // Ağ hatası -> bir sonraki denemede tekrar bakılır, kullanıcıyı rahatsız etme.
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
