import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = parseFloat(String(query.lat || '0'))
  const lng = parseFloat(String(query.lng || query.lon || '0'))

  if (!lat || !lng) {
    return { address: null }
  }

  // Skenario 1: Nominatim Reverse dengan User-Agent resmi
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    const data = await $fetch<any>(nominatimUrl, {
      headers: {
        'User-Agent': 'BsiCyberStoreApp/1.0 (cs@bsicyberstore.ac.id)',
        'Accept-Language': 'id',
      },
      timeout: 5000,
    })

    if (data?.address) {
      const addr = data.address
      const road = addr.road || addr.residential || addr.pedestrian || addr.suburb || ''
      const village = addr.village || addr.neighbourhood || addr.quarter || ''
      const district = addr.subdistrict || addr.district || addr.city_district || ''
      const city = addr.city || addr.town || addr.municipality || addr.county || ''
      const province = addr.state || addr.region || ''
      const postalCode = addr.postcode || ''

      const cleanAddressParts = [road, village, district].filter(Boolean)
      const streetAddress = cleanAddressParts.length > 0 ? cleanAddressParts.join(', ') : data.display_name.split(',').slice(0, 2).join(',')

      return {
        address: {
          latitude: lat,
          longitude: lng,
          address: streetAddress,
          city,
          province,
          postal_code: postalCode,
          district,
          display_name: data.display_name,
        }
      }
    }
  } catch (nomErr) {
    console.warn('Nominatim reverse failed, fallback to Photon:', nomErr)
  }

  // Skenario 2: Photon Reverse
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`
    const pData = await $fetch<any>(photonUrl, {
      timeout: 5000,
    })

    if (pData?.features && pData.features.length > 0) {
      const p = pData.features[0].properties || {}
      const road = p.street || p.name || ''
      const district = p.district || ''
      const city = p.city || ''
      const province = p.state || ''
      const postalCode = p.postcode || ''

      const cleanParts = [road, district].filter(Boolean)
      const streetAddress = cleanParts.length > 0 ? cleanParts.join(', ') : (p.name || 'Alamat Terpilih')

      return {
        address: {
          latitude: lat,
          longitude: lng,
          address: streetAddress,
          city,
          province,
          postal_code: postalCode,
          district,
        }
      }
    }
  } catch (photonErr) {
    console.error('Photon reverse failed:', photonErr)
  }

  return { address: null }
})
