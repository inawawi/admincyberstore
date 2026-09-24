/**
 * Data Resmi 38 Provinsi & Kota/Kabupaten Indonesia
 * Dilengkapi koordinat default untuk animasi peta instan.
 */

export interface ProvinceData {
  name: string
  lat: number
  lng: number
  cities: string[]
}

export const INDONESIA_REGIONS: ProvinceData[] = [
  {
    name: 'DKI Jakarta',
    lat: -6.2088,
    lng: 106.8456,
    cities: [
      'Jakarta Pusat',
      'Jakarta Selatan',
      'Jakarta Barat',
      'Jakarta Timur',
      'Jakarta Utara',
      'Kepulauan Seribu',
    ],
  },
  {
    name: 'Jawa Barat',
    lat: -6.9175,
    lng: 107.6191,
    cities: [
      'Kota Bandung',
      'Kota Bekasi',
      'Kota Bogor',
      'Kota Depok',
      'Kota Cimahi',
      'Kota Cirebon',
      'Kota Sukabumi',
      'Kota Tasikmalaya',
      'Kota Banjar',
      'Kabupaten Bandung',
      'Kabupaten Bandung Barat',
      'Kabupaten Bekasi',
      'Kabupaten Bogor',
      'Kabupaten Ciamis',
      'Kabupaten Cianjur',
      'Kabupaten Cirebon',
      'Kabupaten Garut',
      'Kabupaten Indramayu',
      'Kabupaten Karawang',
      'Kabupaten Kuningan',
      'Kabupaten Majalengka',
      'Kabupaten Pangandaran',
      'Kabupaten Purwakarta',
      'Kabupaten Subang',
      'Kabupaten Sukabumi',
      'Kabupaten Sumedang',
      'Kabupaten Tasikmalaya',
    ],
  },
  {
    name: 'Banten',
    lat: -6.12,
    lng: 106.1503,
    cities: [
      'Kota Tangerang',
      'Kota Tangerang Selatan',
      'Kota Serang',
      'Kota Cilegon',
      'Kabupaten Tangerang',
      'Kabupaten Serang',
      'Kabupaten Lebak',
      'Kabupaten Pandeglang',
    ],
  },
  {
    name: 'Jawa Tengah',
    lat: -6.9667,
    lng: 110.4167,
    cities: [
      'Kota Semarang',
      'Kota Surakarta (Solo)',
      'Kota Magelang',
      'Kota Pekalongan',
      'Kota Salatiga',
      'Kota Tegal',
      'Kabupaten Banyumas',
      'Kabupaten Batang',
      'Kabupaten Blora',
      'Kabupaten Boyolali',
      'Kabupaten Brebes',
      'Kabupaten Cilacap',
      'Kabupaten Demak',
      'Kabupaten Grobogan',
      'Kabupaten Jepara',
      'Kabupaten Karanganyar',
      'Kabupaten Kebumen',
      'Kabupaten Kendal',
      'Kabupaten Klaten',
      'Kabupaten Kudus',
      'Kabupaten Magelang',
      'Kabupaten Pati',
      'Kabupaten Pekalongan',
      'Kabupaten Pemalang',
      'Kabupaten Purbalingga',
      'Kabupaten Purworejo',
      'Kabupaten Rembang',
      'Kabupaten Semarang',
      'Kabupaten Sragen',
      'Kabupaten Sukoharjo',
      'Kabupaten Tegal',
      'Kabupaten Temanggung',
      'Kabupaten Wonogiri',
      'Kabupaten Wonosobo',
    ],
  },
  {
    name: 'DI Yogyakarta',
    lat: -7.7956,
    lng: 110.3695,
    cities: [
      'Kota Yogyakarta',
      'Kabupaten Sleman',
      'Kabupaten Bantul',
      'Kabupaten Gunungkidul',
      'Kabupaten Kulon Progo',
    ],
  },
  {
    name: 'Jawa Timur',
    lat: -7.2575,
    lng: 112.7521,
    cities: [
      'Kota Surabaya',
      'Kota Malang',
      'Kota Batu',
      'Kota Kediri',
      'Kota Blitar',
      'Kota Madiun',
      'Kota Mojokerto',
      'Kota Pasuruan',
      'Kota Probolinggo',
      'Kabupaten Sidoarjo',
      'Kabupaten Gresik',
      'Kabupaten Banyuwangi',
      'Kabupaten Jember',
      'Kabupaten Bojonegoro',
      'Kabupaten Tuban',
      'Kabupaten Lamongan',
      'Kabupaten Pasuruan',
      'Kabupaten Mojokerto',
      'Kabupaten Malang',
      'Kabupaten Kediri',
      'Kabupaten Blitar',
      'Kabupaten Jombang',
      'Kabupaten Lumajang',
      'Kabupaten Madiun',
      'Kabupaten Magetan',
      'Kabupaten Nganjuk',
      'Kabupaten Ngawi',
      'Kabupaten Pacitan',
      'Kabupaten Pamekasan',
      'Kabupaten Ponorogo',
      'Kabupaten Probolinggo',
      'Kabupaten Sampang',
      'Kabupaten Situbondo',
      'Kabupaten Sumenep',
      'Kabupaten Trenggalek',
      'Kabupaten Tulungagung',
      'Kabupaten Bangkalan',
    ],
  },
  {
    name: 'Bali',
    lat: -8.6705,
    lng: 115.2126,
    cities: [
      'Kota Denpasar',
      'Kabupaten Badung',
      'Kabupaten Bangli',
      'Kabupaten Buleleng',
      'Kabupaten Gianyar',
      'Kabupaten Jembrana',
      'Kabupaten Karangasem',
      'Kabupaten Klungkung',
      'Kabupaten Tabanan',
    ],
  },
  {
    name: 'Nusa Tenggara Barat (NTB)',
    lat: -8.5833,
    lng: 116.1167,
    cities: [
      'Kota Mataram',
      'Kota Bima',
      'Kabupaten Lombok Barat',
      'Kabupaten Lombok Tengah',
      'Kabupaten Lombok Timur',
      'Kabupaten Lombok Utara',
      'Kabupaten Sumbawa',
      'Kabupaten Sumbawa Barat',
      'Kabupaten Bima',
      'Kabupaten Dompu',
    ],
  },
  {
    name: 'Nusa Tenggara Timur (NTT)',
    lat: -10.1772,
    lng: 123.607,
    cities: [
      'Kota Kupang',
      'Kabupaten Alor',
      'Kabupaten Belu',
      'Kabupaten Ende',
      'Kabupaten Flores Timur',
      'Kabupaten Kupang',
      'Kabupaten Manggarai',
      'Kabupaten Manggarai Barat',
      'Kabupaten Manggarai Timur',
      'Kabupaten Ngada',
      'Kabupaten Rote Ndao',
      'Kabupaten Sikka',
      'Kabupaten Sumba Barat',
      'Kabupaten Sumba Timur',
      'Kabupaten Timor Tengah Selatan',
      'Kabupaten Timor Tengah Utara',
    ],
  },
  {
    name: 'Sumatera Utara',
    lat: 3.5952,
    lng: 98.6722,
    cities: [
      'Kota Medan',
      'Kota Binjai',
      'Kota Pematang Siantar',
      'Kota Tanjung Balai',
      'Kota Tebing Tinggi',
      'Kota Sibolga',
      'Kota Padang Sidempuan',
      'Kota Gunungsitoli',
      'Kabupaten Deli Serdang',
      'Kabupaten Karo',
      'Kabupaten Langkat',
      'Kabupaten Simalungun',
      'Kabupaten Asahan',
      'Kabupaten Batubara',
      'Kabupaten Dairi',
      'Kabupaten Humbang Hasundutan',
      'Kabupaten Labuhanbatu',
      'Kabupaten Mandailing Natal',
      'Kabupaten Nias',
      'Kabupaten Tapanuli Selatan',
      'Kabupaten Tapanuli Tengah',
      'Kabupaten Tapanuli Utara',
      'Kabupaten Toba Samosir',
    ],
  },
  {
    name: 'Sumatera Barat',
    lat: -0.9471,
    lng: 100.4172,
    cities: [
      'Kota Padang',
      'Kota Bukittinggi',
      'Kota Payakumbuh',
      'Kota Pariaman',
      'Kota Solok',
      'Kota Sawahlunto',
      'Kota Padang Panjang',
      'Kabupaten Agam',
      'Kabupaten Lima Puluh Kota',
      'Kabupaten Padang Pariaman',
      'Kabupaten Pasaman',
      'Kabupaten Pesisir Selatan',
      'Kabupaten Sijunjung',
      'Kabupaten Tanah Datar',
      'Kabupaten Kepulauan Mentawai',
    ],
  },
  {
    name: 'Riau',
    lat: 0.5071,
    lng: 101.4478,
    cities: [
      'Kota Pekanbaru',
      'Kota Dumai',
      'Kabupaten Bengkalis',
      'Kabupaten Indragiri Hilir',
      'Kabupaten Indragiri Hulu',
      'Kabupaten Kampar',
      'Kabupaten Kuantan Singingi',
      'Kabupaten Pelalawan',
      'Kabupaten Rokan Hilir',
      'Kabupaten Rokan Hulu',
      'Kabupaten Siak',
      'Kabupaten Kepulauan Meranti',
    ],
  },
  {
    name: 'Kepulauan Riau',
    lat: 1.1301,
    lng: 104.0529,
    cities: [
      'Kota Batam',
      'Kota Tanjung Pinang',
      'Kabupaten Bintan',
      'Kabupaten Karimun',
      'Kabupaten Lingga',
      'Kabupaten Natuna',
      'Kabupaten Kepulauan Anambas',
    ],
  },
  {
    name: 'Sumatera Selatan',
    lat: -2.9761,
    lng: 104.7754,
    cities: [
      'Kota Palembang',
      'Kota Lubuklinggau',
      'Kota Pagar Alam',
      'Kota Prabumulih',
      'Kabupaten Banyuasin',
      'Kabupaten Empat Lawang',
      'Kabupaten Lahat',
      'Kabupaten Muara Enim',
      'Kabupaten Musi Banyuasin',
      'Kabupaten Musi Rawas',
      'Kabupaten Ogan Ilir',
      'Kabupaten Ogan Komering Ilir',
      'Kabupaten Ogan Komering Ulu',
    ],
  },
  {
    name: 'Lampung',
    lat: -5.45,
    lng: 105.2667,
    cities: [
      'Kota Bandar Lampung',
      'Kota Metro',
      'Kabupaten Lampung Barat',
      'Kabupaten Lampung Selatan',
      'Kabupaten Lampung Tengah',
      'Kabupaten Lampung Timur',
      'Kabupaten Lampung Utara',
      'Kabupaten Mesuji',
      'Kabupaten Pesawaran',
      'Kabupaten Pesisir Barat',
      'Kabupaten Pringsewu',
      'Kabupaten Tanggamus',
      'Kabupaten Tulang Bawang',
      'Kabupaten Way Kanan',
    ],
  },
  {
    name: 'Aceh',
    lat: 5.5483,
    lng: 95.3238,
    cities: [
      'Kota Banda Aceh',
      'Kota Sabang',
      'Kota Lhokseumawe',
      'Kota Langsa',
      'Kota Subulussalam',
      'Kabupaten Aceh Besar',
      'Kabupaten Aceh Barat',
      'Kabupaten Aceh Selatan',
      'Kabupaten Aceh Timur',
      'Kabupaten Aceh Utara',
      'Kabupaten Aceh Tengah',
      'Kabupaten Bireuen',
      'Kabupaten Pidie',
      'Kabupaten Pidie Jaya',
      'Kabupaten Simeulue',
    ],
  },
  {
    name: 'Jambi',
    lat: -1.61,
    lng: 103.61,
    cities: [
      'Kota Jambi',
      'Kota Sungai Penuh',
      'Kabupaten Batanghari',
      'Kabupaten Bungo',
      'Kabupaten Kerinci',
      'Kabupaten Merangin',
      'Kabupaten Muaro Jambi',
      'Kabupaten Sarolangun',
      'Kabupaten Tanjung Jabung Barat',
      'Kabupaten Tanjung Jabung Timur',
      'Kabupaten Tebo',
    ],
  },
  {
    name: 'Bengkulu',
    lat: -3.8004,
    lng: 102.2655,
    cities: [
      'Kota Bengkulu',
      'Kabupaten Bengkulu Selatan',
      'Kabupaten Bengkulu Tengah',
      'Kabupaten Bengkulu Utara',
      'Kabupaten Kaur',
      'Kabupaten Kepahiang',
      'Kabupaten Lebong',
      'Kabupaten Mukomuko',
      'Kabupaten Rejang Lebong',
      'Kabupaten Seluma',
    ],
  },
  {
    name: 'Kepulauan Bangka Belitung',
    lat: -2.1333,
    lng: 106.1167,
    cities: [
      'Kota Pangkal Pinang',
      'Kabupaten Bangka',
      'Kabupaten Bangka Barat',
      'Kabupaten Bangka Selatan',
      'Kabupaten Bangka Tengah',
      'Kabupaten Belitung',
      'Kabupaten Belitung Timur',
    ],
  },
  {
    name: 'Kalimantan Barat',
    lat: -0.0263,
    lng: 109.3425,
    cities: [
      'Kota Pontianak',
      'Kota Singkawang',
      'Kabupaten Bengkayang',
      'Kabupaten Kapuas Hulu',
      'Kabupaten Ketapang',
      'Kabupaten Kubu Raya',
      'Kabupaten Landak',
      'Kabupaten Melawi',
      'Kabupaten Mempawah',
      'Kabupaten Sambas',
      'Kabupaten Sanggau',
      'Kabupaten Sintang',
    ],
  },
  {
    name: 'Kalimantan Selatan',
    lat: -3.3194,
    lng: 114.5908,
    cities: [
      'Kota Banjarmasin',
      'Kota Banjarbaru',
      'Kabupaten Balangan',
      'Kabupaten Banjar',
      'Kabupaten Barito Kuala',
      'Kabupaten Hulu Sungai Selatan',
      'Kabupaten Hulu Sungai Tengah',
      'Kabupaten Hulu Sungai Utara',
      'Kabupaten Kotabaru',
      'Kabupaten Tabalong',
      'Kabupaten Tanah Bumbu',
      'Kabupaten Tanah Laut',
      'Kabupaten Tapin',
    ],
  },
  {
    name: 'Kalimantan Tengah',
    lat: -2.21,
    lng: 113.92,
    cities: [
      'Kota Palangka Raya',
      'Kabupaten Barito Selatan',
      'Kabupaten Barito Timur',
      'Kabupaten Barito Utara',
      'Kabupaten Gunung Mas',
      'Kabupaten Kapuas',
      'Kabupaten Katingan',
      'Kabupaten Kotawaringin Barat',
      'Kabupaten Kotawaringin Timur',
      'Kabupaten Lamandau',
      'Kabupaten Murung Raya',
      'Kabupaten Pulang Pisau',
      'Kabupaten Seruyan',
      'Kabupaten Sukamara',
    ],
  },
  {
    name: 'Kalimantan Timur',
    lat: -0.5022,
    lng: 117.1536,
    cities: [
      'Kota Samarinda',
      'Kota Balikpapan',
      'Kota Bontang',
      'Kabupaten Berau',
      'Kabupaten Kutai Barat',
      'Kabupaten Kutai Kartanegara',
      'Kabupaten Kutai Timur',
      'Kabupaten Mahakam Ulu',
      'Kabupaten Paser',
      'Kabupaten Penajam Paser Utara',
    ],
  },
  {
    name: 'Kalimantan Utara',
    lat: 3.3271,
    lng: 117.5786,
    cities: [
      'Kota Tarakan',
      'Kabupaten Bulungan',
      'Kabupaten Malinau',
      'Kabupaten Nunukan',
      'Kabupaten Tana Tidung',
    ],
  },
  {
    name: 'Sulawesi Selatan',
    lat: -5.1477,
    lng: 119.4327,
    cities: [
      'Kota Makassar',
      'Kota Parepare',
      'Kota Palopo',
      'Kabupaten Bantaeng',
      'Kabupaten Barru',
      'Kabupaten Bone',
      'Kabupaten Bulukumba',
      'Kabupaten Enrekang',
      'Kabupaten Gowa',
      'Kabupaten Jeneponto',
      'Kabupaten Luwu',
      'Kabupaten Luwu Timur',
      'Kabupaten Luwu Utara',
      'Kabupaten Maros',
      'Kabupaten Pangkajene dan Kepulauan',
      'Kabupaten Pinrang',
      'Kabupaten Selayar',
      'Kabupaten Sidenreng Rappang',
      'Kabupaten Sinjai',
      'Kabupaten Soppeng',
      'Kabupaten Takalar',
      'Kabupaten Tana Toraja',
      'Kabupaten Toraja Utara',
      'Kabupaten Wajo',
    ],
  },
  {
    name: 'Sulawesi Utara',
    lat: 1.4748,
    lng: 124.8428,
    cities: [
      'Kota Manado',
      'Kota Bitung',
      'Kota Tomohon',
      'Kota Kotamobagu',
      'Kabupaten Bolaang Mongondow',
      'Kabupaten Kepulauan Sangihe',
      'Kabupaten Kepulauan Talaud',
      'Kabupaten Minahasa',
      'Kabupaten Minahasa Selatan',
      'Kabupaten Minahasa Tenggara',
      'Kabupaten Minahasa Utara',
    ],
  },
  {
    name: 'Sulawesi Tengah',
    lat: -0.9,
    lng: 119.8333,
    cities: [
      'Kota Palu',
      'Kabupaten Banggai',
      'Kabupaten Banggai Kepulauan',
      'Kabupaten Buol',
      'Kabupaten Donggala',
      'Kabupaten Morowali',
      'Kabupaten Morowali Utara',
      'Kabupaten Parigi Moutong',
      'Kabupaten Poso',
      'Kabupaten Sigi',
      'Kabupaten Tojo Una-Una',
      'Kabupaten Tolitoli',
    ],
  },
  {
    name: 'Sulawesi Tenggara',
    lat: -3.9972,
    lng: 122.5128,
    cities: [
      'Kota Kendari',
      'Kota Baubau',
      'Kabupaten Bombana',
      'Kabupaten Buton',
      'Kabupaten Kolaka',
      'Kabupaten Kolaka Utara',
      'Kabupaten Konawe',
      'Kabupaten Konawe Selatan',
      'Kabupaten Muna',
      'Kabupaten Wakatobi',
    ],
  },
  {
    name: 'Sulawesi Barat',
    lat: -2.677,
    lng: 118.892,
    cities: [
      'Kabupaten Mamuju',
      'Kabupaten Majene',
      'Kabupaten Mamasa',
      'Kabupaten Mamuju Tengah',
      'Kabupaten Pasangkayu',
      'Kabupaten Polewali Mandar',
    ],
  },
  {
    name: 'Gorontalo',
    lat: 0.5435,
    lng: 123.0568,
    cities: [
      'Kota Gorontalo',
      'Kabupaten Boalemo',
      'Kabupaten Bone Bolango',
      'Kabupaten Gorontalo',
      'Kabupaten Gorontalo Utara',
      'Kabupaten Pohuwato',
    ],
  },
  {
    name: 'Maluku',
    lat: -3.6954,
    lng: 128.1814,
    cities: [
      'Kota Ambon',
      'Kota Tual',
      'Kabupaten Buru',
      'Kabupaten Buru Selatan',
      'Kabupaten Kepulauan Aru',
      'Kabupaten Maluku Barat Daya',
      'Kabupaten Maluku Tengah',
      'Kabupaten Maluku Tenggara',
      'Kabupaten Kepulauan Tanimbar',
      'Kabupaten Seram Bagian Barat',
      'Kabupaten Seram Bagian Timur',
    ],
  },
  {
    name: 'Maluku Utara',
    lat: 0.7893,
    lng: 127.361,
    cities: [
      'Kota Ternate',
      'Kota Tidore Kepulauan',
      'Kabupaten Halmahera Barat',
      'Kabupaten Halmahera Tengah',
      'Kabupaten Halmahera Timur',
      'Kabupaten Halmahera Selatan',
      'Kabupaten Halmahera Utara',
      'Kabupaten Kepulauan Sula',
      'Kabupaten Pulau Morotai',
    ],
  },
  {
    name: 'Papua',
    lat: -2.5337,
    lng: 140.7181,
    cities: [
      'Kota Jayapura',
      'Kabupaten Jayapura',
      'Kabupaten Keerom',
      'Kabupaten Sarmi',
      'Kabupaten Mamberamo Raya',
      'Kabupaten Biak Numfor',
      'Kabupaten Kepulauan Yapen',
      'Kabupaten Waropen',
    ],
  },
  {
    name: 'Papua Barat',
    lat: -0.8615,
    lng: 134.062,
    cities: [
      'Kabupaten Manokwari',
      'Kabupaten Fakfak',
      'Kabupaten Kaimana',
      'Kabupaten Teluk Bintuni',
      'Kabupaten Teluk Wondama',
      'Kabupaten Manokwari Selatan',
      'Kabupaten Pegunungan Arfak',
    ],
  },
  {
    name: 'Papua Barat Daya',
    lat: -0.8762,
    lng: 131.2558,
    cities: [
      'Kota Sorong',
      'Kabupaten Sorong',
      'Kabupaten Sorong Selatan',
      'Kabupaten Raja Ampat',
      'Kabupaten Tambrauw',
      'Kabupaten Maybrat',
    ],
  },
  {
    name: 'Papua Selatan',
    lat: -8.4932,
    lng: 140.4018,
    cities: [
      'Kabupaten Merauke',
      'Kabupaten Boven Digoel',
      'Kabupaten Mappi',
      'Kabupaten Asmat',
    ],
  },
  {
    name: 'Papua Tengah',
    lat: -3.3667,
    lng: 135.4833,
    cities: [
      'Kabupaten Nabire',
      'Kabupaten Mimika',
      'Kabupaten Puncak Jaya',
      'Kabupaten Paniai',
      'Kabupaten Puncak',
      'Kabupaten Dogiyai',
      'Kabupaten Intan Jaya',
      'Kabupaten Deiyai',
    ],
  },
  {
    name: 'Papua Pegunungan',
    lat: -4.0833,
    lng: 138.9333,
    cities: [
      'Kabupaten Jayawijaya',
      'Kabupaten Pegunungan Bintang',
      'Kabupaten Yahukimo',
      'Kabupaten Tolikara',
      'Kabupaten Mamberamo Tengah',
      'Kabupaten Yalimo',
      'Kabupaten Lanny Jaya',
      'Kabupaten Nduga',
    ],
  },
]

