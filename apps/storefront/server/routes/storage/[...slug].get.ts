import { defineEventHandler, getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname // contoh: /storage/products/baju%20ubsi%20hijau.jpg

  const config = useRuntimeConfig()
  // Prioritaskan backend lokal jika di mesin yang sama, atau fallback ke apiBase
  let backendOrigin = 'http://localhost:3000'
  if (config.public.apiBase) {
    try {
      const parsed = new URL(String(config.public.apiBase))
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        backendOrigin = parsed.origin
      }
    } catch {
      // ignore
    }
  }

  // Coba dulu ke localhost:3000 untuk performa maksimal dan bebas blokir
  const localTarget = `http://localhost:3000${path}`
  try {
    const res = await fetch(localTarget)
    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'application/octet-stream'
      const cacheControl = res.headers.get('cache-control') || 'public, max-age=86400'
      const body = await res.arrayBuffer()
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  } catch {
    // jika localhost:3000 gagal, fallback ke backendOrigin
  }

  // Fallback jika backend ada di URL publik (misal ngrok) dengan bypass header
  try {
    const remoteTarget = `${backendOrigin}${path}`
    const res = await fetch(remoteTarget, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'CyberStore-Proxy/1.0',
      },
    })

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const cacheControl = res.headers.get('cache-control') || 'public, max-age=86400'
    const body = await res.arrayBuffer()
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    console.error(`[Storage Proxy Error] Gagal memuat ${path}:`, err?.message)
    return new Response('Not found', { status: 404 })
  }
})
