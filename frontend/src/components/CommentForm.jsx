import { useState } from 'react';
import apiClient from '../api/client';

export default function CommentForm({ placeId, onSubmitted }) {
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) {
      setError('Yorum metni boş olamaz');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (photo) formData.append('photo', photo);
      await apiClient.post(`/places/${placeId}/comments`, formData);
      setContent('');
      setPhoto(null);
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Yorum gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-gray-900">Yorum Yap</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <textarea
        placeholder="Bu mekan hakkında yorumunuz..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white"
        rows={3}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
        className="text-xs text-gray-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
      >
        {submitting ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
}
