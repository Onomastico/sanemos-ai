/**
 * AI Moderation Service — sanemos.ai
 *
 * Autonomous content moderation for user-submitted resources and reviews.
 * Uses the same AI provider system as the chat companions.
 *
 * Decision logic:
 *   - confidence >= 0.85 AND decision === 'approve' → auto-approve
 *   - any rejection suggestion → stays 'pending' for human review
 *   - confidence < 0.85 or decision === 'pending' → stays 'pending'
 *   - on any AI failure → safe fallback to 'pending'
 */

import { createAIProvider } from '@/lib/ai/provider';

const CONFIDENCE_THRESHOLD = 0.85;

// ── Prompts ──────────────────────────────────────────────────────────────────

const RESOURCE_PROMPT = `You are a content moderator for sanemos.ai, a grief support platform. Your job is to review user-submitted resources.

ABOUT THE PLATFORM:
sanemos.ai helps people dealing with grief and loss. Appropriate resources include books, movies, series, songs, comics, manga, posts, or other media related to grief, loss, mental wellness, healing, or emotional support. Resources from any worldview (secular, religious, spiritual) are welcome.

APPROVE if:
- It appears to be a real, identifiable resource (a known title, a plausible book/movie/song/etc.)
- It has some connection to grief, loss, mental health, healing, or emotional support
- The title and description make sense and are coherent

REJECT if:
- The title is clearly gibberish, spam, or nonsense
- It contains hate speech, explicit sexual content, or graphic violence
- It is clearly commercial advertising disguised as a resource

Set decision to "pending" (escalate to human) if:
- You are genuinely unsure whether it is relevant to grief or mental wellness
- The resource is real but the connection to the platform's purpose is not clear
- Anything else that doesn't clearly fit APPROVE or REJECT

Respond with ONLY valid JSON, no explanation, no markdown, no code blocks:
{"decision":"approve","reason":"brief reason in the same language as the submission","confidence":0.92}`;

const THERAPIST_PROMPT = `You are a pre-screening assistant for sanemos.ai, a grief support platform. Your job is to evaluate therapist submissions from users before a human admin reviews them.

IMPORTANT: You are NOT the final decision maker. The human admin always decides. Your role is to write a clear, useful analysis to help them prioritize their review queue.

EVALUATE the submission on these signals:
1. Required fields: Is full_name, city, and modality present and coherent?
2. Bio quality: Does it read like a real mental health professional? (not random characters, not unrelated advertising, not generic filler like "I am a therapist")
3. Specializations: Are they related to grief, loss, trauma, or mental wellness?
4. Contact info: Is email, phone, or website present? (signal of legitimacy)
5. Credentials: Is a license number or credentials URL present? (strong signal)
6. Consistency: Does all the information make sense together?

APPROVE (high confidence only — all of these must be true):
- All required fields are present and coherent
- Bio sounds like a genuine mental health professional
- At least one contact method is present
- Specializations are relevant to grief or mental wellness

REJECT (very high bar — only for obvious spam):
- Name consists of random characters or is clearly fake
- Bio is completely incoherent or is advertising unrelated services
- The submission is obviously not a real person or therapist

Set decision to "pending" (use for most cases — write your analysis as the reason):
- Missing optional fields but not obviously fake
- Bio is generic but could be legitimate
- You are uncertain — describe what's missing or suspicious

Respond with ONLY valid JSON, no explanation, no markdown, no code blocks:
{"decision":"pending","reason":"brief analysis to help the admin decide","confidence":0.70}`;

const MESSAGE_PROMPT = `You are a content moderator for sanemos.ai, a grief support platform. Your job is to evaluate chat messages sent in community rooms between real users.

THE MOST IMPORTANT DISTINCTION YOU MUST MAKE:
- SELF-EXPRESSION (about the sender's own feelings) → ALWAYS PASS
- DIRECTED AT ANOTHER PERSON (attacking, insulting, or wishing harm to someone else) → VIOLATION

ALWAYS PASS — self-expression of grief (even very intense):
- "I want to die", "quiero morir", "why am I still here", "I can't go on"
- Expressing personal anger, sadness, despair, or pain about one's own life
- Talking about one's own loss, death thoughts, trauma

VIOLATION — directed harassment (use second person as the signal: "you", "tú", "te", "vos"):
- Telling another person to die or kill themselves: "die", "muerete", "matate", "why don't you kill yourself", "go kill yourself", "ojalá te murieras"
- Direct insults aimed at a specific person: "bastardo", "idiota", "imbécil", "chuchetumare", combined with hostile intent
- Wishing death or harm on a specific person: "I hope you die", "ojala te mueras"
- Harassment, threats, or hate speech targeting a person or group
- Spam or commercial advertising
- Sharing someone else's private information without consent

WARN — for borderline cases:
- Mild rudeness that may be frustration rather than targeted harassment
- Genuinely ambiguous messages where you cannot determine intent

LANGUAGE NOTE: Messages may be in Spanish, English, or any other language. Apply the same logic regardless of language.

Respond with ONLY valid JSON, no explanation, no markdown, no code blocks:
{"decision":"pass","reason":"brief reason","confidence":0.97}`;

