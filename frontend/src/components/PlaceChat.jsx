import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

const POLL_INTERVAL_MS = 5000;
const TYPING_STOP_DELAY_MS = 2000;
// Karşı taraf "yazmayı bıraktı" olayını kaçırırsa (sekme kapanması, ağ kopması vb.)
// gösterge kalıcı olarak takılı kalmasın diye belli bir süre sonra kendiliğinden kaybolur.
const TYPING_EXPIRE_MS = 4000;

export default function PlaceChat({ placeId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typingUserIds, setTypingUserIds] = useState(() => new Set());
  const lastIdRef = useRef(null);
  const listRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef(null);
  const typingExpireTimersRef = useRef(new Map());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    lastIdRef.current = null;
    setMessages([]);
    setLoading(true);

    async function poll() {
      try {
        const params = lastIdRef.current ? { after: lastIdRef.current } : {};
        const { data } = await apiClient.get(`/places/${placeId}/messages`, { params });
        if (cancelled || !data.length) return;
        setMessages((prev) => (lastIdRef.current ? [...prev, ...data] : data));
        lastIdRef.current = data[data.length - 1].id;
      } catch {
        // Bir sonraki taramada tekrar denenir; kullanıcıyı geçici ağ
        // hatalarıyla rahatsız etmeye gerek yok.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [placeId, user]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typingUserIds]);

  useEffect(() => {
    if (!user) return undefined;

    const socket = getSocket();
    socket.connect();
    socket.emit('chat:join', { placeId });

    function clearExpireTimer(userId) {
      const timer = typingExpireTimersRef.current.get(userId);
      if (timer) {
        clearTimeout(timer);
        typingExpireTimersRef.current.delete(userId);
      }
    }

    function handleTyping({ placeId: eventPlaceId, userId, isTyping }) {
      if (eventPlaceId !== placeId || userId === user.id) return;

      clearExpireTimer(userId);

      if (isTyping) {
        setTypingUserIds((prev) => new Set(prev).add(userId));
        typingExpireTimersRef.current.set(
          userId,
          setTimeout(() => {
            setTypingUserIds((prev) => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
            typingExpireTimersRef.current.delete(userId);
          }, TYPING_EXPIRE_MS)
        );
      } else {
        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    }

    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('chat:typing', handleTyping);
      socket.emit('chat:leave', { placeId });
      clearTimeout(typingStopTimerRef.current);
      typingExpireTimersRef.current.forEach(clearTimeout);
      typingExpireTimersRef.current.clear();
      setTypingUserIds(new Set());
      socket.disconnect();
    };
  }, [placeId, user]);

  function emitTyping(isTyping) {
    if (isTypingRef.current === isTyping) return;
    isTypingRef.current = isTyping;
    getSocket().emit('chat:typing', { placeId, token: localStorage.getItem('wfh_token'), isTyping });
  }

  function handleTextChange(value) {
    setText(value);
    clearTimeout(typingStopTimerRef.current);

    if (value.trim()) {
      emitTyping(true);
      typingStopTimerRef.current = setTimeout(() => emitTyping(false), TYPING_STOP_DELAY_MS);
    } else {
      emitTyping(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    clearTimeout(typingStopTimerRef.current);
    emitTyping(false);

    setSending(true);
    setError('');
    try {
      await apiClient.post(`/places/${placeId}/messages`, { content });
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mt-4">
      <h2 className="font-medium text-gray-900 mb-3">Mekan Sohbeti</h2>

      {user ? (
        <>
          <div ref={listRef} className="h-64 overflow-y-auto bg-gray-50 rounded-xl p-3 space-y-2">
            {loading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-gray-500">Henüz mesaj yok. İlk mesajı sen yaz!</p>
            )}
            {messages.map((m) => {
              const mine = m.userId === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                      mine ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {!mine && <p className="text-xs font-medium text-brand-700 mb-0.5">{m.user?.name || 'Kullanıcı'}</p>}
                    <p className="break-words">{m.content}</p>
                  </div>
                </div>
              );
            })}
            {typingUserIds.size > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-500">
                  ...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex gap-2 mt-3">
            <input
              type="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              maxLength={1000}
              placeholder="Bir mesaj yaz..."
              className="flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded-md font-medium hover:bg-brand-700 transition disabled:opacity-50"
            >
              Gönder
            </button>
          </form>
          {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        </>
      ) : (
        <p className="text-sm text-gray-500">
          Sohbete katılmak için{' '}
          <Link to="/giris" className="text-brand-600 hover:underline">
            giriş yapın
          </Link>
          .
        </p>
      )}
    </div>
  );
}
