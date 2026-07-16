import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const linkClass = ({ isActive }) =>
  `px-1 py-1 text-sm transition ${isActive ? 'text-brand-700 font-medium' : 'text-gray-600 hover:text-brand-700'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm relative z-20">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={closeMenu}>
          <span className="font-semibold text-lg text-gray-900">Remote Rehber</span>
          <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
            Antalya
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          <NavLink to="/mekanlar" className={linkClass}>
            Mekanlar
          </NavLink>
          <NavLink to="/harita" className={linkClass}>
            Harita
          </NavLink>
          <NavLink to="/yayin" className={linkClass}>
            Canlı Yayın
          </NavLink>
          {user ? (
            <>
              <NavLink to="/mekan-ekle" className={linkClass}>
                Mekan Ekle
              </NavLink>
              <NavLink to="/favorilerim" className={linkClass}>
                Favorilerim
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" className={linkClass}>
                  Admin Paneli
                </NavLink>
              )}
              <NavLink to="/profil" className={linkClass}>
                {user.name}
              </NavLink>
              <NotificationBell />
              <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-brand-700 transition">
                Çıkış
              </button>
            </>
          ) : (
            <>
              <NavLink to="/giris" className={linkClass}>
                Giriş
              </NavLink>
              <Link
                to="/kayit"
                className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded-full font-medium hover:bg-brand-700 transition"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-gray-600 hover:text-brand-700"
          aria-label="Menüyü aç/kapat"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1 shadow-card">
          <NavLink to="/mekanlar" className={linkClass} onClick={closeMenu}>
            Mekanlar
          </NavLink>
          <NavLink to="/harita" className={linkClass} onClick={closeMenu}>
            Harita
          </NavLink>
          <NavLink to="/yayin" className={linkClass} onClick={closeMenu}>
            Canlı Yayın
          </NavLink>
          {user ? (
            <>
              <NavLink to="/mekan-ekle" className={linkClass} onClick={closeMenu}>
                Mekan Ekle
              </NavLink>
              <NavLink to="/favorilerim" className={linkClass} onClick={closeMenu}>
                Favorilerim
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
                  Admin Paneli
                </NavLink>
              )}
              <NavLink to="/profil" className={linkClass} onClick={closeMenu}>
                {user.name}
              </NavLink>
              <div className="py-1">
                <NotificationBell />
              </div>
              <button onClick={handleLogout} className="text-left text-sm text-gray-600 hover:text-brand-700 py-1">
                Çıkış
              </button>
            </>
          ) : (
            <>
              <NavLink to="/giris" className={linkClass} onClick={closeMenu}>
                Giriş
              </NavLink>
              <Link
                to="/kayit"
                onClick={closeMenu}
                className="mt-1 inline-block text-center bg-brand-600 text-white text-sm px-4 py-2 rounded-full font-medium hover:bg-brand-700 transition"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