/**
 * Daftar nama provinsi Indonesia terurut A-Z
 */
export function getProvinceNames(): string[] {
  return INDONESIA_REGIONS.map((p) => p.name).sort((a, b) => a.localeCompare(b))
}

/**
 * Mengambil daftar kota/kabupaten berdasarkan nama provinsi
 */
export function getCitiesForProvince(provinceName?: string | null): string[] {
  if (!provinceName) return []
  const norm = normalizeProvinceName(provinceName)
  const found = INDONESIA_REGIONS.find(
    (p) => p.name.toLowerCase() === norm.toLowerCase()
  )
  return found ? [...found.cities].sort((a, b) => a.localeCompare(b)) : []
}

/**
 * Mengambil koordinat pusat default provinsi (untuk animasi pan peta)
 */
export function getProvinceCoordinates(
  provinceName?: string | null
): { lat: number; lng: number } | null {
  if (!provinceName) return null
  const norm = normalizeProvinceName(provinceName)
  const found = INDONESIA_REGIONS.find(
    (p) => p.name.toLowerCase() === norm.toLowerCase()
  )
  return found ? { lat: found.lat, lng: found.lng } : null
}

/**
 * Normalisasi nama provinsi dari geocoding balik (OSM/Nominatim/Photon)
 * Contoh: "Daerah Khusus Ibukota Jakarta" -> "DKI Jakarta"
 */
