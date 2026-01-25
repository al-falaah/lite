import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Table,
  BookOpen,
  Lightbulb,
  AlignLeft,
  AlignCenter,
  Eye,
  Code2,
  Undo,
  Redo
} from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  
  // Undo/Redo state
  const [history, setHistory] = useState([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Update history when value changes (but not during undo/redo)
  useEffect(() => {
    if (!isUndoRedoAction.current && value !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(value);
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
    isUndoRedoAction.current = false;
  }, [value]);

  // Handle keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      else if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
               ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [historyIndex, history]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const insertAtCursor = (before, after = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToWrap = selectedText || defaultText;
    
    const newText = value.substring(0, start) + before + textToWrap + after + value.substring(end);
    onChange(newText);

    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = start + before.length + textToWrap.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertBlock = (blockText) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Find the start of the current line
    const beforeCursor = value.substring(0, start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    
    // Check if we're at the start of a line
    const isStartOfLine = start === lineStart || beforeCursor.slice(lineStart).trim() === '';
    
    const prefix = isStartOfLine ? '' : '\n';
    const suffix = '\n';
    
    const newText = value.substring(0, start) + prefix + blockText + suffix + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      const newCursorPos = start + prefix.length + blockText.length + suffix.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatHeading = (level) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const selectedText = value.substring(start, textarea.selectionEnd);
    const headingTag = `h${level}`;
    
    insertAtCursor(`<${headingTag}>`, `</${headingTag}>`, selectedText || `Heading ${level}`);
  };

  const formatBold = () => insertAtCursor('<strong>', '</strong>', 'bold text');
  const formatItalic = () => insertAtCursor('<em>', '</em>', 'italic text');
  const formatUnderline = () => insertAtCursor('<u>', '</u>', 'underlined text');
  const formatCode = () => insertAtCursor('<code>', '</code>', 'code');
  
  const formatList = () => {
    insertBlock('<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>');
  };
  
  const formatOrderedList = () => {
    insertBlock('<ol>\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ol>');
  };
  
  const formatBlockquote = () => {
    insertBlock('<blockquote>\n  Quote text here\n</blockquote>');
  };

  const formatArabicText = () => {
    insertBlock('<div class="verse">\n  Arabic text here (Quranic or otherwise)\n</div>');
  };

  const formatTip = () => {
    insertBlock('<div class="tip">\n  Your helpful tip here\n</div>');
  };

  const formatTable = () => {
    const tableHTML = `<table>
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
      <th>Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Row 1, Col 1</td>
      <td>Row 1, Col 2</td>
      <td>Row 1, Col 3</td>
    </tr>
    <tr>
      <td>Row 2, Col 1</td>
      <td>Row 2, Col 2</td>
      <td>Row 2, Col 3</td>
    </tr>
  </tbody>
</table>`;
    insertBlock(tableHTML);
  };

  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      insertAtCursor(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">`, '</a>', linkText);
      setLinkUrl('');
      setLinkText('');
      setShowLinkInput(false);
    }
  };

  const formatParagraph = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const selectedText = value.substring(start, textarea.selectionEnd);
    
    insertAtCursor('<p>', '</p>', selectedText || 'Paragraph text');
  };

  const formatLineBreak = () => {
    insertAtCursor('<br>\n');
  };

  const FormatButton = ({ icon: Icon, onClick, title, className = '' }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton 
            icon={Undo} 
            onClick={handleUndo} 
            title="Undo (Ctrl+Z)" 
            className={historyIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}
          />
          <FormatButton 
            icon={Redo} 
            onClick={handleRedo} 
            title="Redo (Ctrl+Y)" 
            className={historyIndex === history.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}
          />
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton icon={Bold} onClick={formatBold} title="Bold (Ctrl+B)" />
          <FormatButton icon={Italic} onClick={formatItalic} title="Italic (Ctrl+I)" />
          <FormatButton icon={Underline} onClick={formatUnderline} title="Underline (Ctrl+U)" />
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton icon={Heading1} onClick={() => formatHeading(1)} title="Heading 1" />
          <FormatButton icon={Heading2} onClick={() => formatHeading(2)} title="Heading 2" />
          <FormatButton icon={Heading3} onClick={() => formatHeading(3)} title="Heading 3" />
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton icon={List} onClick={formatList} title="Bulleted List" />
          <FormatButton icon={ListOrdered} onClick={formatOrderedList} title="Numbered List" />
          <FormatButton icon={Quote} onClick={formatBlockquote} title="Blockquote" />
        </div>

        {/* Code & Link */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton icon={Code} onClick={formatCode} title="Inline Code" />
          <FormatButton 
            icon={Link} 
            onClick={() => setShowLinkInput(!showLinkInput)} 
            title="Insert Link"
            className={showLinkInput ? 'bg-gray-200' : ''}
          />
        </div>

        {/* Special Blocks */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton icon={BookOpen} onClick={formatArabicText} title="Arabic Text Block" />
          <FormatButton icon={Lightbulb} onClick={formatTip} title="Tip Box" />
          <FormatButton icon={Table} onClick={formatTable} title="Insert Table" />
        </div>

        {/* Alignment & Misc */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <FormatButton icon={AlignLeft} onClick={formatParagraph} title="Paragraph" />
          <button
            type="button"
            onClick={formatLineBreak}
            title="Line Break"
            className="px-2 py-1 text-xs font-mono text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            &lt;br&gt;
          </button>
        </div>

        {/* Preview Toggle */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              showPreview 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Link Input Panel */}
      {showLinkInput && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Link Text</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Click here"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={handleInsertLink}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Area */}
      {showPreview ? (
        <div className="p-6 bg-white min-h-[400px] max-h-[600px] overflow-y-auto">
          <style>{`
            .verse {
              font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif !important;
              font-size: 28px !important;
              line-height: 2 !important;
              text-align: center;
              direction: rtl;
              font-style: normal !important;
              font-weight: normal !important;
            }
          `}</style>
          <div 
            className="prose max-w-none
              prose-headings:font-normal prose-headings:text-gray-900
              prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4 prose-h1:font-bold
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-4 prose-li:my-1 prose-li:text-gray-700
              prose-ol:my-4
              prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-gray-50 prose-pre:text-gray-900 prose-pre:border prose-pre:border-gray-200
              prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
              prose-table:border-collapse prose-table:w-full
              prose-th:bg-gray-50 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-sm
              prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 prose-td:text-sm
              [&_.verse]:text-2xl [&_.verse]:text-center [&_.verse]:my-8 [&_.verse]:text-gray-900 [&_.verse]:leading-relaxed [&_.verse]:py-4
              [&_.tip]:bg-blue-50 [&_.tip]:border-l-2 [&_.tip]:border-blue-400 [&_.tip]:px-4 [&_.tip]:py-3 [&_.tip]:my-4
              [&_.tip:before]:content-['💡_Tip:'] [&_.tip:before]:font-semibold [&_.tip:before]:text-blue-700 [&_.tip:before]:block [&_.tip:before]:mb-1"
            style={{ fontFamily: 'inherit' }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={20}
          className="w-full px-4 py-3 focus:outline-none focus:ring-0 border-0 font-mono text-sm resize-none"
          style={{ minHeight: '400px', maxHeight: '600px' }}
        />
      )}

      {/* Helper Text */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
        <div className="flex items-start gap-2">
          <Code2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Special blocks:</span> 
            <span className="ml-1">Use the toolbar buttons to insert Arabic text blocks, tip boxes, and tables.</span>
            <span className="ml-2 text-gray-500">Arabic text uses Amiri font.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
