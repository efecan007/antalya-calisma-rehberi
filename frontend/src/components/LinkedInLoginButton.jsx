const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function LinkedInLoginButton() {
  return (
    <a
      href={`${API_URL}/auth/linkedin`}
      className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0A66C2]" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
      LinkedIn ile giriş yap
    </a>
  );
}
