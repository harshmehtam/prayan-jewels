'use client';

import React, { useRef, useCallback } from 'react';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  required = false,
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={`border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t-lg">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-2 rounded hover:bg-gray-200 text-sm font-bold"
          title="Bold"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-2 rounded hover:bg-gray-200 text-sm italic"
          title="Italic"
        >
          I
        </button>

        <button
          type="button"
          onClick={() => formatText('underline')}
          className="p-2 rounded hover:bg-gray-200 text-sm underline"
          title="Underline"
        >
          U
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="p-2 rounded hover:bg-gray-200 text-sm"
          title="Bullet List"
        >
          • List
        </button>

        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="p-2 rounded hover:bg-gray-200 text-sm"
          title="Numbered List"
        >
          1. List
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              formatText('formatBlock', e.target.value);
              e.target.value = '';
            }
          }}
          className="px-2 py-1 rounded text-sm border border-gray-300 hover:bg-gray-200"
          defaultValue=""
        >
          <option value="">Format</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Paragraph</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => formatText('removeFormat')}
          className="p-2 rounded hover:bg-gray-200 text-sm"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
          style={{ whiteSpace: 'pre-wrap' }}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: value }}
        />
        {!value && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}
    </div>
  );
}