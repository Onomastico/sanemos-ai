'use client';

import { useRef, useEffect, useCallback } from 'react';
import styles from './RichEditor.module.css';

/**
 * Minimal rich text editor using contentEditable.
 * Supported formatting: Bold, Italic, Unordered list, Ordered list.
 *
 * Props:
 *   value       {string}   - Initial HTML content (set once on mount)
 *   onChange    {function} - Called with innerHTML string on every change
 *   placeholder {string}   - Placeholder text shown when empty
 *   disabled    {boolean}  - Disables editing
 */
export default function RichEditor({ value = '', onChange, placeholder = '', disabled = false }) {
    const editorRef = useRef(null);
    const isInitialized = useRef(false);

    // Set initial content once (don't overwrite while user is typing)
    useEffect(() => {
        if (editorRef.current && !isInitialized.current) {
            editorRef.current.innerHTML = value || '';
            isInitialized.current = true;
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (onChange && editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const execCmd = useCallback((command, value = null) => {
        editorRef.current?.focus();
        // eslint-disable-next-line no-restricted-globals
        document.execCommand(command, false, value);
        handleInput();
    }, [handleInput]);

    const handleKeyDown = useCallback((e) => {
        // Ctrl/Cmd + B → Bold, Ctrl/Cmd + I → Italic
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCmd('bold'); }
        if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCmd('italic'); }
    }, [execCmd]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar} aria-label="Formatting toolbar">
                <button type="button" onClick={() => execCmd('bold')} className={styles.toolBtn} title="Bold (Ctrl+B)" disabled={disabled}>
                    <strong>B</strong>
                </button>
                <button type="button" onClick={() => execCmd('italic')} className={styles.toolBtn} title="Italic (Ctrl+I)" disabled={disabled}>
                    <em>I</em>
                </button>
                <button type="button" onClick={() => execCmd('insertUnorderedList')} className={styles.toolBtn} title="Bullet list" disabled={disabled}>
                    ≡
                </button>
                <button type="button" onClick={() => execCmd('insertOrderedList')} className={styles.toolBtn} title="Numbered list" disabled={disabled}>
                    1.
                </button>
            </div>
            <div
                ref={editorRef}
                contentEditable={!disabled}
                suppressContentEditableWarning
                className={`${styles.editor} ${disabled ? styles.disabled : ''}`}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
                role="textbox"
                aria-multiline="true"
                aria-label="Journal entry content"
            />
        </div>
    );
}
