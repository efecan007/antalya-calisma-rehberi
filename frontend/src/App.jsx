import { Routes, Route } from 'react-router-dom';
import useAutoReloadOnNewVersion from './hooks/useAutoReloadOnNewVersion';
import Navbar from './components/Navbar';
import CheckInReminderBanner from './components/CheckInReminderBanner';
import PlaceMatchBubble from './components/PlaceMatchBubble';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import PlaceListPage from './pages/PlaceListPage';
import MapPage from './pages/MapPage';
import StreamPage from './pages/StreamPage';
import StreamRoomsPage from './pages/StreamRoomsPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LinkedInCallbackPage from './pages/LinkedInCallbackPage';
import AddPlacePage from './pages/AddPlacePage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';
import SocialFeedPage from './pages/SocialFeedPage';
import SocialPostDetailPage from './pages/SocialPostDetailPage';
import SocialProfilePage from './pages/SocialProfilePage';
import SocialNotificationsPage from './pages/SocialNotificationsPage';

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
          <Route path="/yayin" element={<StreamRoomsPage />} />
          <Route path="/yayin/:roomId" element={<StreamPage />} />
          <Route path="/mekan/:id" element={<PlaceDetailPage />} />
          <Route path="/sosyal" element={<SocialFeedPage />} />
          <Route path="/sosyal/gonderi/:id" element={<SocialPostDetailPage />} />
          <Route path="/sosyal/kullanici/:userId" element={<SocialProfilePage />} />
          <Route
            path="/sosyal/bildirimler"
            element={
              <ProtectedRoute>
                <SocialNotificationsPage />
              </ProtectedRoute>
            }
          />
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
      <CheckInReminderBanner />
      <PlaceMatchBubble />
    </div>
  );
}