const REVIEW_PROMPT = `You are a content moderator for sanemos.ai, a grief support platform. Your job is to review user-submitted comments and ratings on resources.

APPROVE if:
- The comment is a genuine personal opinion about the resource (even if brief, neutral, or critical)
- The tone is respectful toward other people (criticism of the resource itself is fine)
- It is in any language

REJECT if:
- It contains insults, hate speech, or harassment directed at people or groups
- It is clear spam (repeated characters, completely off-topic, commercial advertising)

Set decision to "pending" (escalate to human) if:
- The comment is borderline (e.g., mildly rude but might be genuine frustration)
- You are not sure

Respond with ONLY valid JSON, no explanation, no markdown, no code blocks:
{"decision":"approve","reason":"brief reason","confidence":0.95}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const SAFE_FALLBACK = { decision: 'pending', reason: 'AI unavailable', confidence: 0, autoApprove: false };

const VALID_DECISIONS = new Set(['approve', 'reject', 'pending', 'pass', 'warn', 'violation']);

function parseAIResponse(text) {
    try {
        // Strip markdown code fences if the AI ignored the instruction
        const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        // Find the first {...} block
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        const parsed = JSON.parse(match[0]);
        if (!VALID_DECISIONS.has(parsed.decision)) return null;
        if (typeof parsed.confidence !== 'number') return null;
        return parsed;
    } catch {
        return null;
    }
}

async function getActiveProvider(adminClient) {
    const { data } = await adminClient
        .from('system_settings')
        .select('value')
        .eq('key', 'active_ai_provider')
        .single();
    if (!data?.value) return 'openai';
    return typeof data.value === 'string' ? data.value.replace(/"/g, '') : data.value;
}

async function isFlagEnabled(adminClient, key) {
    const { data } = await adminClient
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();
    // If the key doesn't exist, default to enabled
    if (!data) return true;
    // Handles both boolean true and string "true"
    return data.value !== false && data.value !== 'false';
}

async function callModerationAI(adminClient, systemPrompt, contentObj) {
    const providerName = await getActiveProvider(adminClient);
    const provider = createAIProvider(providerName);

    const messages = [
        {
            role: 'user',
            content: JSON.stringify(contentObj),
        },
    ];

    const rawResponse = await provider.generateResponse(messages, { systemPrompt });
    return parseAIResponse(rawResponse);
}

function applyDecisionLogic(parsed) {
    if (!parsed) return SAFE_FALLBACK;

    const { decision, reason, confidence } = parsed;

    // Preserve the raw AI decision for admin badge visibility.
    // autoApprove drives the actual status update; decision is kept as-is for display.
    const autoApprove = decision === 'approve' && confidence >= CONFIDENCE_THRESHOLD;

    return { decision, reason, confidence, autoApprove };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Moderates a user-submitted resource.
 * @param {Object} resource - The resource data (title, description, type, etc.)
 * @param {Object} adminClient - Supabase admin client
 * @returns {{ decision: string, reason: string, confidence: number }}
 */
export async function moderateResource(resource, adminClient) {
    try {
        const enabled = await isFlagEnabled(adminClient, 'moderation_resources_enabled');
        if (!enabled) return { decision: 'pending', reason: 'Moderation disabled', confidence: 0 };

        const contentObj = {
            title: resource.title,
            type: resource.type,
            description: resource.description || '',
            author: resource.author_or_creator || '',
            focus_theme: resource.focus_theme || '',
            worldview: resource.worldview || '',
            url: resource.external_url || '',
            cover_url: resource.cover_url || '',
        };

        const parsed = await callModerationAI(adminClient, RESOURCE_PROMPT, contentObj);
        const result = applyDecisionLogic(parsed);

        // The AI cannot view images — block auto-approval for any resource with a cover URL.
        // A human admin must visually verify the image before it goes public.
        if (resource.cover_url && result.autoApprove) {
            return {
                ...result,
                autoApprove: false,
                reason: (result.reason || '') + ' (cover image requires human verification)',
            };
        }

        return result;
    } catch (err) {
        console.error('[moderation] moderateResource error:', err);
        return SAFE_FALLBACK;
    }
}

/**
 * Moderates a user-submitted review/comment.
 * @param {Object} review - The review data (rating, comment)
 * @param {string} resourceTitle - Title of the resource being reviewed (for context)
 * @param {Object} adminClient - Supabase admin client
 * @returns {{ decision: string, reason: string, confidence: number }}
 */
export async function moderateReview(review, resourceTitle, adminClient) {
    try {
        const enabled = await isFlagEnabled(adminClient, 'moderation_reviews_enabled');
        if (!enabled) return { decision: 'pending', reason: 'Moderation disabled', confidence: 0 };

        const contentObj = {
            resource_title: resourceTitle,
            rating: review.rating,
            comment: review.comment || '',
        };

        const parsed = await callModerationAI(adminClient, REVIEW_PROMPT, contentObj);
        return applyDecisionLogic(parsed);
    } catch (err) {
        console.error('[moderation] moderateReview error:', err);
        return SAFE_FALLBACK;
    }
}

// Higher approval threshold for therapists — they appear in the directory as verified professionals
const THERAPIST_CONFIDENCE_THRESHOLD = 0.92;

/**
 * Pre-screens a user-submitted therapist before human admin review.
 * The AI primarily generates analysis to help the admin; auto-approval only on very high confidence.
 * Auto-rejection is NEVER performed — a human always makes the final call.
 * @param {Object} therapist - The therapist data
 * @param {Object} adminClient - Supabase admin client
 * @returns {{ decision: string, reason: string, confidence: number, autoApprove: boolean }}
 */
export async function moderateTherapist(therapist, adminClient) {
    try {
        const enabled = await isFlagEnabled(adminClient, 'moderation_therapists_enabled');
        if (!enabled) return { decision: 'pending', reason: 'Moderation disabled', confidence: 0, autoApprove: false };

        const contentObj = {
            full_name: therapist.full_name,
            title: therapist.title || '',
            bio: therapist.bio || '',
            city: therapist.city || '',
            country: therapist.country || '',
            modality: therapist.modality || '',
            languages: Array.isArray(therapist.languages) ? therapist.languages.join(', ') : (therapist.languages || ''),
            specializations: Array.isArray(therapist.specializations) ? therapist.specializations.join(', ') : (therapist.specializations || ''),
            license_number: therapist.license_number || '',
            email: therapist.email ? '(provided)' : '',
            phone: therapist.phone ? '(provided)' : '',
            website: therapist.website ? '(provided)' : '',
            credentials_url: therapist.credentials_url ? '(provided)' : '',
        };

        const parsed = await callModerationAI(adminClient, THERAPIST_PROMPT, contentObj);
        if (!parsed) return { ...SAFE_FALLBACK };

        const { decision, reason, confidence } = parsed;
        // Only auto-approve with very high confidence — never auto-reject
        const autoApprove = decision === 'approve' && confidence >= THERAPIST_CONFIDENCE_THRESHOLD;

        return { decision, reason, confidence, autoApprove };
    } catch (err) {
        console.error('[moderation] moderateTherapist error:', err);
        return SAFE_FALLBACK;
    }
}

const JOURNAL_PROMPT = `You are a content moderator for sanemos.ai, a grief support platform. Your job is to review journal entries that users want to share publicly in the "Community Journals" section.

