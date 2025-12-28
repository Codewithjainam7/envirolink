import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const { originalImage, proofImage, category, description } = await request.json();

        if (!proofImage) {
            return NextResponse.json({ isResolved: false, message: 'No proof image provided' }, { status: 400 });
        }

        // Remove base64 prefix if present
        const cleanProofImage = proofImage.replace(/^data:image\/\w+;base64,/, '');
        const cleanOriginalImage = originalImage?.replace(/^data:image\/\w+;base64,/, '') || null;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an AI assistant helping verify if a waste/environmental issue has been resolved.

TASK: Compare the proof image showing completed work and determine if the issue has been properly resolved.

ISSUE DETAILS:
- Category: ${category || 'Unknown'}
- Description: ${description || 'No description'}

VERIFICATION CRITERIA:
1. The area should be clean and free of waste/debris
2. The issue mentioned should no longer be visible
3. The work appears to be completed properly

Analyze the proof image and determine:
1. Is the issue RESOLVED? (Yes/No)
2. Confidence level (High/Medium/Low)
3. Brief reason for your decision

RESPOND IN JSON FORMAT ONLY:
{
  "isResolved": true/false,
  "confidence": "High/Medium/Low",
  "reason": "Brief explanation"
}`;

        const imageParts = [
            {
                inlineData: {
                    data: cleanProofImage,
                    mimeType: 'image/jpeg',
                },
            },
        ];

        // If we have original image, include it for comparison
        if (cleanOriginalImage) {
            imageParts.push({
                inlineData: {
                    data: cleanOriginalImage,
                    mimeType: 'image/jpeg',
                },
            });
        }

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
                isResolved: parsed.isResolved === true,
                confidence: parsed.confidence,
                message: parsed.isResolved
                    ? 'Issue verified as resolved. Great work!'
                    : `Verification failed: ${parsed.reason}. Please ensure the issue is properly resolved and try again.`
            });
        }

        // Fallback if JSON parsing fails
        const isResolved = text.toLowerCase().includes('"isresolved": true') ||
            text.toLowerCase().includes('"isresolved":true');

        return NextResponse.json({
            isResolved,
            message: isResolved ? 'Issue verified as resolved.' : 'Could not verify resolution. Please try again.'
        });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { isResolved: false, message: 'Verification service error. Please try again.' },
            { status: 500 }
        );
    }
}
