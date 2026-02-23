/**
 * Anthropic Adapter for sanemos.ai
 * Implements the AIProvider interface using Anthropic's Messages API.
 */

export class AnthropicAdapter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    }

    /**
     * Generate a response using Anthropic's messages API.
     * @param {Array<{role: string, content: string}>} messages
     * @param {Object} agentConfig - Agent configuration from agents.js
     * @returns {Promise<string>}
     */
    async generateResponse(messages, agentConfig) {
        // Anthropic uses system as a top-level parameter, not a message
        const anthropicMessages = messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        }));

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                system: agentConfig.systemPrompt,
                messages: anthropicMessages,
                max_tokens: 500,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Anthropic API error:', error);
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || 'I\'m here for you. Could you tell me more?';
    }
}
