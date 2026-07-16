import { useEffect, useState } from 'react';
import apiClient from '../api/client';

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']; // JS Date.getDay() sırasıyla aynı (0=Paz)
const DAY_LABELS_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function cellColor(cell) {
  if (!cell || cell.sampleCount === 0) return 'bg-gray-100';
  if (cell.score < 0.5) return 'bg-brand-100';
  if (cell.score < 1.0) return 'bg-brand-300';
  if (cell.score < 1.5) return 'bg-brand-500';
  return 'bg-brand-700';
}

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

function formatWindow(w) {
  return `${DAY_LABELS_FULL[w.day]} günleri ${formatHour(w.startHour)}–${formatHour(w.endHour)} arasında genellikle yoğun.`;
}

export default function OccupancyForecast({ placeId }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverCell, setHoverCell] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/occupancy/${placeId}/forecast`)
      .then(({ data }) => setForecast(data))
      .finally(() => setLoading(false));
  }, [placeId]);

  if (loading) return null;
  if (!forecast) return null;

  const hasData = forecast.heatmap.some((c) => c.sampleCount > 0);
  if (!hasData) return null;

  const grid = Array.from({ length: 7 }, (_, day) =>
    HOURS.map((hour) => forecast.heatmap.find((c) => c.day === day && c.hour === hour))
  );

  return (
    <div className="bg-gray-50 rounded-xl p-3 mt-3">
      <p className="text-sm font-medium text-gray-900">Tahmini Yoğunluk</p>

      {forecast.predictions.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {forecast.predictions.map((w) => (
            <li key={`${w.day}-${w.startHour}`} className="text-xs text-gray-600">
              📈 {formatWindow(w)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex" style={{ paddingLeft: 28 }}>
            {HOURS.map((h) => (
              <div key={h} className="text-[9px] text-gray-400 text-center" style={{ width: 12 }}>
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {grid.map((row, day) => (
            <div key={day} className="flex items-center">
              <div className="text-[10px] text-gray-500" style={{ width: 28 }}>
                {DAY_LABELS[day]}
              </div>
              {row.map((cell, hour) => (
                <div
                  key={hour}
                  onMouseEnter={() => setHoverCell({ day, hour, cell })}
                  onMouseLeave={() => setHoverCell(null)}
                  className={`${cellColor(cell)} rounded-[2px]`}
                  style={{ width: 10, height: 10, margin: 1 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-gray-400">Az</span>
        <div className="flex gap-0.5">
          {['bg-gray-100', 'bg-brand-100', 'bg-brand-300', 'bg-brand-500', 'bg-brand-700'].map((c) => (
            <div key={c} className={`${c} rounded-[2px]`} style={{ width: 10, height: 10 }} />
          ))}
        </div>
        <span className="text-[10px] text-gray-400">Çok yoğun</span>
      </div>

      {hoverCell && (
        <p className="mt-1.5 text-xs text-gray-600">
          {DAY_LABELS_FULL[hoverCell.day]} {formatHour(hoverCell.hour)}:{' '}
          {hoverCell.cell?.sampleCount
            ? `${hoverCell.cell.sampleCount} bildirim, genelde ${
                { LOW: 'sakin', MEDIUM: 'orta yoğun', HIGH: 'kalabalık' }[hoverCell.cell.level]
              }`
            : 'yeterli veri yok'}
        </p>
      )}
    </div>
  );
}
