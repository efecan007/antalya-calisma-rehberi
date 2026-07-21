import { useState } from 'react';
import { REGIONS, PLACE_TYPES, LEVEL_OPTIONS, NOISE_LEVEL_OPTIONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

const selectClass = 'border border-gray-200 bg-white rounded-md px-2 py-1.5 text-sm text-gray-700';

export default function FilterBar({ filters, onChange }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange(Object.fromEntries(Object.keys(filters).map((key) => [key, ''])));
  }

  const activeCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'search' && key !== 'sort'
  ).length;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 p-3">
        <input
          type="text"
          placeholder={t('filter.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`md:hidden shrink-0 flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-sm font-medium transition ${
            expanded ? 'border-brand-400 text-brand-700 bg-brand-50' : 'border-gray-200 text-gray-700'
          }`}
        >
          {t('filter.filters')}
          {activeCount > 0 && (
            <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className={`${expanded ? 'grid' : 'hidden'} md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 px-3 pb-3`}>
        <select value={filters.region} onChange={(e) => update('region', e.target.value)} className={selectClass}>
          <option value="">{t('filter.allRegions')}</option>
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select value={filters.type} onChange={(e) => update('type', e.target.value)} className={selectClass}>
          <option value="">{t('filter.allTypes')}</option>
          {PLACE_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {t(`enum.placeType.${pt.value}`)}
            </option>
          ))}
        </select>
        <select value={filters.sort} onChange={(e) => update('sort', e.target.value)} className={selectClass}>
          <option value="">{t('filter.allPrices')}</option>
          <option value="priceLevel-desc">{t('filter.priceHighLow')}</option>
          <option value="priceLevel-asc">{t('filter.priceLowHigh')}</option>
        </select>
        <select value={filters.minRating} onChange={(e) => update('minRating', e.target.value)} className={selectClass}>
          <option value="">{t('filter.allRatings')}</option>
          <option value="3">{t('filter.rating3plus')}</option>
          <option value="4">{t('filter.rating4plus')}</option>
        </select>
        <select
          value={filters.minInternetSpeed}
          onChange={(e) => update('minInternetSpeed', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('filter.allInternet')}</option>
          <option value="3">{t('filter.internet3plus')}</option>
          <option value="4">{t('filter.internet4plus')}</option>
        </select>
        <select value={filters.noiseLevel} onChange={(e) => update('noiseLevel', e.target.value)} className={selectClass}>
          <option value="">{t('filter.allNoise')}</option>
          {NOISE_LEVEL_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {t('filter.noisePrefix')}: {t(`enum.noiseLevel.${l.value}`)}
            </option>
          ))}
        </select>
        <select value={filters.outletLevel} onChange={(e) => update('outletLevel', e.target.value)} className={selectClass}>
          <option value="">{t('filter.allOutlet')}</option>
          {LEVEL_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {t('filter.outletPrefix')}: {t(`enum.level.${l.value}`)}
            </option>
          ))}
        </select>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="col-span-2 md:col-span-4 lg:col-span-8 text-left text-sm text-brand-700 hover:underline"
          >
            {t('filter.clearFilters', { count: activeCount })}
          </button>
        )}
      </div>
    </div>
  );
}
