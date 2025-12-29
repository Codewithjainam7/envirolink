import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('--- Speech to Text API Request ---');

    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
        return NextResponse.json({ error: 'API key not configured', transcript: '' });
    }

    try {
        const body = await request.json();
        const { audioBase64 } = body;

        if (!audioBase64) {
            return NextResponse.json({ error: 'No audio provided', transcript: '' });
        }

        // Clean base64 string - remove data URL prefix if present
        const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');

        // Use Gemini to transcribe the audio
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: 'Transcribe the following audio. Return ONLY the transcribed text, nothing else. If no speech is detected, return an empty string.' },
                            { inlineData: { mimeType: "audio/webm", data: base64Data } }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', errText);
            return NextResponse.json({ error: 'Transcription failed', transcript: '' });
        }

        const data = await response.json();

        // Extract transcript from response
        let transcript = '';
        if (data.candidates?.[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
                if (part.text) {
                    transcript += part.text;
                }
            }
        }

        console.log('Transcribed:', transcript);

        return NextResponse.json({
            transcript: transcript.trim(),
            success: true
        });

    } catch (error: any) {
        console.error('Speech to text error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error',
            transcript: ''
        });
    }
}
