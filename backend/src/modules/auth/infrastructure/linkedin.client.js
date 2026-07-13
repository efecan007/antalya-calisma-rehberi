const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AUTHORIZATION_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const ACCESS_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const STATE_TTL = '5m';

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
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: 'openid profile email',
    state,
  });
  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
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
