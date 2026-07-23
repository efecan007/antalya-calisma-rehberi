const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AUTHORIZATION_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const ACCESS_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const STATE_TTL = '5m';

// Bazı barındırma panellerinde (ör. Render) ortam değişkenleri kopyala-yapıştır
// sırasında sonuna fazladan satır sonu/boşluk ekleyebiliyor; LinkedIn redirect_uri'yi
// karakter karakter karşılaştırdığı için bu fark "redirect_uri does not match the
// registered value" hatasına yol açar. trim() ile bu tür panel kaynaklı boşluklara
// karşı dayanıklı hale getiriyoruz.
function getRedirectUri() {
  return (process.env.LINKEDIN_REDIRECT_URI || '').trim();
}

function getClientId() {
  return (process.env.LINKEDIN_CLIENT_ID || '').trim();
}

function getClientSecret() {
  return (process.env.LINKEDIN_CLIENT_SECRET || '').trim();
}

function signState() {
  return jwt.sign({ nonce: crypto.randomUUID(), purpose: 'linkedin_oauth' }, process.env.JWT_SECRET, {
    expiresIn: STATE_TTL,
  });
}

function verifyState(state) {
  const payload = jwt.verify(state, process.env.JWT_SECRET);
  if (payload.purpose !== 'linkedin_oauth') {
    throw new Error('Geçersiz state');
  }
}

function buildAuthorizationUrl() {
  const state = signState();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    scope: 'openid profile email',
    state,
  });
  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    client_id: getClientId(),
    client_secret: getClientSecret(),
  });

  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn token değişimi başarısız oldu (${response.status})`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchProfile(accessToken) {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`LinkedIn profil bilgisi alınamadı (${response.status})`);
  }

  const data = await response.json();
  return {
    providerId: data.sub,
    email: data.email,
    name: data.name,
    avatarUrl: data.picture,
  };
}

module.exports = { buildAuthorizationUrl, verifyState, exchangeCodeForToken, fetchProfile };
