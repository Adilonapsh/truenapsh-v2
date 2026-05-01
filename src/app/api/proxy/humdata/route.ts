import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
        }

        const response = await fetch(targetUrl, {
            method: 'GET',
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch from target: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