ABOUT THE PLATFORM:
sanemos.ai helps people dealing with grief and loss. The community journals section is a space for authentic personal expression — people sharing their grief journey with others who understand.

APPROVE if:
- It is a genuine personal reflection about loss, grief, emotions, healing, or life experiences
- Creative writing, poetry, or storytelling related to personal experience
- Content that is painful, sad, or even dark — this is a grief platform
- The content, even if imperfect, reads like a real person expressing themselves

REJECT if:
- It is clearly spam, advertising, or commercial promotion
- It contains hate speech, slurs, or content targeting a specific person or group
- It contains explicit sexual content
- It shares another person's private information without consent
- It is completely incoherent gibberish with no real message

Set decision to "pending" (escalate to human) if:
- The content is ambiguous and you cannot confidently classify it
- It contains mentions of active crisis (e.g., "I am going to hurt myself right now") — note in the reason that it may need immediate support
- You are genuinely unsure

IMPORTANT: When in doubt, escalate to pending. Do NOT reject content just because it is emotionally intense — grief is intense.

Respond with ONLY valid JSON, no explanation, no markdown, no code blocks:
{"decision":"approve","reason":"brief reason in the same language as the entry","confidence":0.90}`;

// Threshold for chat violations — low enough to catch clear harassment in any language
const MESSAGE_VIOLATION_THRESHOLD = 0.75;

function applyMessageDecision(parsed) {
    if (!parsed) return { decision: 'pass', reason: 'Moderation unavailable', confidence: 0 };
    const { decision, reason, confidence } = parsed;

    // Only hard-block when the AI is very sure — protect grief expressions
    if (decision === 'violation' && confidence >= MESSAGE_VIOLATION_THRESHOLD) {
        return { decision: 'violation', reason, confidence };
    }
    // Uncertain violations and explicit warns → flag for human review but allow through
    if (decision === 'warn' || decision === 'violation') {
        return { decision: 'warn', reason, confidence };
    }
    return { decision: 'pass', reason, confidence };
}

/**
 * Moderates a journal entry that a user wants to make public.
 * Never auto-rejects — worst case escalates to human review.
 * @param {{ title?: string, content: string }} entry - The journal entry
 * @param {Object} adminClient - Supabase admin client
 * @returns {{ decision: string, reason: string, confidence: number, autoApprove: boolean }}
 */
export async function moderateJournal(entry, adminClient) {
    try {
        const enabled = await isFlagEnabled(adminClient, 'moderation_journal_enabled');
        if (!enabled) return { decision: 'approve', reason: 'Moderation disabled', confidence: 1, autoApprove: true };

        const contentObj = {
            title: entry.title || '',
            content: entry.content || '',
        };

        const parsed = await callModerationAI(adminClient, JOURNAL_PROMPT, contentObj);
        return applyDecisionLogic(parsed);
    } catch (err) {
        console.error('[moderation] moderateJournal error:', err);
        return SAFE_FALLBACK;
    }
}

const LETTER_PROMPT = `You are a content moderator for sanemos.ai, a grief support platform. Your job is to review letters that users want to share publicly in the "Community Letters" section.

