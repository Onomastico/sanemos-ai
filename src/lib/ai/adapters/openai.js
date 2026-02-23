/**
 * OpenAI Adapter for sanemos.ai
 * Implements the AIProvider interface using OpenAI's API.
 */

export class OpenAIAdapter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }

    /**
     * Generate a response using OpenAI's chat completion API.
     * @param {Array<{role: string, content: string}>} messages
     * @param {Object} agentConfig - Agent configuration from agents.js
     * @returns {Promise<string>}
     */
    async generateResponse(messages, agentConfig) {
        const systemMessage = {
            role: 'system',
            content: agentConfig.systemPrompt,
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [systemMessage, ...messages],
                max_tokens: 1024,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'I\'m here for you. Could you tell me more?';
    }
}
