import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    // 1) Capabilities proxy: ?url=https://.../wms?service=WMS...
    const targetUrl = searchParams.get('url')
    // 2) Tile proxy: ?baseUrl=https://.../geoserver/palapa/wms&bbox={bbox-epsg-3857}&layers=... etc
    const baseUrl = searchParams.get('baseUrl')

    let finalUrl: string | null = null
    let isTile = false

    if (baseUrl) {
        // WMS / ArcGIS tile proxy - Mapbox will have replaced {bbox-epsg-3857} with real bbox before request
        try {
            const parsed = new URL(baseUrl)
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
            }
        } catch {
            return NextResponse.json({ error: 'Invalid baseUrl' }, { status: 400 })
        }
        // Build query from remaining params (bbox, layers, width, etc)
        const params = new URLSearchParams()
        searchParams.forEach((value, key) => {
            if (key === 'baseUrl') return
            params.set(key, value)
        })
        // baseUrl may already contain ?, handle correctly
        const sep = baseUrl.includes('?') ? '&' : '?'
        finalUrl = params.toString() ? `${baseUrl}${sep}${params.toString()}` : baseUrl
        isTile = true
    } else if (targetUrl) {
        try {
            const parsed = new URL(targetUrl)
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
            }
        } catch {
            return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
        }
        finalUrl = targetUrl
        // Heuristic: if url contains GetMap/export/tile/pbf/mvt/pmtiles -> tile
        isTile = /GetMap|export|tile|pbf|mvt|pmtiles/i.test(targetUrl)
    } else {
        return NextResponse.json({ error: 'Missing url or baseUrl param' }, { status: 400 })
    }

    const range = req.headers.get("range") || req.headers.get("Range");
    const isPmtiles = /pmtiles/i.test(finalUrl!);

    try {
        const response = await fetch(finalUrl!, {
            headers: {
                // tile needs image/*, capabilities needs xml; pmtiles needs range
                'Accept': isTile ? 'image/png,image/*,*/*,application/x-protobuf,application/vnd.mapbox-vector-tile,application/octet-stream' : 'text/xml, application/xml, */*',
                'User-Agent': 'TrueMaps/2.0',
                ...(range ? { Range: range } : {}),
            },
            // cache for short time for capabilities, no-cache for tiles handled via headers
        })

        if (!response.ok && response.status !== 206) {
            const text = await response.text().catch(() => '')
            // For tiles, return transparent 1x1 on error to avoid mapbox endless retry? but expose error
            return new NextResponse(text || `Upstream error ${response.status}`, { status: response.status })
        }

        if (isTile || isPmtiles || range) {
            const buffer = await response.arrayBuffer()
            return new NextResponse(Buffer.from(buffer), {
                status: response.status,
                headers: {
                    'Content-Type': response.headers.get('Content-Type') || (isPmtiles ? 'application/octet-stream' : 'image/png'),
                    'Content-Range': response.headers.get('Content-Range') || undefined as any,
                    'Content-Length': response.headers.get('Content-Length') || undefined as any,
                    'Accept-Ranges': response.headers.get('Accept-Ranges') || 'bytes',
                    'Cache-Control': isPmtiles ? 'public, max-age=86400' : 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Range, Content-Type',
                    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
                },
            })
        }

        const body = await response.text()
        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'text/xml',
                'Cache-Control': 'public, max-age=60',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Proxy fetch failed' }, { status: 500 })
    }
}
