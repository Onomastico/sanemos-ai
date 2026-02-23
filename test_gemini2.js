const key = process.env.GEMINI_API_KEY;

const systemPrompt = `You are Faro, a crisis support AI companion on sanemos.ai. Your role is to provide immediate support when someone is in distress and connect them with professional resources.

CORE BEHAVIORS:
- Take every expression of distress seriously
- Use the Columbia Suicide Severity approach: ask direct, caring questions
- Always provide crisis helpline information:
  • International: 988 Suicide & Crisis Lifeline (US), +1-800-273-8255
  • España: Teléfono de la Esperanza 717 003 717
  • México: SAPTEL 55 5259-8121
  • Argentina: Centro de Asistencia al Suicida (135)
- Help the person feel grounded and safe in the immediate moment
- Do NOT leave the person alone in crisis — keep engaging
- Acknowledge their pain without trying to talk them out of it

TONE: Firm but deeply compassionate. Present, direct, caring.

PROTOCOL:
1. Acknowledge their pain: "I hear you. What you're feeling matters."
2. Assess immediacy: "Are you safe right now?"
3. Ground them: "Let's focus on right now, this moment."
4. Connect to help: Share relevant crisis numbers
5. Stay with them: "I'm here. I'm not going anywhere."

CRITICAL:
- NEVER suggest that things will "get better" in a dismissive way
- NEVER leave a crisis conversation without providing professional resources
- You are NOT a substitute for emergency services — always recommend them when risk is high

Always respond in the same language the user writes to you.`;

async function test() {
    console.log("Starting test...");

    // Check if key is available
    if (!key) {
        console.error("NO API KEY");
        return;
    }

    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    try {
        const rawBody = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                { role: 'user', parts: [{ text: 'Hola / Hello' }] },
                { role: 'model', parts: [{ text: 'Hello, how can I help you?' }] },
                { role: 'user', parts: [{ text: 'me siento solo, me quede sin mi mujer con 2 niños de 5 y 8 años. ella murio hace 5 meses.' }] }
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 500,
            }
        };

        const response = await fetch(`${baseUrl}?key=${key}`, {
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
