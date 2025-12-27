import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = 'AIzaSyDfGlgED6FH7Sj3W_LjzUnWth-yn4o9DQI';

export async function POST(request: NextRequest) {
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
                        text: `You are a waste detection AI. Look at this image and tell me:
1. Is this image showing garbage, waste, litter, or environmental pollution? Answer true or false.
2. If yes, what type? Choose from: littering, illegal_dumping, overflowing_bin, construction_debris, e_waste, organic_waste, sewage_overflow, burning_waste, hazardous_material
3. Give me a short description.

IMPORTANT: 
- Screenshots, selfies, food photos, indoor rooms = NOT waste (false)
- Garbage on streets, overflowing bins, littered areas = IS waste (true)

Reply ONLY with this JSON format:
{"waste": true, "categories": ["littering", "illegal_dumping"], "description": "Garbage on road"}
or
{"waste": false, "reason": "This is a screenshot"}`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }]
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        const responseText = await response.text();
        console.log('API Status:', response.status);
        console.log('API Response:', responseText);

        if (!response.ok) {
            console.error('API Error:', responseText);
            // Allow through on API error
            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: true,
                topCategories: ['littering', 'illegal_dumping', 'organic_waste', 'overflowing_bin'],
                confidence: 70,
                description: 'API error - please select category',
                rejectionReason: ''
            });
        }

        const data = JSON.parse(responseText);
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('AI Text:', aiText);

        if (!aiText) {
            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: true,
                topCategories: ['littering', 'illegal_dumping', 'organic_waste', 'overflowing_bin'],
                confidence: 70,
                description: 'No AI response - select category',
                rejectionReason: ''
            });
        }

        // Parse the AI response
        try {
            // Extract JSON from response
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
            console.log('Parse failed, checking text content');
            // Fallback: check if response mentions waste-related keywords
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
            confidence: 70,
            description: 'Error occurred - select category',
            rejectionReason: ''
        });
    }
}
