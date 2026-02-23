/**
 * Gemini Adapter for sanemos.ai
 * Implements the AIProvider interface using Google's Gemini API via fetch.
 */

export class GeminiAdapter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    }

    /**
     * Generate a response using Google Gemini API.
     * @param {Array<{role: string, content: string}>} messages
     * @param {Object} agentConfig - Agent configuration from agents.js
     * @returns {Promise<string>}
     */
    async generateResponse(messages, agentConfig) {
        // Transform standard messages to Gemini's format
        const rawContents = messages
            .filter(msg => msg.content && msg.content.trim()) // filter out empty messages
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

        // Gemini strict alternating requirement
        const contents = [];
        for (const msg of rawContents) {
            if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
                // If the role is the same as the previous message, append to the previous message
                contents[contents.length - 1].parts[0].text += '\n\n' + msg.parts[0].text;
            } else {
                contents.push(msg);
            }
        }

        // Gemini requires at least one user message to start the conversation
        if (contents.length === 0 || contents[0].role !== 'user') {
            contents.unshift({
                role: 'user',
                parts: [{ text: 'Hola / Hello' }]
            });
        }

        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: agentConfig.systemPrompt }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048,
                }
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Gemini API error:', error);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract content from Gemini response structure
        const candidate = data.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.text) {
            return candidate.content.parts[0].text;
        }

        return 'I\'m here for you. Could you tell me more?';
    }
}
