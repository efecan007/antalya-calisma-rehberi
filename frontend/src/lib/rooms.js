const ROOM_COUNT = 21;

export const ROOMS = Array.from({ length: ROOM_COUNT }, (_, i) => ({
  id: `oda-${i + 1}`,
  name: `Oda ${i + 1}`,
}));
