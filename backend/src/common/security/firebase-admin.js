// Firebase Admin SDK ağır bir bağımlılıktır ve yalnızca sosyal giriş sırasında
// gerekir; bu yüzden hem paketin kendisi hem de uygulama örneği ilk kullanımda
// (lazy) yüklenir. Böylece backend başlangıcı hızlanır ve Firebase'e dokunmayan
// testler bu paketi hiç yüklemez.
let authInstance;

function getAuthInstance() {
  if (authInstance) return authInstance;

  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  // Private key .env içinde tek satır tutulur; literal "\n" dizileri gerçek satır
  // sonlarına çevrilir (docker/dotenv zaten çevirmişse bu no-op olur). Barındırma
  // panellerine (Render vb.) yapıştırılırken başta/sonda fazladan boşluk/satır sonu
  // kalabilir, ya da .env dosyasındaki sarmalayıcı tırnaklar yanlışlıkla değerin
  // parçası olarak kopyalanabilir — ikisi de "Failed to parse private key" hatasına
  // yol açar; trim() ve tırnak temizliği bu sınıf hataları tolere eder.
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const unquotedPrivateKey =
    rawPrivateKey && rawPrivateKey.length >= 2 && rawPrivateKey[0] === rawPrivateKey.at(-1) && '"\''.includes(rawPrivateKey[0])
      ? rawPrivateKey.slice(1, -1)
      : rawPrivateKey;
  const privateKey = unquotedPrivateKey?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin yapılandırması eksik (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).'
    );
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  authInstance = getAuth(app);
  return authInstance;
}

// İstemciden gelen Firebase kimlik jetonunu doğrular ve çözümlenmiş payload'ı döner.
function verifyIdToken(idToken) {
  return getAuthInstance().verifyIdToken(idToken);
}

// LinkedIn köprüsü için: backend LinkedIn OAuth'u tamamladıktan sonra, istemcinin
// Firebase'e giriş yapabilmesi için bir custom token üretir.
function createCustomToken(uid, additionalClaims) {
  return getAuthInstance().createCustomToken(uid, additionalClaims);
}

module.exports = { verifyIdToken, createCustomToken };
