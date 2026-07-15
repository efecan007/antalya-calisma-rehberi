import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { ROOMS } from '../lib/rooms';

export default function StreamRoomsPage() {
  const [liveRooms, setLiveRooms] = useState(() => new Set());

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    function handleRoomsStatus(statuses) {
      setLiveRooms(new Set(statuses.filter((s) => s.live).map((s) => s.roomId)));
    }

    function handleStreamStatus({ roomId, live }) {
      setLiveRooms((prev) => {
        const next = new Set(prev);
        if (live) next.add(roomId);
        else next.delete(roomId);
        return next;
      });
    }

    socket.on('rooms-status', handleRoomsStatus);
    socket.on('stream-status', handleStreamStatus);

    return () => {
      socket.off('rooms-status', handleRoomsStatus);
      socket.off('stream-status', handleStreamStatus);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Canlı Yayın Odaları</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ROOMS.map((room) => {
            const live = liveRooms.has(room.id);
            return (
              <Link
                key={room.id}
                to={`/yayin/${room.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-card transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{room.name}</span>
                  {live ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      Canlı
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Yayın yok</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
