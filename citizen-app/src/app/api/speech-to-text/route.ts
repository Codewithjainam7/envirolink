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

        // Clean base64 string - remove data URL prefix if present
        let base64Data = audioBase64;
        let mimeType = 'audio/webm';

        // Extract mime type and data from data URL
        const dataUrlMatch = audioBase64.match(/^data:(audio\/[^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
            mimeType = dataUrlMatch[1];
            base64Data = dataUrlMatch[2];
        } else {
            base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        }

        console.log('Audio mime type:', mimeType);
        console.log('Audio data length:', base64Data.length);

        // Try multiple models - gemini-1.5-flash has better audio support
        const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
        let transcript = '';
        let lastError = '';

        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    {
                                        text: `Listen to this audio recording and transcribe exactly what is spoken. 
                                        Return ONLY the transcribed text with no additional commentary. 
                                        If no clear speech is heard, return the word "EMPTY".`
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
                console.log(`${model} response status:`, response.status);

                if (!response.ok) {
                    console.error(`${model} error:`, responseText);
                    lastError = responseText;
                    continue;
                }

                const data = JSON.parse(responseText);

                // Extract transcript from response
                if (data.candidates?.[0]?.content?.parts) {
                    for (const part of data.candidates[0].content.parts) {
                        if (part.text) {
                            transcript += part.text;
                        }
                    }
                }

                if (transcript && transcript.trim() !== 'EMPTY') {
                    console.log('Transcribed successfully with', model, ':', transcript);
                    break;
                }
            } catch (err: any) {
                console.error(`Error with ${model}:`, err.message);
                lastError = err.message;
            }
        }

        if (!transcript || transcript.trim() === 'EMPTY') {
            return NextResponse.json({
                error: lastError || 'No speech detected',
                transcript: ''
            });
        }

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
