import 'dotenv/config';
import { GeminiAdapter } from './src/lib/ai/adapters/gemini.js';
import { AGENTS } from './src/lib/ai/agents.js';

async function test() {
    console.log("Starting test...");
    const adapter = new GeminiAdapter(process.env.GEMINI_API_KEY);
    const messages = [
        { role: 'user', content: 'me siento solo, me quede sin mi mujer con 2 niños de 5 y 8 años. ella murio hace 5 meses.' }
    ];

    const faroConfig = AGENTS.faro;

    try {
        const rawBody = {
            systemInstruction: {
                parts: [{ text: faroConfig.systemPrompt }]
            },
            contents: [
                { role: 'user', parts: [{ text: 'Hola / Hello' }] },
                { role: 'model', parts: [{ text: 'Hello, how can I help you?' }] },
                { role: 'user', parts: [{ text: messages[0].content }] }
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 500,
            }
        };

        const response = await fetch(`${adapter.baseUrl}?key=${adapter.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawBody)
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
