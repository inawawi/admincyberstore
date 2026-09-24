import { defineEventHandler, getQuery } from 'h3'

interface RegionItem {
  id: string
  name: string
  province_id?: string
  regency_id?: string
}

// In-memory cache to prevent redundant HTTP calls
let cachedProvinces: RegionItem[] | null = null
const cachedRegenciesByProv = new Map<string, RegionItem[]>()
const cachedDistrictsByReg = new Map<string, string[]>()

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|adm\.)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawProvince = String(query.province || '').trim()
  const rawCity = String(query.city || '').trim()

  if (!rawCity) {
    return { districts: [] }
  }

  try {
    // 1. Fetch & cache provinces list
    if (!cachedProvinces) {
      cachedProvinces = await $fetch<RegionItem[]>(
        'https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json',
        { timeout: 7000 }
      )
    }

    // 2. Identify province
    let matchedProv: RegionItem | undefined
    if (rawProvince && cachedProvinces) {
      const cleanProv = cleanName(rawProvince)
      matchedProv = cachedProvinces.find((p) => {
        const pClean = cleanName(p.name)
        return pClean.includes(cleanProv) || cleanProv.includes(pClean)
      })
    }

    // 3. Find regency
    let targetRegency: RegionItem | undefined

    if (matchedProv) {
      if (!cachedRegenciesByProv.has(matchedProv.id)) {
        const regList = await $fetch<RegionItem[]>(
          `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${matchedProv.id}.json`,
          { timeout: 7000 }
        )
        cachedRegenciesByProv.set(matchedProv.id, regList || [])
      }

      const regencies = cachedRegenciesByProv.get(matchedProv.id) || []
      const cleanTargetCity = cleanName(rawCity)
      const isKota = /kota/i.test(rawCity)
      const isKab = /kabupaten/i.test(rawCity)

      // First try matching type (Kota vs Kab) + name
      targetRegency = regencies.find((r) => {
        const rClean = cleanName(r.name)
        const nameMatches = rClean === cleanTargetCity || rClean.includes(cleanTargetCity) || cleanTargetCity.includes(rClean)
        if (!nameMatches) return false
        if (isKota && /kota/i.test(r.name)) return true
        if (isKab && /kabupaten/i.test(r.name)) return true
        return true
      })

      if (!targetRegency) {
        targetRegency = regencies.find((r) => {
          const rClean = cleanName(r.name)
          return rClean.includes(cleanTargetCity) || cleanTargetCity.includes(rClean)
        })
      }
    } else if (cachedProvinces) {
      // If province not specified, search across regencies in provinces
      const cleanTargetCity = cleanName(rawCity)
      for (const p of cachedProvinces) {
        if (!cachedRegenciesByProv.has(p.id)) {
          try {
            const regList = await $fetch<RegionItem[]>(
              `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${p.id}.json`,
              { timeout: 5000 }
            )
            cachedRegenciesByProv.set(p.id, regList || [])
          } catch {
            continue
          }
        }
        const regencies = cachedRegenciesByProv.get(p.id) || []
        const found = regencies.find((r) => {
          const rClean = cleanName(r.name)
          return rClean === cleanTargetCity || rClean.includes(cleanTargetCity) || cleanTargetCity.includes(rClean)
        })
        if (found) {
          targetRegency = found
          break
        }
      }
    }

    if (!targetRegency) {
      return { districts: [] }
    }

    // 4. Fetch districts for regency
    if (!cachedDistrictsByReg.has(targetRegency.id)) {
      const rawDistricts = await $fetch<RegionItem[]>(
        `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${targetRegency.id}.json`,
        { timeout: 7000 }
      )
      const districtNames = (rawDistricts || [])
        .map((d) => toTitleCase(d.name.trim()))
        .sort((a, b) => a.localeCompare(b, 'id'))

      cachedDistrictsByReg.set(targetRegency.id, districtNames)
    }

    const result = cachedDistrictsByReg.get(targetRegency.id) || []
    return { districts: result }
  } catch (err: any) {
    console.warn('Failed to fetch districts for', rawCity, err?.message)
    return { districts: [] }
  }
})
