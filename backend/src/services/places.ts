const apiKey = process.env.GOOGLE_PLACES_API_KEY;

export type NearbyLandmark = {
  landmark: string;
  city: string;
};

/**
 * Given a point, returns the nearest notable place (for the checkout
 * landmark field) and the surrounding locality (city/town).
 */
export async function getNearbyLandmark(lat: number, lng: number): Promise<NearbyLandmark> {
  if (!apiKey) {
    return getNearbyLandmarkFromOsm(lat, lng);
  }

  const [placesRes, geocodeRes] = await Promise.all([
    fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&key=${apiKey}`,
    ),
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
    ),
  ]);

  const placesData = await placesRes.json();
  const geocodeData = await geocodeRes.json();

  if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
    throw new Error(`Places lookup failed: ${placesData.status}`);
  }
  if (geocodeData.status !== 'OK' && geocodeData.status !== 'ZERO_RESULTS') {
    throw new Error(`Geocode lookup failed: ${geocodeData.status}`);
  }

  const nearestPlace = placesData.results?.[0]?.name;

  const addressComponents = geocodeData.results?.[0]?.address_components ?? [];
  const locality = addressComponents.find((c: any) => c.types.includes('locality'));
  const fallbackArea = addressComponents.find((c: any) =>
    c.types.includes('administrative_area_level_2'),
  );
  const city = locality?.long_name ?? fallbackArea?.long_name ?? 'Unknown area';

  return {
    landmark: nearestPlace ?? 'Near the pinned location',
    city,
  };
}

/**
 * Free fallback — no key/account/billing needed. OpenStreetMap's Nominatim
 * has no "nearest notable place" search like Google Places, so the nearest
 * named feature from reverse geocoding (amenity/shop/building/road) stands
 * in for "landmark". Good enough for dev/testing; Google is still what
 * production should run on (set GOOGLE_PLACES_API_KEY to use it).
 */
async function getNearbyLandmarkFromOsm(lat: number, lng: number): Promise<NearbyLandmark> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      // Nominatim's usage policy requires an identifying User-Agent for
      // unauthenticated requests — no API key, but this is still required.
      { headers: { 'User-Agent': 'BurgerYard-Dev/1.0' } },
    );
    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
    const data = await res.json();
    const address = data.address ?? {};

    const landmark =
      data.name ||
      address.amenity ||
      address.shop ||
      address.building ||
      address.road ||
      data.display_name?.split(',')[0] ||
      `Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    const city = address.city || address.town || address.village || address.county || 'Unknown area';

    return { landmark, city };
  } catch (error) {
    console.error('OSM landmark lookup failed:', error);
    return {
      landmark: `Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      city: 'Unknown area',
    };
  }
}
