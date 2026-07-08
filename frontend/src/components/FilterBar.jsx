import { REGIONS, PLACE_TYPES, SORT_OPTIONS, LEVEL_OPTIONS, NOISE_LEVEL_OPTIONS } from '../constants';

export default function FilterBar({ filters, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-9 gap-2 p-3 bg-white border-b border-gray-200">
      <input
        type="text"
        placeholder="İsim veya adres ara..."
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        className="col-span-2 md:col-span-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      />
      <select
        value={filters.region}
        onChange={(e) => update('region', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm Bölgeler</option>
        {REGIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <select
        value={filters.type}
        onChange={(e) => update('type', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm Türler</option>
        {PLACE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        value={filters.maxPrice}
        onChange={(e) => update('maxPrice', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm Fiyatlar</option>
        <option value="1">₺ (Ekonomik)</option>
        <option value="2">₺₺</option>
        <option value="3">₺₺₺</option>
        <option value="4">₺₺₺₺</option>
      </select>
      <select
        value={filters.minRating}
        onChange={(e) => update('minRating', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm Puanlar</option>
        <option value="3">3+ Puan</option>
        <option value="4">4+ Puan</option>
      </select>
      <select
        value={filters.minInternetSpeed}
        onChange={(e) => update('minInternetSpeed', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm İnternet Hızları</option>
        <option value="3">3+ İnternet Hızı</option>
        <option value="4">4+ İnternet Hızı</option>
      </select>
      <select
        value={filters.noiseLevel}
        onChange={(e) => update('noiseLevel', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm Sessizlik Seviyeleri</option>
        {NOISE_LEVEL_OPTIONS.map((l) => (
          <option key={l.value} value={l.value}>
            Sessizlik: {l.label}
          </option>
        ))}
      </select>
      <select
        value={filters.outletLevel}
        onChange={(e) => update('outletLevel', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        <option value="">Tüm Priz Durumları</option>
        {LEVEL_OPTIONS.map((l) => (
          <option key={l.value} value={l.value}>
            Priz: {l.label}
          </option>
        ))}
      </select>
      <select
        value={filters.sort}
        onChange={(e) => update('sort', e.target.value)}
        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
