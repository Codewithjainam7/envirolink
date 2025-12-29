import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('--- Speech to Text API Request ---');

    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('No API key configured');
        return NextResponse.json({ error: 'API key not configured', transcript: '' });
    }

    try {
        const body = await request.json();
        const { audioBase64 } = body;

        if (!audioBase64) {
            return NextResponse.json({ error: 'No audio provided', transcript: '' });
        }

        // Extract mime type and data from data URL
        let base64Data = audioBase64;
        let mimeType = 'audio/webm';

        const dataUrlMatch = audioBase64.match(/^data:(audio\/[^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
            mimeType = dataUrlMatch[1];
            base64Data = dataUrlMatch[2];
        } else {
            base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        }

        console.log('Audio mime type:', mimeType);
        console.log('Audio data length:', base64Data.length);

        // Use gemini-2.5-flash (current model)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Transcribe this audio recording. Return ONLY the spoken words, nothing else. If no speech, return empty string.`
                            },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        const responseText = await response.text();
        console.log('Gemini response status:', response.status);

        if (!response.ok) {
            console.error('Gemini error:', responseText);
            return NextResponse.json({
                error: 'Transcription failed - model may not support audio',
                transcript: ''
            });
        }

        const data = JSON.parse(responseText);
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
