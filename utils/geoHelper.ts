// utils/geoHelper.ts

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Hasil dalam Meter
};

export const calculateETA = (distanceInMeters: number) => {
  // Asumsi kecepatan rata-rata motor di Jogja: 40 km/jam
  const speedKmh = 40;
  const distanceKm = distanceInMeters / 1000;
  const timeHours = distanceKm / speedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);

  if (timeMinutes < 1) return "1 min";
  if (timeMinutes > 60) {
    const hours = Math.floor(timeMinutes / 60);
    const mins = timeMinutes % 60;
    return `${hours} jam ${mins} mnt`;
  }
  return `${timeMinutes} mnt`;
};

// Mock Address Generator (Biar kayak Google Maps tanpa nembak API beneran yg lemot)
export const getMockAddress = (lat: number, lng: number) => {
  const streets = ["Jl. Kaliurang", "Jl. Gejayan", "Jl. Malioboro", "Jl. Magelang", "Ringroad Utara", "Jl. Solo"];
  const randomStreet = streets[Math.floor(Math.abs(lat * 1000) % streets.length)];
  const number = Math.floor(Math.abs(lng * 1000) % 200) + 1;
  return `${randomStreet} No. ${number}, Yogyakarta`;
};