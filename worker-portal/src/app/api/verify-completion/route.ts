import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_MODEL = 'nvidia/nemotron-3.5-super-vl:free';

async function toBase64DataUrl(raw: string): Promise<string | null> {
    if (!raw) return null;
    if (raw.startsWith('data:image/')) {
        return raw;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
            const imgRes = await fetch(raw, { signal: AbortSignal.timeout(8000) });
            if (!imgRes.ok) return null;
            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            const buf = Buffer.from(await imgRes.arrayBuffer());
            return `data:${contentType.split(';')[0]};base64,${buf.toString('base64')}`;
        } catch {
            return null;
        }
    }
    return `data:image/jpeg;base64,${raw}`;
}

export async function POST(request: NextRequest) {
    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        const { originalImage, proofImage, category, description, mode = 'resolved' } = await request.json();

        if (!proofImage) {
            return NextResponse.json({ isResolved: false, message: 'No proof image provided' }, { status: 400 });
        }

        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                { isResolved: false, message: 'AI verification API key is not configured.' },
                { status: 500 }
            );
        }

        const proofDataUrl = await toBase64DataUrl(proofImage);
        if (!proofDataUrl) {
            return NextResponse.json(
                { isResolved: false, message: 'Could not process proof image. Please re-upload and try again.' },
                { status: 400 }
            );
        }

        const origDataUrl = originalImage ? await toBase64DataUrl(originalImage) : null;
        const afterLabel = origDataUrl ? 'IMAGE 2 (AFTER)' : 'IMAGE 1';

        const isNothingFoundMode = mode === 'nothing_found';
        const prompt = isNothingFoundMode
            ? `You are an AI anti-fraud inspector verifying a municipal field worker's "Nothing Found / Empty Spot" claim.

IMPORTANT RULE: Evaluate ONLY ${afterLabel} (the worker's current spot photo).${origDataUrl ? ' IMAGE 1 is ONLY the older citizen report photo BEFORE arrival — do NOT reject because IMAGE 1 has waste.' : ''}

REPORTED ISSUE:
- Category: ${category || 'Unknown'}
- Description: ${description || 'No description'}

VERIFICATION CRITERIA FOR ${afterLabel}:
1. ${afterLabel} must show a real outdoor street, bin, sidewalk, or public area — NOT a blank wall, indoor room, screen, or graphic logo.
2. ${afterLabel} must show NO visible garbage/overflow/hazard at the spot (clean/empty).

RESPOND IN JSON FORMAT ONLY (no markdown):
{
  "isResolved": true/false,
  "confidence": "High/Medium/Low",
  "reason": "Brief explanation focused only on ${afterLabel}"
}`
            : `You are verifying a municipal sanitation worker's cleanup proof photo.

IMPORTANT RULE: Evaluate ONLY ${afterLabel} (the AFTER completion photo).${origDataUrl ? ' IMAGE 1 is ONLY the older BEFORE photo showing what waste used to be there — NEVER mark isResolved false just because IMAGE 1 contains waste.' : ''}

ISSUE DETAILS:
- Category: ${category || 'Unknown'}
- Description: ${description || 'No description'}

VERIFICATION CRITERIA FOR ${afterLabel}:
1. Set "isResolved": true if ${afterLabel} shows the area/bin is now clean, emptied, closed/covered, swept, or free of overflowing garbage (even if taken from a slightly different angle).
2. Set "isResolved": false ONLY if ${afterLabel} ITSELF still shows overflowing trash, garbage piles, or is an unrelated graphic/logo/indoor/blank photo.

RESPOND IN JSON FORMAT ONLY (no markdown):
{
  "isResolved": true/false,
  "confidence": "High/Medium/Low",
  "reason": "Brief explanation focused only on ${afterLabel}"
}`;

        const content: any[] = [];
        if (origDataUrl) {
            content.push({
                type: 'text',
                text: 'IMAGE 1 (BEFORE — old citizen complaint photo BEFORE cleanup; for context only):',
            });
            content.push({ type: 'image_url', image_url: { url: origDataUrl } });
        }
        content.push({
            type: 'text',
            text: origDataUrl
                ? 'IMAGE 2 (AFTER — worker current proof photo; JUDGE ONLY THIS IMAGE):'
                : 'IMAGE 1 (Current proof photo; JUDGE THIS IMAGE):',
        });
        content.push({ type: 'image_url', image_url: { url: proofDataUrl } });
        content.push({ type: 'text', text: prompt });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(35000),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': request.nextUrl.origin || 'http://localhost:3002',
                'X-Title': 'EnviroLink Worker Portal',
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                reasoning: { enabled: false },
                messages: [{ role: 'user', content }],
                temperature: 0.1,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter verification error:', response.status, errText);
            return NextResponse.json(
                { isResolved: false, message: 'Verification service error. Please try again.' },
                { status: 502 }
            );
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const verified = parsed.isResolved === true;
            return NextResponse.json({
                isResolved: verified,
                confidence: parsed.confidence,
                message: verified
                    ? (isNothingFoundMode
                        ? 'Empty spot verified — report marked as false/rejected.'
                        : 'Issue verified as resolved. Great work!')
                    : `Verification failed: ${parsed.reason}. ${isNothingFoundMode ? 'Photo must clearly show the clean/empty outdoor spot.' : 'Please ensure the issue is properly resolved and try again.'}`,
            });
        }

        const isResolved = text.toLowerCase().includes('"isresolved": true') ||
            text.toLowerCase().includes('"isresolved":true');

        return NextResponse.json({
            isResolved,
            message: isResolved
                ? (isNothingFoundMode ? 'Empty spot verified.' : 'Issue verified as resolved.')
                : 'Could not verify photo. Please try again.',
        });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { isResolved: false, message: 'Verification service error. Please try again.' },
            { status: 500 }
        );
    }
}
