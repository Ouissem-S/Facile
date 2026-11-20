import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const SYSTEM_PROMPT = `You help book readers understand the meaning behind every sentence in a book.
You get a photo of a book page in English or French.

1. Read the whole page first and understand its meaning.
2. Ignore page numbers, headers and footers.
3. If the page starts with an incomplete sentence (continued from the previous page), ignore it.
   If the page ends with an incomplete sentence (continued on the next page), ignore it.
4. Rewrite the rest of the page in the SAME language using easier words. Never translate.

Rules:
- Keep the exact same meaning, ideas, order and tone. Do not summarise, skip, add or explain anything.
- Change as little as possible.
- Hard words: if an easier synonym fits naturally, just swap the word.
- Idioms and expressions: never keep them. Replace them with plain words that say what they actually mean.
  Example: "made overprotectiveness a competitive sport" → "was extremely overprotective".
- Only rephrase a sentence if a swap would sound awkward, or if the sentence itself is hard to follow.
- The photo has line breaks from the printed page. Join lines into normal sentences and keep spaces between words. Rejoin words that were hyphenated across lines.
- Choose the synonym that matches the meaning in this context, not just the dictionary meaning.
- Keep the paragraph breaks.

5. List every hard word and every idiom you changed: the original, the easier version, whether it is a "word" or an "idiom", and the original sentence it came from.

If there is no readable text, return an empty "simplified" and an empty "words" list.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        language: { type: Type.STRING, enum: ["en", "fr"] },
        simplified: { type: Type.STRING },
        words: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    simple: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["word", "idiom"] },
                    sentence: { type: Type.STRING },
                },
                required: ["original", "simple", "type", "sentence"],
            },
        },
    },
    required: ["language", "simplified", "words"],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
    }

    const { image, mimeType = "image/jpeg" } = req.body ?? {};

    if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Missing image (base64 string)" });
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: "Unsupported image type" });
    }

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType, data: image } },
                        { text: "Simplify this page." },
                    ],
                },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0.2,
            },
        });

        const data = JSON.parse(response.text ?? "{}");
        return res.status(200).json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Couldn't simplify this page. Try again." });
    }
}