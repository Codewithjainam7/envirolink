import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('--- Analyze Image API Request Started ---');

    // Get API key from environment
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('CRITICAL ERROR: Gemini API Key is missing');
        return NextResponse.json({
            isWasteRelated: true,
            topCategories: [],
            confidence: 0,
            description: 'API Key not configured - please proceed manually',
            rejectionReason: ''
        });
    }

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

        // Use gemini-2.0-flash (has image support)
        const models = ['gemini-2.0-flash'];
        let result = null;

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

                if (!response.ok) {
                    const errText = await response.text();
                    console.error(`Model ${model} failed:`, errText);
                    continue;
                }

                const data = await response.json();
                console.log(`Model ${model} response:`, JSON.stringify(data).substring(0, 500));

                // Extract text from response - handle both regular and thinking model responses
                let aiText = '';
                if (data.candidates?.[0]?.content?.parts) {
                    for (const part of data.candidates[0].content.parts) {
                        if (part.text) {
                            aiText += part.text;
                        }
                    }
                }

                if (!aiText) {
                    console.warn(`No text in ${model} response`);
                    continue;
                }

                console.log('AI output:', aiText);

                // Parse JSON from response
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result = JSON.parse(jsonMatch[0]);
                    console.log('Parsed result:', result);
                    break;
                }
            } catch (e) {
                console.error(`Error with model ${model}:`, e);
            }
        }

        if (!result) {
            console.warn('All models failed, returning fallback');
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
