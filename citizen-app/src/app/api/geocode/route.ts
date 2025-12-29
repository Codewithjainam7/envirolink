import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
                headers: {
                    'User-Agent': 'EnviroLink/1.0 (https://envirolink-citizen.vercel.app)'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Nominatim returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Geocoding error:', error);
        return NextResponse.json({
            error: error.message,
            display_name: `${lat}, ${lon}` // Fallback
        });
    }
}
