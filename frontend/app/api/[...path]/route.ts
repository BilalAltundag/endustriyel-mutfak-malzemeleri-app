import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

const FILTERED_REQ_HEADERS = new Set([
  'host',
  'connection',
  'accept-encoding',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
  'http2-settings',
])

async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const target = `${BACKEND_URL}${pathname}${req.nextUrl.search}`

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!FILTERED_REQ_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  headers.set('ngrok-skip-browser-warning', 'true')

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: 'follow',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = req.body
    // @ts-ignore — required for streaming request bodies in Node 18+
    fetchOptions.duplex = 'half'
  }

  try {
    const backendRes = await fetch(target, fetchOptions)

    const responseHeaders = new Headers()
    backendRes.headers.forEach((value, key) => {
      const k = key.toLowerCase()
      if (k !== 'transfer-encoding' && k !== 'connection') {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    })
  } catch (err: any) {
    console.error('[API Proxy Error]', req.method, target, err.message)
    return NextResponse.json(
      { error: 'Backend unreachable', detail: err.message },
      { status: 502 }
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const PATCH = proxy
