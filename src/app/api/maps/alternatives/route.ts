import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_TRUMAP_API || 'https://trueapi.truenapsh.my.id';

        const response = await fetch(`${baseUrl}/api/maps/alternatives`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
