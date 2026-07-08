import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="h-full p-6 max-w-md mx-auto bg-gray-50">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Profilim</h1>
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-2 text-sm">
        <p>
          <span className="text-gray-500">Ad Soyad:</span> {user.name}
        </p>
        <p>
          <span className="text-gray-500">E-posta:</span> {user.email}
        </p>
        <p>
          <span className="text-gray-500">Rol:</span> {user.role}
        </p>
        <p>
          <span className="text-gray-500">Üyelik Tarihi:</span>{' '}
          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
        </p>
      </div>
    </div>
  );
}
