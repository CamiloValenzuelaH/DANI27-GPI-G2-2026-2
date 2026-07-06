import { useCallback, useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

export interface DocumentEditorProps {
  title: string
  content: string
  onChange?: (content: string) => void
  onSave?: (title: string, content: string) => void
  onUpload?: (title: string, content: string) => void
  readOnly?: boolean
}

type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'separator'

interface ToolbarButton {
  command: FormatCommand
  label: string
  icon: string
  title: string
}

const TOOLBAR_BUTTONS: (ToolbarButton | { separator: true })[] = [
  { command: 'heading1', label: 'H1', icon: 'H1', title: 'Título 1' },
  { command: 'heading2', label: 'H2', icon: 'H2', title: 'Título 2' },
  { command: 'heading3', label: 'H3', icon: 'H3', title: 'Título 3' },
  { separator: true },
  { command: 'bold', label: 'B', icon: 'B', title: 'Negrita' },
  { command: 'italic', label: 'I', icon: 'I', title: 'Cursiva' },
  { command: 'underline', label: 'U', icon: 'U', title: 'Subrayado' },
  { separator: true },
  { command: 'bulletList', label: '•—', icon: '•—', title: 'Lista sin orden' },
  { command: 'orderedList', label: '1.', icon: '1.', title: 'Lista ordenada' },
  { command: 'blockquote', label: '❝', icon: '❝', title: 'Cita' },
]

// Convierte markdown básico a HTML para el editor
function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  let html = markdown
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list items
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    // Ordered list items
    .replace(/^\s*\d+\. (.+)$/gm, '<oli>$1</oli>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`)
    // Wrap consecutive <oli> in <ol>
    .replace(/(<oli>.*<\/oli>\n?)+/gs, (match) =>
      `<ol>${match.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>')}</ol>`,
    )
    // Paragraphs: lines that are not block elements
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<hr') ||
        trimmed.startsWith('</ul') ||
        trimmed.startsWith('</ol') ||
        trimmed.startsWith('</li')
      ) {
        return trimmed
      }
      return `<p>${trimmed}</p>`
    })
    .filter(Boolean)
    .join('\n')

  return html
}

// Convierte HTML del editor de vuelta a markdown básico
function htmlToMarkdown(html: string): string {
  if (!html) return ''
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong><em>(.*?)<\/em><\/strong>/gi, '***$1***')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<hr\s*\/?>/gi, '---\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

function countChars(html: string): number {
  return html.replace(/<[^>]+>/g, '').length
}

