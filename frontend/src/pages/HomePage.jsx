import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-brand-50 to-white">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 max-w-2xl">
        Antalya'da laptopunu açıp rahatça çalışabileceğin en iyi mekanları keşfet
      </h1>
      <p className="mt-4 text-gray-600 max-w-xl">
        Otel lobileri, kafeler, kütüphaneler ve coworking alanlarını internet hızı, sessizlik,
        priz durumu, kahve kalitesi ve genel puana göre karşılaştır; sana en uygun çalışma
        noktasını bul.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/mekanlar"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-brand-700"
        >
          Mekanları Keşfet
        </Link>
        <Link
          to="/harita"
          className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-md font-medium hover:border-brand-400"
        >
          Haritada Gör
        </Link>
      </div>
    </div>
  );
}
