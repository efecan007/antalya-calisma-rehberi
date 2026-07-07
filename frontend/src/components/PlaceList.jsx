import PlaceCard from './PlaceCard';

export default function PlaceList({ places, activeId, onHover }) {
  if (!places.length) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        Filtrelere uyan mekan bulunamadı.
      </div>
    );
  }

  return (
    <div>
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} active={place.id === activeId} onHover={onHover} />
      ))}
    </div>
  );
}
