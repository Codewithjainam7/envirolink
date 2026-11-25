import { NextRequest, NextResponse } from 'next/server';

const VALID_CATEGORIES = new Set([
    'illegal_dumping',
    'overflowing_bin',
    'littering',
    'construction_debris',
    'e_waste',
    'organic_waste',
    'sewage_overflow',
    'dead_animal',
    'burning_waste',
    'abandoned_vehicle',
    'hazardous_material',
    'electrical_hazard',
]);

const OPENROUTER_MODEL = 'nvidia/nemotron-3.5-super-vl:free';

export async function POST(request: NextRequest) {
    console.log('--- Analyze Image API Request Started (OpenRouter Nemotron 3.5 Super VL) ---');

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64 || typeof imageBase64 !== 'string') {
            return NextResponse.json(
                { isWasteRelated: false, rejectionReason: 'No image provided' },
                { status: 400 }
            );
        }

        // Extract actual MIME type and base64 payload
        let mimeType = 'image/jpeg';
        let base64Data = imageBase64;
        const dataUrlMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (dataUrlMatch) {
            mimeType = dataUrlMatch[1];
            base64Data = dataUrlMatch[2];
        } else {
            base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
        }

        const PROMPT = `You are a strict civic waste-reporting image validator for a municipal waste management platform (EnviroLink).

TASK: Determine if this image genuinely shows a real-world environmental waste, sanitation, or civic hazard issue in a public/outdoor/community setting.

Return ONLY a valid JSON object (no markdown):
{
  "is_waste": true/false,
  "category": "illegal_dumping" | "overflowing_bin" | "littering" | "construction_debris" | "e_waste" | "organic_waste" | "sewage_overflow" | "dead_animal" | "burning_waste" | "abandoned_vehicle" | "hazardous_material" | "electrical_hazard" | "none",
  "confidence": 0-100,
  "description": "one concise sentence describing the waste issue visible",
  "rejection_reason": "if is_waste is false, short polite explanation of what is in the image and why it is rejected"
}

ACCEPTED ISSUES (is_waste = true):
- illegal_dumping: garbage piles, trash bags dumped on streets/plots
- overflowing_bin: overflowing public dustbin/dumpster
- littering: scattered wrappers, plastic bottles, trash on roads/parks/beaches
- construction_debris: rubble, bricks, concrete, construction waste left in public
- e_waste: discarded electronics, wires, broken appliances dumped outdoors
- organic_waste: rotting food/market/garden waste piles outdoors
- sewage_overflow: overflowing drains, sewage water, clogged gutters
- dead_animal: animal carcass on road/public space
- burning_waste: open burning of trash/garbage
- abandoned_vehicle: rusted/abandoned junk vehicle left in public space
- hazardous_material: chemical drums, medical/biomedical waste dumped
- electrical_hazard: fallen/exposed live wires or damaged street electrical box

STRICT REJECTION RULES (MUST set is_waste = false):
- Photos of computer/phone screens or monitors (moiré pixel grid, screen bezels, UI bars, web pages)
- Stock photos with watermarks, news graphics, text overlays, memes, screenshots, or collages
- Selfies, portraits, faces, or people posing without waste as the clear subject
- Living pets/animals, indoor rooms, clean streets/parks/nature with no visible garbage
- Food on plates/tables, laptops/phones/electronics in normal indoor use
- Graphic logos, icons, drawings, cartoons, blank/blurry/black images
- Any random photo unrelated to real-world civic waste or sanitation issues`;

        let result: any = null;

        // Primary: OpenRouter NVIDIA Nemotron 3.5 Super VL (free)
        if (OPENROUTER_API_KEY && !result) {
            try {
                console.log(`Calling OpenRouter (${OPENROUTER_MODEL})...`);

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    signal: AbortSignal.timeout(35000),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': request.nextUrl.origin || 'http://localhost:3000',
                        'X-Title': 'EnviroLink Citizen App',
                    },
                    body: JSON.stringify({
                        model: OPENROUTER_MODEL,
                        reasoning: { enabled: false },
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: PROMPT },
                                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
                                ],
                            },
                        ],
                        temperature: 0.1,
                        max_tokens: 300,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const message = data.choices?.[0]?.message;
                    const aiText = message?.content || '';
                    console.log('OpenRouter response received:', aiText);

                    if (aiText) {
                        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            result = JSON.parse(jsonMatch[0]);
                        }
                    }
                } else {
                    console.error('OpenRouter failed:', response.status, await response.text());
                }
            } catch (e) {
                console.error('OpenRouter error:', e);
            }
        }

        // Optional fallback to Groq if configured and OpenRouter failed
        if (GROQ_API_KEY && !result) {
            const groqModels = [
                'meta-llama/llama-4-scout-17b-16e-instruct',
                'meta-llama/llama-4-maverick-17b-128e-instruct',
            ];

            for (const groqModel of groqModels) {
                if (result) break;
                try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${GROQ_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: groqModel,
                            messages: [
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: PROMPT },
                                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
                                    ],
                                },
                            ],
                            temperature: 0.1,
                            max_tokens: 512,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const aiText = data.choices?.[0]?.message?.content || '';
                        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            result = JSON.parse(jsonMatch[0]);
                        }
                    }
                } catch (e) {
                    console.error(`Groq ${groqModel} error:`, e);
                }
            }
        }

        // Strict verification: never accept unverified/random images if AI could not verify
        if (!result) {
            console.warn('AI verification unavailable - rejecting unverified upload');
            return NextResponse.json({
                isWasteRelated: false,
                isAppropriate: false,
                topCategories: [],
                confidence: 0,
                description: '',
                rejectionReason: 'Unable to verify waste in this image right now. Please try again with a clear photo of the waste issue.',
            }, { status: 503 });
        }

        const isWaste = result.is_waste === true && Number(result.confidence ?? 80) >= 50;
        const normalizedCategory = VALID_CATEGORIES.has(result.category) ? result.category : 'littering';

        return NextResponse.json({
            isAppropriate: isWaste,
            isWasteRelated: isWaste,
            topCategories: isWaste ? [normalizedCategory] : [],
            confidence: Number(result.confidence ?? 80),
            description: isWaste ? (result.description || 'Waste issue detected') : '',
            rejectionReason: isWaste
                ? ''
                : (result.rejection_reason || 'Image rejected — please upload a photo showing real-world waste, garbage, or a civic sanitation issue.'),
        });
    } catch (error: any) {
        console.error('Analyze Image API Error:', error);
        return NextResponse.json({
            isWasteRelated: false,
            isAppropriate: false,
            topCategories: [],
            confidence: 0,
            description: '',
            rejectionReason: 'Failed to analyze image. Please upload a valid waste photo and try again.',
        }, { status: 500 });
    }
}