ABOUT THE PLATFORM:
sanemos.ai helps people dealing with grief and loss. The letters section is a space for heartfelt short messages — words of comfort, reflections on loss, encouragement from one grieving person to another.

APPROVE if:
- It is a genuine personal reflection on loss, grief, healing, or human connection
- Words of comfort, encouragement, or empathy for others going through grief
- Creative writing, poetry, or personal storytelling related to loss
- Content that is painful, sad, or emotionally intense — this is a grief platform

REJECT if:
- It is clearly spam, advertising, or commercial promotion
- It contains hate speech, slurs, or content targeting a specific person or group
- It contains explicit sexual content
- It shares another person's private information without consent
- It is completely incoherent gibberish with no real message

Set decision to "pending" (escalate to human) if:
- The content is ambiguous and you cannot confidently classify it
- It contains mentions of active crisis (e.g., "I am going to hurt myself right now") — note in the reason that it may need immediate support
- You are genuinely unsure

IMPORTANT: When in doubt, escalate to pending. Do NOT reject content just because it is emotionally intense — grief is intense.

Respond with ONLY valid JSON, no explanation, no markdown, no code blocks:
{"decision":"approve","reason":"brief reason in the same language as the letter","confidence":0.90}`;

/**
 * Moderates a letter that a user wants to share publicly.
 * Never auto-rejects — worst case escalates to human review.
 * @param {{ content: string, loss_type?: string, worldview?: string }} letter - The letter data
 * @param {Object} adminClient - Supabase admin client
 * @returns {{ decision: string, reason: string, confidence: number, autoApprove: boolean }}
 */
export async function moderateLetter(letter, adminClient) {
    try {
        const enabled = await isFlagEnabled(adminClient, 'moderation_letters_enabled');
        if (!enabled) return { decision: 'approve', reason: 'Moderation disabled', confidence: 1, autoApprove: true };

        const contentObj = {
            content: letter.content || '',
            loss_type: letter.loss_type || '',
            worldview: letter.worldview || '',
        };

        const parsed = await callModerationAI(adminClient, LETTER_PROMPT, contentObj);
        return applyDecisionLogic(parsed);
    } catch (err) {
        console.error('[moderation] moderateLetter error:', err);
        return SAFE_FALLBACK;
    }
}

/**
 * Moderates a community chat message synchronously (before it is saved).
 * Only call this for non-AI conversations.
 * @param {string} content - The raw message text
 * @param {Object} adminClient - Supabase admin client
 * @returns {{ decision: 'pass'|'warn'|'violation', reason: string, confidence: number }}
 */
export async function moderateMessage(content, adminClient) {
    try {
        const enabled = await isFlagEnabled(adminClient, 'moderation_chat_enabled');
        // Safe fallback for chat: always pass when moderation is off or AI is unavailable
        if (!enabled) return { decision: 'pass', reason: 'Moderation disabled', confidence: 0 };

        const parsed = await callModerationAI(adminClient, MESSAGE_PROMPT, { message: content });
        return applyMessageDecision(parsed);
    } catch (err) {
        console.error('[moderation] moderateMessage error:', err);
        // Fail open for chat — never block a message because moderation crashed
        return { decision: 'pass', reason: 'Moderation error', confidence: 0 };
    }
}
