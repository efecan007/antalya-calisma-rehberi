export const ROOMS = [
  { id: 'oda-1', name: 'Oda 1' },
  { id: 'oda-2', name: 'Oda 2' },
  { id: 'oda-3', name: 'Oda 3' },
];

export function getRoomName(roomId) {
  return ROOMS.find((room) => room.id === roomId)?.name ?? roomId;
}
