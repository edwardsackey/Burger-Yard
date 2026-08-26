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
    console.log(`\n\n📍 PLACES SIMULATION (no GOOGLE_PLACES_API_KEY set): lookup for ${lat}, ${lng}\n\n`);
    return {
      landmark: `Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      city: 'Unknown area',
    };
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