export function normalizeProvinceName(rawName?: string | null): string {
  if (!rawName) return ''
  const trimmed = rawName.trim()
  const lower = trimmed.toLowerCase()

  if (lower.includes('jakarta') || lower.includes('dki')) return 'DKI Jakarta'
  if (lower.includes('yogyakarta') || lower.includes('jogja')) return 'DI Yogyakarta'
  if (lower.includes('aceh')) return 'Aceh'
  if (lower.includes('bangka')) return 'Kepulauan Bangka Belitung'
  if (lower.includes('riau') && lower.includes('kepulauan')) return 'Kepulauan Riau'
  if (lower.includes('riau')) return 'Riau'
  if (lower.includes('jawa barat')) return 'Jawa Barat'
  if (lower.includes('jawa tengah')) return 'Jawa Tengah'
  if (lower.includes('jawa timur')) return 'Jawa Timur'
  if (lower.includes('banten')) return 'Banten'
  if (lower.includes('bali')) return 'Bali'
  if (lower.includes('nusa tenggara barat') || lower.includes('ntb'))
    return 'Nusa Tenggara Barat (NTB)'
  if (lower.includes('nusa tenggara timur') || lower.includes('ntt'))
    return 'Nusa Tenggara Timur (NTT)'
  if (lower.includes('kalimantan barat')) return 'Kalimantan Barat'
  if (lower.includes('kalimantan selatan')) return 'Kalimantan Selatan'
  if (lower.includes('kalimantan tengah')) return 'Kalimantan Tengah'
  if (lower.includes('kalimantan timur')) return 'Kalimantan Timur'
  if (lower.includes('kalimantan utara')) return 'Kalimantan Utara'
  if (lower.includes('sulawesi utara')) return 'Sulawesi Utara'
  if (lower.includes('sulawesi tengah')) return 'Sulawesi Tengah'
  if (lower.includes('sulawesi selatan')) return 'Sulawesi Selatan'
  if (lower.includes('sulawesi tenggara')) return 'Sulawesi Tenggara'
  if (lower.includes('sulawesi barat')) return 'Sulawesi Barat'
  if (lower.includes('gorontalo')) return 'Gorontalo'
  if (lower.includes('maluku utara')) return 'Maluku Utara'
  if (lower.includes('maluku')) return 'Maluku'
  if (lower.includes('papua barat daya')) return 'Papua Barat Daya'
  if (lower.includes('papua barat')) return 'Papua Barat'
  if (lower.includes('papua selatan')) return 'Papua Selatan'
  if (lower.includes('papua tengah')) return 'Papua Tengah'
  if (lower.includes('papua pegunungan')) return 'Papua Pegunungan'
  if (lower.includes('papua')) return 'Papua'
  if (lower.includes('sumatera utara') || lower.includes('sumut')) return 'Sumatera Utara'
  if (lower.includes('sumatera barat') || lower.includes('sumbar')) return 'Sumatera Barat'
  if (lower.includes('sumatera selatan') || lower.includes('sumsel')) return 'Sumatera Selatan'
  if (lower.includes('bengkulu')) return 'Bengkulu'
  if (lower.includes('jambi')) return 'Jambi'
  if (lower.includes('lampung')) return 'Lampung'

  // Exact or direct match
  const direct = INDONESIA_REGIONS.find(
    (p) => p.name.toLowerCase() === lower
  )
  return direct ? direct.name : trimmed
}

/**
 * Mencocokkan nama kota dari hasil geocoder ke daftar kota resmi di provinsi terpilih
 */
export function normalizeCityName(
  provinceName: string,
  rawCity?: string | null
): string {
  if (!rawCity) return ''
  const trimmed = rawCity.trim()
  const lower = trimmed.toLowerCase()
  const cities = getCitiesForProvince(provinceName)
  if (!cities.length) return trimmed

  // 1. Exact match
  const exact = cities.find((c) => c.toLowerCase() === lower)
  if (exact) return exact

  // 2. Contains match (contoh: "South Jakarta" / "Jakarta Selatan" -> "Jakarta Selatan")
  const contains = cities.find(
    (c) =>
      lower.includes(c.toLowerCase().replace(/^(kota|kabupaten)\s+/i, '')) ||
      c.toLowerCase().includes(lower.replace(/^(kota|kabupaten)\s+/i, ''))
  )
  if (contains) return contains

  return trimmed
}
