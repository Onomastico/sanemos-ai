/**
 * AI Provider — Provider-agnostic interface
 * 
 * Reads AI_PROVIDER from env to determine which adapter to use.
 * When no API key is configured, returns a graceful fallback response.
 */

import { OpenAIAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { GeminiAdapter } from './adapters/gemini';

/**
 * @typedef {Object} AIMessage
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 */

/**
 * @typedef {Object} AIProviderInterface
 * @property {function(AIMessage[], Object): Promise<string>} generateResponse
 */

/**
 * Creates the appropriate AI provider based on environment config.
 * Falls back gracefully if no API key is configured.
 * @returns {AIProviderInterface}
 */
export function createAIProvider(dynamicProvider = null) {
    const provider = dynamicProvider || process.env.AI_PROVIDER || 'openai';

    switch (provider) {
        case 'openai':
            if (!process.env.OPENAI_API_KEY) return new FallbackProvider();
            return new OpenAIAdapter(process.env.OPENAI_API_KEY);

        case 'anthropic':
            if (!process.env.ANTHROPIC_API_KEY) return new FallbackProvider();
            return new AnthropicAdapter(process.env.ANTHROPIC_API_KEY);

        case 'gemini':
            if (!process.env.GEMINI_API_KEY) return new FallbackProvider();
            return new GeminiAdapter(process.env.GEMINI_API_KEY);

        default:
            console.warn(`Unknown AI provider: ${provider}, using fallback`);
            return new FallbackProvider();
    }
}

/**
 * Fallback provider used when no API key is configured.
 * Returns a helpful message instead of an error.
 */
class FallbackProvider {
    async generateResponse(messages, agentConfig) {
        const lastMessage = messages[messages.length - 1];
        const lang = this.detectLanguage(lastMessage?.content || '');

        if (lang === 'es') {
            return `Hola, soy ${agentConfig.name} ${agentConfig.emoji}. En este momento no puedo generar respuestas inteligentes porque no hay un proveedor de IA configurado. Por favor, pide al administrador que configure una API key en las variables de entorno.\n\nMientras tanto, recuerda: no estás solo/a en esto. 💙`;
        }

        return `Hello, I'm ${agentConfig.name} ${agentConfig.emoji}. I can't generate intelligent responses right now because no AI provider is configured. Please ask the administrator to set up an API key in the environment variables.\n\nIn the meantime, remember: you're not alone in this. 💙`;
    }

    detectLanguage(text) {
        const spanishIndicators = /[áéíóúñ¿¡]|(\b(hola|como|estoy|soy|que|mi|por|para|con|los|las|una|uno)\b)/i;
        return spanishIndicators.test(text) ? 'es' : 'en';
    }
}
