import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    const baseUrl = searchParams.get('baseUrl')
    const z = searchParams.get('z')
    const x = searchParams.get('x')
    const y = searchParams.get('y')

    if (!baseUrl || !z || !x || !y) {
        return new NextResponse('Missing parameters', { status: 400 })
    }

    const tileUrl = baseUrl
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y)

    try {
        const response = await fetch(tileUrl)

        if (!response.ok) {
            return new NextResponse('Tile not found', { status: response.status })
        }

        const buffer = await response.arrayBuffer()

        return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/png',
                'Cache-Control': 'public, max-age=86400',
            },
        })
    } catch (error) {
        return new NextResponse('Error fetching tile', { status: 500 })
    }
}

