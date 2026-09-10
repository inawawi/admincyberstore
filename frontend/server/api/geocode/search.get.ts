import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q || '').trim()

  if (!q) {
    return { results: [] }
  }

  // Skenario 1: Coba Nominatim dengan User-Agent resmi kampus BSI
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=id&limit=6&addressdetails=1`
    const data = await $fetch<any[]>(nominatimUrl, {
      headers: {
        'User-Agent': 'BsiCyberStoreApp/1.0 (cs@bsicyberstore.ac.id)',
        'Accept-Language': 'id',
      },
      timeout: 5000,
    })

    if (Array.isArray(data) && data.length > 0) {
      const formatted = data.map((item) => {
        const addr = item.address || {}
        const title = item.name || (item.display_name ? item.display_name.split(',')[0] : '')
        return {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          name: title,
          display_name: item.display_name,
          street: addr.road || addr.residential || addr.pedestrian || '',
          city: addr.city || addr.town || addr.municipality || addr.county || '',
          district: addr.subdistrict || addr.district || '',
          province: addr.state || addr.region || '',
          postal_code: addr.postcode || '',
        }
      })
      return { results: formatted }
    }
  } catch (nomErr) {
    console.warn('Nominatim server search failed, fallback to Photon:', nomErr)
  }

  // Skenario 2: Fallback ke Photon Komoot (OpenStreetMap Geocoder)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`
    const pData = await $fetch<any>(photonUrl, {
      timeout: 5000,
    })

    if (pData?.features && Array.isArray(pData.features)) {
      const formatted = pData.features.map((f: any) => {
        const p = f.properties || {}
        const coords = f.geometry?.coordinates || [0, 0]
        const title = p.name || p.street || 'Lokasi Terpilih'
        const parts = [p.street, p.district, p.city, p.state, p.postcode].filter(Boolean)
        const display = parts.length > 0 ? `${title}, ${parts.join(', ')}` : title

        return {
          lat: coords[1],
          lon: coords[0],
          name: title,
          display_name: display,
          street: p.street || p.name || '',
          city: p.city || '',
          district: p.district || '',
          province: p.state || '',
          postal_code: p.postcode || '',
        }
      })
      return { results: formatted }
    }
  } catch (photonErr) {
    console.error('Photon server search failed:', photonErr)
  }

  return { results: [] }
})
