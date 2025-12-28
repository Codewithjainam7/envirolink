import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not configured');
        return NextResponse.json({
            error: 'API not configured',
            isWasteRelated: false,
            rejectionReason: 'Image analysis not available'
        }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Clean base64
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `You are a waste detection AI. Analyze this image and respond ONLY with valid JSON.

Is this image showing garbage, waste, litter, or environmental pollution?

Categories to choose from: littering, illegal_dumping, overflowing_bin, construction_debris, e_waste, organic_waste, sewage_overflow, burning_waste, hazardous_material

IMPORTANT:
- Screenshots, selfies, food photos = NOT waste
- Garbage on streets, overflowing bins, littered areas = IS waste

Reply with JSON only:
{"waste": true, "categories": ["littering"], "description": "Brief description"}
or
{"waste": false, "reason": "Why not waste"}`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 256
            }
        };

        // Try gemini-1.5-flash first (more stable), fallback to 2.0
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash-exp'];
        let responseData = null;
        let lastError = '';

        for (const model of models) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    }
                );

                const responseText = await response.text();
                console.log(`[${model}] Status:`, response.status);

                if (response.ok) {
                    responseData = JSON.parse(responseText);
                    console.log(`[${model}] Success`);
                    break;
                } else {
                    lastError = responseText;
                    console.log(`[${model}] Failed:`, responseText.substring(0, 200));
                }
            } catch (e) {
                console.log(`[${model}] Error:`, e);
            }
        }

        if (!responseData) {
            console.error('All models failed:', lastError);
            // Return success with manual selection required
            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: true,
                topCategories: ['littering', 'illegal_dumping', 'organic_waste', 'overflowing_bin'],
                confidence: 60,
                description: 'Please select the appropriate category',
                rejectionReason: ''
            });
        }

        const aiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('AI Response:', aiText);

        if (!aiText) {
            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: true,
                topCategories: ['littering', 'illegal_dumping', 'organic_waste', 'overflowing_bin'],
                confidence: 60,
                description: 'Please select category',
                rejectionReason: ''
            });
        }

        // Parse the AI response
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found');

            const result = JSON.parse(jsonMatch[0]);
            const isWaste = result.waste === true;

            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: isWaste,
                topCategories: isWaste ? (result.categories || ['littering', 'illegal_dumping']) : [],
                confidence: isWaste ? 85 : 0,
                description: result.description || '',
                rejectionReason: !isWaste ? (result.reason || 'Not a waste image') : ''
            });
        } catch (e) {
            console.log('Parse failed, checking keywords');
            const lowerText = aiText.toLowerCase();
            const isWaste = lowerText.includes('"waste": true') ||
                lowerText.includes('"waste":true') ||
                lowerText.includes('garbage') ||
                lowerText.includes('litter') ||
                lowerText.includes('trash');

            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: isWaste,
                topCategories: isWaste ? ['littering', 'illegal_dumping', 'organic_waste', 'overflowing_bin'] : [],
                confidence: isWaste ? 75 : 0,
                description: isWaste ? 'Waste detected' : '',
                rejectionReason: !isWaste ? 'Not a waste-related image' : ''
            });
        }

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({
            isAppropriate: true,
            isWasteRelated: true,
            topCategories: ['littering', 'illegal_dumping', 'organic_waste', 'overflowing_bin'],
            confidence: 60,
            description: 'Please select category',
            rejectionReason: ''
        });
    }
}
