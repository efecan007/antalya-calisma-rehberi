import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-brand-700 text-white px-4 py-3 flex items-center justify-between shadow">
      <Link to="/" className="font-semibold text-lg">
        Work From Hotel / Cafe
        <span className="ml-2 text-brand-100 text-sm font-normal">Antalya</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/" className="hover:text-brand-100">
          Keşfet
        </Link>
        {user ? (
          <>
            <Link to="/mekan-ekle" className="hover:text-brand-100">
              Mekan Ekle
            </Link>
            <Link to="/favorilerim" className="hover:text-brand-100">
              Favorilerim
            </Link>
            {user.role === 'ADMIN' && (
              <Link to="/admin" className="hover:text-brand-100">
                Admin Paneli
              </Link>
            )}
            <Link to="/profil" className="hover:text-brand-100">
              {user.name}
            </Link>
            <button onClick={handleLogout} className="hover:text-brand-100">
              Çıkış
            </button>
          </>
        ) : (
          <>
            <Link to="/giris" className="hover:text-brand-100">
              Giriş
            </Link>
            <Link
              to="/kayit"
              className="bg-white text-brand-700 px-3 py-1.5 rounded-md font-medium hover:bg-brand-50"
            >
              Kayıt Ol
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
