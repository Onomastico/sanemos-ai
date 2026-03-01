/**
 * Strips all HTML tags except the small safe set used by RichEditor.
 * Allowed: b, strong, i, em, ul, ol, li, p, br
 *
 * @param {string} html - Raw HTML from the editor
 * @returns {string} Sanitized HTML safe to store and render
 */
export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    // Remove all tags that are NOT in the allowed list
    return html.replace(/<(?!\/?(?:b|strong|i|em|ul|ol|li|p|br)\b)[^>]*>/gi, '');
}