export default function DocumentEditor({
  title,
  content,
  onChange,
  onSave,
  onUpload,
  readOnly = false,
}: DocumentEditorProps) {
  const intl = useIntl()
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)
  const [editableTitle, setEditableTitle] = useState(title)
  const [isSaved, setIsSaved] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inicializar contenido del editor
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
        if (isInternalChange.current) {
          isInternalChange.current = false
          return
        }
      const html = markdownToHtml(content)
      if (editorRef.current.innerHTML !== html){
        editorRef.current.innerHTML = html
        setWordCount(countWords(html))
        setCharCount(countChars(html))
      }
      
    }
  }, [content])

  useEffect(() => {
    setEditableTitle(title)
  }, [title])

  const updateStats = useCallback(() => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    setWordCount(countWords(html))
    setCharCount(countChars(html))
  }, [])

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>()
    if (document.queryCommandState('bold')) formats.add('bold')
    if (document.queryCommandState('italic')) formats.add('italic')
    if (document.queryCommandState('underline')) formats.add('underline')
    setActiveFormats(formats)
  }, [])

  const handleInput = useCallback(() => {
    isInternalChange.current = true
    updateStats()
    updateActiveFormats()
    if (onChange && editorRef.current) {
      onChange(htmlToMarkdown(editorRef.current.innerHTML))
    }
    // Auto-save visual feedback con debounce
    setIsSaved(false)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => setIsSaved(true), 1500)
  }, [onChange, updateStats, updateActiveFormats])

  const applyFormat = useCallback(
    (command: FormatCommand) => {
      if (!editorRef.current || readOnly) return
      editorRef.current.focus()

      switch (command) {
        case 'bold':
          document.execCommand('bold', false)
          break
        case 'italic':
          document.execCommand('italic', false)
          break
        case 'underline':
          document.execCommand('underline', false)
          break
        case 'heading1':
          document.execCommand('formatBlock', false, 'h1')
          break
        case 'heading2':
          document.execCommand('formatBlock', false, 'h2')
          break
        case 'heading3':
          document.execCommand('formatBlock', false, 'h3')
          break
        case 'bulletList':
          document.execCommand('insertUnorderedList', false)
          break
        case 'orderedList':
          document.execCommand('insertOrderedList', false)
          break
        case 'blockquote':
          document.execCommand('formatBlock', false, 'blockquote')
          break
      }

      updateActiveFormats()
      handleInput()
    },
    [readOnly, handleInput, updateActiveFormats],
  )

  const handleCopy = useCallback(async () => {
    if (!editorRef.current) return
    const markdown = htmlToMarkdown(editorRef.current.innerHTML)
    await navigator.clipboard.writeText(markdown)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [])

  const handleSave = useCallback(() => {
    if (!onSave || !editorRef.current) return
    const markdown = htmlToMarkdown(editorRef.current.innerHTML)
    onSave(editableTitle, markdown)
    setIsSaved(true)
  }, [onSave, editableTitle])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            applyFormat('bold')
            break
          case 'i':
            e.preventDefault()
            applyFormat('italic')
            break
          case 'u':
            e.preventDefault()
            applyFormat('underline')
            break
          case 's':
            e.preventDefault()
            handleSave()
            break
        }
      }
    },
    [applyFormat, handleSave],
  )

  const handleFocus = useCallback(() => {
  if (!editorRef.current) return
  const range = document.createRange()
  const selection = window.getSelection()
  range.selectNodeContents(editorRef.current)
  range.collapse(false) // false = colapsa al final
  selection?.removeAllRanges()
  selection?.addRange(range)
}, [])

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#2A2E3D] bg-[#0B1116] shadow-sm overflow-hidden transition-all dark:bg-[#111318] dark:border-[#2A2E3D] ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2A2E3D] px-5 py-3 bg-[#0F1729]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider shrink-0 dark:text-[#93C5FD]">
            Editor
          </span>
          {readOnly ? (
            <span className="text-sm font-semibold text-slate-700 truncate dark:text-white">{editableTitle}</span>
          ) : (
            <input
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-800 dark:text-white focus:outline-none border-b border-transparent focus:border-blue-400 transition-colors"
              placeholder={intl.formatMessage({ id: 'documentEditor.titlePlaceholder', defaultMessage: 'Document title' })}
            />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Stats */}
          <span className="hidden sm:block text-xs text-slate-400 dark:text-white/60">
            {intl.formatMessage(
              { id: 'documentEditor.stats', defaultMessage: '{words} words · {chars} characters' },
              { words: wordCount, chars: charCount },
            )}
          </span>
          {/* Auto-save indicator */}
          {!readOnly && (
            <span
              className={`text-xs transition-opacity ${isSaved ? 'text-green-500 opacity-100' : 'text-slate-300 opacity-60'}`}
            >
              {isSaved
                ? intl.formatMessage({ id: 'documentEditor.saved', defaultMessage: '✓ Saved' })
                : intl.formatMessage({ id: 'documentEditor.unsaved', defaultMessage: '○ Unsaved' })}
            </span>
          )}
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            title={intl.formatMessage({ id: 'documentEditor.copyAsText', defaultMessage: 'Copy as text' })}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition dark:text-white/60 dark:hover:bg-[#0F1729]"
          >
            {isCopied
              ? intl.formatMessage({ id: 'documentEditor.copied', defaultMessage: '✓ Copied' })
              : intl.formatMessage({ id: 'documentEditor.copy', defaultMessage: 'Copy' })}
          </button>
          
          {/* Upload button */}
          {onUpload && !readOnly && (
            <button
              type="button"
              onClick={() => {
                if (editorRef.current) {
                  onUpload(editableTitle, htmlToMarkdown(editorRef.current.innerHTML))
                }
              }}
              className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 transition"
            >
              {intl.formatMessage({ id: 'documentEditor.upload', defaultMessage: 'Upload' })}
            </button>
          )}

          {/* Save button */}
          {onSave && !readOnly && (
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              {intl.formatMessage({ id: 'documentEditor.save', defaultMessage: 'Save' })}
            </button>
          )}
          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen
              ? intl.formatMessage({ id: 'documentEditor.exitFullscreen', defaultMessage: 'Exit fullscreen' })
              : intl.formatMessage({ id: 'documentEditor.fullscreen', defaultMessage: 'Fullscreen' })}
            className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            {isFullscreen ? '⊠' : '⊡'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[#2A2E3D] px-3 py-1.5 bg-[#0F1729]">
          {TOOLBAR_BUTTONS.map((item, index) => {
            if ('separator' in item) {
              return <div key={`sep-${index}`} className="w-px h-6 bg-slate-200/10 mx-2" />
            }
            const isActive = activeFormats.has(item.command)
            return (
              <button
                key={item.command}
                type="button"
                title={intl.formatMessage({ id: `documentEditor.toolbar.${item.command}`, defaultMessage: item.title })}
                onMouseDown={(e) => {
                  e.preventDefault() // evita perder el foco del editor
                  applyFormat(item.command)
                }}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition select-none ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-[#0F1729]'
                } ${item.command === 'bold' ? 'font-extrabold' : ''} ${item.command === 'italic' ? 'italic' : ''} ${item.command === 'underline' ? 'underline' : ''}`}
              >
                {item.label}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-400 dark:text-white/60">
            <kbd className="rounded border border-[#2A2E3D] px-1 py-0.5 font-mono text-xs">Ctrl+B</kbd>
            <kbd className="rounded border border-[#2A2E3D] px-1 py-0.5 font-mono text-xs">Ctrl+I</kbd>
            <kbd className="rounded border border-[#2A2E3D] px-1 py-0.5 font-mono text-xs">Ctrl+S</kbd>
          </div>
        </div>
      )}

      {/* Editor area */}
      <div
        className={`flex-1 overflow-y-auto ${isFullscreen ? 'max-h-[calc(100vh-8rem)]' : 'max-h-[600px]'}`}
      >
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          dir="ltr"
          onFocus={handleFocus}
          style={{ unicodeBidi: 'plaintext', direction: 'ltr' }}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onKeyDown={handleKeyDown}
          spellCheck
          className={`min-h-[400px] px-8 py-6 text-sm leading-7 text-white focus:outline-none bg-[#071016]
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-[#2A2E3D] [&_h1]:pb-2
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-1
            [&_p]:mb-3 [&_p]:text-white
            [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc [&_ul_li]:mb-1
            [&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol_li]:mb-1
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white [&_blockquote]:my-3
            [&_hr]:border-[#2A2E3D] [&_hr]:my-6
            [&_strong]:font-semibold [&_strong]:text-white
            ${readOnly ? 'cursor-default' : 'cursor-text'}
          `}
          data-placeholder={intl.formatMessage({ id: 'documentEditor.placeholder', defaultMessage: 'Start typing or generate a document with AI...' })}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#2A2E3D] px-5 py-2 bg-[#0F1729] text-xs text-white/60">
        <span className="text-white/60">{intl.formatMessage({ id: 'documentEditor.footerBrand', defaultMessage: 'ISO 27001 · DANI Platform' })}</span>
        <span className="sm:hidden text-white/60">{intl.formatMessage({ id: 'documentEditor.mobileWords', defaultMessage: '{count} words' }, { count: wordCount })}</span>
      </div>

      {/* Placeholder CSS via style tag */}
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
