import { Routes, Route } from 'react-router-dom';
import useAutoReloadOnNewVersion from './hooks/useAutoReloadOnNewVersion';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import PlaceListPage from './pages/PlaceListPage';
import MapPage from './pages/MapPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LinkedInCallbackPage from './pages/LinkedInCallbackPage';
import AddPlacePage from './pages/AddPlacePage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  useAutoReloadOnNewVersion();

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mekanlar" element={<PlaceListPage />} />
          <Route path="/harita" element={<MapPage />} />
          <Route path="/mekan/:id" element={<PlaceDetailPage />} />
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/giris/linkedin" element={<LinkedInCallbackPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          <Route
            path="/mekan-ekle"
            element={
              <ProtectedRoute>
                <AddPlacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorilerim"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/mekanlar/:id/duzenle"
            element={
              <AdminRoute>
                <AddPlacePage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
