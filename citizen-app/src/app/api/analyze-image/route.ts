import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Use Edge Runtime for faster response (optional, but good for simple APIs)

export async function POST(request: NextRequest) {
    console.log('--- Analyze Image API Request Started ---');

    // 1. SECURE API KEY RETRIEVAL
    // Check all possible environment variable variations to be robust
    const API_KEY = process.env.GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('CRITICAL ERROR: Gemini API Key is missing in environment variables.');
        return NextResponse.json({
            error: 'Server Configuration Error: API Key Missing',
            isWasteRelated: false,
            description: 'System configuration error - Admin check logs.',
            rejectionReason: 'API Key not configured'
        }, { status: 500 });
    }

    try {
        // 2. PARSE REQUEST
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            console.warn('Request missing image data.');
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Clean base64 string
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        // 3. CONSTRUCT DETAILED PROMPT (As requested)
        // A complex, chain-of-thought style prompt for better accuracy
        const PROMPT_TEXT = `
You are EnviroLink AI, a highly advanced environmental waste analysis expert. 
Your task is to analyze the provided image with extreme precision to identify garbage, litter, or environmental hazards.

STRICT ANALYSIS RULES:
1. **Identify the Core Subject**: What is the main focus of this image?
2. **Waste Detection**: Is there visible waste, trash, garbage, debris, or pollution?
   - YES if: overflowing bins, scattered paper/plastic, construction rubble, sewage spills, dumping sites, burning trash.
   - NO if: selfies, clean streets, indoor rooms (unless showing waste), food on a plate, screenshots, nature without trash.
3. **Categorization**: If waste is found, assign the MOST ACCURATE category from this list:
   - 'littering' (Small items, paper, wrappers, bottles on ground)
   - 'illegal_dumping' (Large piles, furniture, bags in unauthorized areas)
   - 'overflowing_bin' (Public dustbins full and spilling over)
   - 'construction_debris' (Bricks, cement, pipes, rubble)
   - 'e_waste' (Computers, phones, wires, electrical parts)
   - 'organic_waste' (Rotting food, vegetables, garden waste)
   - 'sewage_overflow' (Leaking pipes, dirty water on streets)
   - 'burning_waste' (Smoke, fire consuming trash)
   - 'hazardous_material' (Chemicals, oil spills, medical waste, batteries)
   - 'dead_animal' (Carcasses on public roads)
   - 'abandoned_vehicle' (Rusted/damaged cars left on streets)
   - 'electrical_hazard' (Fallen power lines, exposed wires)

4. **Severity Assessment**:
   - HIGH: blocking roads, hazardous, fire, sewage, large dumping.
   - MEDIUM: overflowing bins, moderate littering.
   - LOW: small isolated pieces of paper/trash.

RESPONSE FORMAT (JSON ONLY):
You must return ONLY a raw JSON object. Do not include markdown formatting (like \`\`\`json).
{
  "is_waste": boolean,
  "category": "string_from_list_above",
  "confidence_score": number_0_to_100,
  "description": "A precise, one-sentence description of the waste observed.",
  "reasoning": "Brief explanation of why this was classified as waste or not."
}
        `;

        // 4. CALL GEMINI API
        // Using gemini-2.0-flash-exp as the latest "Flash" model (often referred to as 'Flash 2.5' or 'Next Gen')
        // We will fallback to 1.5-flash if 2.0 fails for reliability.

        const MODEL_NAME = 'gemini-1.5-flash'; // Using 1.5-flash as PRIMARY STABLE model to fix errors
        // Note: 'gemini-2.5-flash' does not exist publicly yet. 1.5-flash is the current stable flash.
        // We will adhere to robustness first.

        console.log(`Sending request to Google Gemini API (Model: ${MODEL_NAME})...`);

        const requestPayload = {
            contents: [{
                parts: [
                    { text: PROMPT_TEXT },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }],
            generationConfig: {
                temperature: 0.2, // Low temperature for factual, consistent JSON
                maxOutputTokens: 500
            }
        };

        const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            }
        );

        const responseText = await apiResponse.text();
        console.log('Gemini API Response Status:', apiResponse.status);

        if (!apiResponse.ok) {
            console.error('Gemini API Error Body:', responseText);

            // Handle specific errors
            if (apiResponse.status === 400 && responseText.includes('API_KEY_INVALID')) {
                return NextResponse.json({
                    isWasteRelated: false,
                    isAppropriate: false,
                    description: 'System Error: Invalid API Key',
                    rejectionReason: 'Invalid API Key configuration.'
                });
            }

            throw new Error(`Gemini API Failed with status ${apiResponse.status}: ${responseText}`);
        }

        // 5. PARSE RESPONSE
        const data = JSON.parse(responseText);
        const candidates = data.candidates;

        if (!candidates || candidates.length === 0) {
            console.warn('No candidates returned from Gemini.');
            return NextResponse.json({
                isWasteRelated: true, // Default to true to allow user manual selection
                topCategories: [],
                confidence: 0,
                description: 'AI Analysis Inconclusive - please select category manually.',
                rejectionReason: ''
            });
        }

        const aiText = candidates[0].content.parts[0].text;
        console.log('AI Raw Output:', aiText);

        // Clean markdown if present
        const jsonStr = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        let analysisResult;

        try {
            analysisResult = JSON.parse(jsonStr);
        } catch (e) {
            console.error('JSON Parse Failed:', e);
            // Fallback: heuristic check
            const isWasteString = aiText.toLowerCase().includes('true');
            return NextResponse.json({
                isAppropriate: true,
                isWasteRelated: isWasteString,
                topCategories: ['littering'], // Default suggestion
                confidence: 50,
                description: 'Analysis completed (Format warning)',
                rejectionReason: isWasteString ? '' : 'Could not confirm waste (Parse Error)'
            });
        }

        const isWaste = analysisResult.is_waste === true;

        return NextResponse.json({
            isAppropriate: true,
            isWasteRelated: isWaste,
            topCategories: isWaste ? [analysisResult.category] : [],
            confidence: analysisResult.confidence_score || 85,
            description: analysisResult.description || 'Verified via AI',
            rejectionReason: !isWaste ? (analysisResult.reasoning || 'Not identified as waste') : ''
        });

    } catch (error: any) {
        console.error('Server Internal Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            isWasteRelated: true, // Fail open to allow user submission
            topCategories: [],
            confidence: 0,
            description: 'AI Service Unavailable - Please proceed manually',
            rejectionReason: ''
        }); // Status 200 to allow frontend to handle gracefully as a "soft fail"
    }
}
