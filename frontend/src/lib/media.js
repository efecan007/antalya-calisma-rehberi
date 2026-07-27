const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

// Backend'in döndürdüğü yüklenmiş dosya yolları (/uploads/...) göreli olduğu için,
// frontend farklı bir origin'de (ör. Vercel) barındırıldığında backend origin'iyle
// birleştirilmesi gerekir. Zaten mutlak bir URL ise (ör. Google/LinkedIn profil
// fotoğrafı) olduğu gibi döner.
export function resolveUploadUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}
