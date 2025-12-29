import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('--- Analyze Image API Request Started ---');

    // Get API keys from environment
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Clean base64 string
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        // Simple, clear prompt for waste detection
        const PROMPT = `Analyze this image for environmental waste/garbage.

Return ONLY a JSON object (no markdown):
{
  "is_waste": true/false,
  "category": "littering" | "illegal_dumping" | "overflowing_bin" | "construction_debris" | "organic_waste" | "sewage_overflow" | "hazardous_material" | "other",
  "confidence": 0-100,
  "description": "one sentence description"
}

Categories:
- littering: scattered trash, bottles, wrappers
- illegal_dumping: large piles of garbage  
- overflowing_bin: full trash bins
- construction_debris: building materials, rubble
- organic_waste: food waste, garden waste
- sewage_overflow: dirty water, leaked sewage
- hazardous_material: chemicals, medical waste
- other: any other waste type

If no waste visible, set is_waste to false.`;

        let result = null;

        // Try Gemini 2.0 Flash first
        if (GEMINI_API_KEY && !result) {
            try {
                console.log('Trying Gemini 2.0 Flash...');

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: PROMPT },
                                    { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                                ]
                            }],
                            generationConfig: {
                                temperature: 0.1,
                                maxOutputTokens: 1024
                            }
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log('Gemini response received');

                    let aiText = '';
                    if (data.candidates?.[0]?.content?.parts) {
                        for (const part of data.candidates[0].content.parts) {
                            if (part.text) aiText += part.text;
                        }
                    }

                    if (aiText) {
                        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            result = JSON.parse(jsonMatch[0]);
                            console.log('Gemini parsed result:', result);
                        }
                    }
                } else {
                    console.error('Gemini failed:', await response.text());
                }
            } catch (e) {
                console.error('Gemini error:', e);
            }
        }

        // Fallback to Groq if Gemini failed
        if (GROQ_API_KEY && !result) {
            try {
                console.log('Trying Groq as fallback...');

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.2-90b-vision-preview',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: PROMPT },
                                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                                ]
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 1024
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Groq response received');

                    const aiText = data.choices?.[0]?.message?.content || '';
                    if (aiText) {
                        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            result = JSON.parse(jsonMatch[0]);
                            console.log('Groq parsed result:', result);
                        }
                    }
                } else {
                    console.error('Groq failed:', await response.text());
                }
            } catch (e) {
                console.error('Groq error:', e);
            }
        }

        if (!result) {
            console.warn('All AI models failed, returning fallback');
            return NextResponse.json({
                isWasteRelated: true,
                isAppropriate: true,
                topCategories: [],
                confidence: 0,
                description: 'AI analysis failed - please select category manually',
                rejectionReason: ''
            });
        }

        // Return standardized response
        return NextResponse.json({
            isAppropriate: true,
            isWasteRelated: result.is_waste === true,
            topCategories: result.is_waste ? [result.category || 'littering'] : [],
            confidence: result.confidence || 80,
            description: result.description || 'Analyzed successfully',
            rejectionReason: result.is_waste ? '' : 'No waste detected in image'
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            isWasteRelated: true,
            isAppropriate: true,
            topCategories: [],
            confidence: 0,
            description: 'Error occurred - please proceed manually',
            rejectionReason: ''
        });
    }
}
