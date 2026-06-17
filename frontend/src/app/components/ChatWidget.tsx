<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';

interface ChatMessage {
  id: number;
  text: string;
  isAi: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  darkMode: boolean;
  t: any;
}

export default function ChatWidget({ darkMode, t }: ChatWidgetProps) {
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: '¡Hola! Soy Dani, tu asistente de cumplimiento. ¿En qué puedo ayudarte hoy?',
      isAi: true,
      timestamp: new Date(),
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes('hola') || msg.includes('hello') || msg.includes('hi')) {
      return '¡Hola! ¿En qué aspecto del cumplimiento necesitas ayuda? Puedo asistirte con controles ISO 27001, evidencias, CAPAs, o cualquier pregunta sobre el sistema.';
    }
    if (msg.includes('ayuda') || msg.includes('help')) {
      return 'Puedo ayudarte con: 1) Análisis de brechas de cumplimiento, 2) Gestión de controles ISO 27001, 3) Seguimiento de evidencias, 4) Gestión de CAPAs, 5) Preparación de auditorías. ¿Con cuál te gustaría empezar?';
    }
    if (msg.includes('iso') || msg.includes('27001')) {
      return 'ISO 27001:2022 es el estándar internacional de seguridad de la información. Actualmente tienes 72% de cumplimiento general. ¿Te gustaría ver un análisis detallado de tus controles?';
    }
    if (msg.includes('audit') || msg.includes('auditoría')) {
      return 'Tu preparación para auditoría está al 68%. Tienes 3 no conformidades críticas que deben resolverse. ¿Quieres que genere un informe pre-auditoría?';
    }
    if (msg.includes('capa') || msg.includes('finding')) {
      return 'Tienes 8 CAPAs abiertas, 3 de ellas vencidas. Las más críticas son NC-2024-015 (45 días) y NC-2025-002 (38 días). ¿Necesitas ayuda para priorizarlas?';
    }
    if (msg.includes('evidence') || msg.includes('evidencia')) {
      return 'Tienes 142 elementos de evidencia total. 87 son auto-recopilados y 12 son evidencias de efectividad. Hay una brecha del 18% en evidencias de pruebas reales. ¿Quieres recomendaciones?';
    }
    if (msg.includes('riesgo') || msg.includes('risk')) {
      return 'Tienes 24 riesgos identificados, 6 de nivel crítico/alto. Los riesgos más importantes son ransomware (R-001) y acceso no autorizado a PII (R-002). ¿Necesitas un plan de tratamiento?';
    }
    if (msg.includes('gracias') || msg.includes('thanks')) {
      return '¡De nada! Estoy aquí para ayudarte con tu programa de cumplimiento. No dudes en preguntar cualquier cosa.';
    }

    return 'Entiendo tu consulta. Para darte una mejor respuesta, ¿podrías especificar si se trata de: controles, evidencias, CAPAs, riesgos o preparación de auditoría?';
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: chatMessages.length + 1,
      text: chatMessage,
      isAi: false,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMsg]);
    setChatMessage('');

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: chatMessages.length + 2,
        text: getBotResponse(chatMessage),
        isAi: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  return (
    <>
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-7 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showChat && (
        <div className={`fixed bottom-[88px] right-7 w-[370px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden ${darkMode ? 'bg-[#1A1D28]' : 'bg-white'}`}>
          <div className="px-5 py-4 bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Dani AI</div>
              <div className="text-[11px] opacity-75">Online — Compliance Assistant</div>
            </div>
            <button onClick={() => setShowChat(false)} className="opacity-70 hover:opacity-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 max-h-[340px] overflow-y-auto space-y-2.5">
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} ai={msg.isAi} darkMode={darkMode}>
                {msg.text}
              </ChatBubble>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className={`p-3 border-t flex gap-2 ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.chatPlaceholder}
              className={`flex-1 px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7] ${
                darkMode
                  ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                  : 'bg-white border-[#E2E5EB] text-[#1A1D26]'
              }`}
            />
            <button
              onClick={handleSendMessage}
              className="px-3.5 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3D5BE0] transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {t.send}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ChatBubble({ ai, darkMode, children }: { ai?: boolean; darkMode: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
        ai
          ? 'bg-[#EEF1FE] dark:bg-[#1C2340] text-[#1A1D26] dark:text-[#E4E7EE] rounded-bl-sm'
          : 'bg-[#4F6EF7] text-white ml-auto rounded-br-sm'
      }`}
    >
      {children}
    </div>
  );
}
=======
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, MessageCircle, Send } from 'lucide-react';
import { usePreferences } from '../components/AppShell';
import { clearChatConversation, executeDocumentChatAction, getChatHistory, sendChatMessage, streamDocumentChat, type ChatMode, type ChatActionOption } from '../../api/chat';

interface ChatMessage {
  id: number;
  text: string;
  role: 'user' | 'assistant';
  timestamp: string;
  pending?: boolean;
}

interface ChatWidgetProps {
  darkMode: boolean;
  t: any;
}

const CHAT_CONVERSATION_KEY = 'dani_chat_conversation_id';

function createConversationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `conv-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

const localizedUiText = {
  es: {
    clear: 'Limpiar',
    documentMode: 'Modo ISO habilitado. Abre un documento para usar el modo de documento.',
  },
  en: {
    clear: 'Clear',
    documentMode: 'ISO mode enabled. Open a document to use document mode.',
  },
  pt: {
    clear: 'Limpar',
    documentMode: 'Modo ISO ativado. Abra um documento para usar o modo de documento.',
  },
  it: {
    clear: 'Pulisci',
    documentMode: 'Modalità ISO abilitata. Apri un documento per usare la modalità documento.',
  },
  de: {
    clear: 'Löschen',
    documentMode: 'ISO-Modus aktiviert. Öffne ein Dokument, um den Dokumentmodus zu verwenden.',
  },
  fr: {
    clear: 'Effacer',
    documentMode: 'Mode ISO activé. Ouvrez un document pour utiliser le mode document.',
  },
} as const;

function getInitialGreeting(language: 'es' | 'en' | 'pt' | 'it' | 'de' | 'fr') {
  switch (language) {
    case 'en':
      return 'Hello, I am Dani, your professional ISO 27001 compliance assistant. How can I help you?';
    case 'pt':
      return 'Olá, sou Dani, seu assistente profissional de conformidade ISO 27001. Como posso ajudar?';
    case 'de':
      return 'Hallo, ich bin Dani, Ihr professioneller ISO 27001-Compliance-Assistent. Wie kann ich Ihnen helfen?';
    case 'it':
      return 'Ciao, sono Dani, il tuo assistente professionale per la conformità ISO 27001. Come posso aiutarti?';
    case 'fr':
      return 'Bonjour, je suis Dani, votre assistant professionnel de conformité ISO 27001. Comment puis-je vous aider?';
    default:
      return 'Hola, soy Dani, tu asistente profesional de cumplimiento ISO 27001. ¿En qué puedo ayudarte?';
  }
}

export default function ChatWidget({ darkMode, t }: ChatWidgetProps) {
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [mode, setMode] = useState<ChatMode>('iso');
  const [isStreaming, setIsStreaming] = useState(false);
  const preferences = usePreferences();
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [actionOptions, setActionOptions] = useState<ChatActionOption[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);

  const documentId = useMemo(() => new URLSearchParams(location.search).get('docId'), [location.search]);

  const chatLanguage = (preferences.language || 'es') as 'es' | 'en' | 'pt' | 'it' | 'de' | 'fr';

  useEffect(() => {
    const handleOpenChat = () => setShowChat(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  useEffect(() => {
    if (!conversationId) {
      const stored = window.localStorage.getItem(CHAT_CONVERSATION_KEY) || createConversationId();
      window.localStorage.setItem(CHAT_CONVERSATION_KEY, stored);
      setConversationId(stored);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const loadHistory = async () => {
      try {
        const history = await getChatHistory(conversationId);
        setChatMessages(
          history.map((item) => ({
            id: nextIdRef.current++,
            text: item.content,
            role: item.role,
            timestamp: item.timestamp,
          })),
        );
      } catch {
        setChatMessages([
          {
            id: nextIdRef.current++,
            text: getInitialGreeting(chatLanguage),
            role: 'assistant',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    loadHistory();
  }, [conversationId]);

  useEffect(() => {
    if (!documentId && mode !== 'iso') {
      setMode('iso');
    }
  }, [documentId, mode]);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  const addAssistantMessage = (text: string, pending = false) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: nextIdRef.current++,
        text,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        pending,
      },
    ]);
  };

  const updateLastAssistantMessage = (delta: string) => {
    setChatMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === 'assistant') {
          next[i] = {
            ...next[i],
            text: next[i].text + delta,
          };
          return next;
        }
      }
      return next;
    });
  };

  const handleSendMessage = async (overrideText?: string) => {
    const userText = (overrideText ?? chatMessage).trim();
    if (!userText || isStreaming) return;

    const userMsg: ChatMessage = {
      id: nextIdRef.current++,
      text: userText,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatMessage('');
    setError(null);
    setActionOptions([]);

    const payload = {
      message: userText,
      conversationId,
      mode: documentId ? mode : 'iso',
      language: chatLanguage,
    };

    if (documentId && mode !== 'iso') {
      setIsStreaming(true);
      addAssistantMessage('', true);

      await streamDocumentChat(
        documentId,
        payload,
        (chunk) => {
          updateLastAssistantMessage(chunk);
        },
        (meta) => {
          setIsStreaming(false);
          setActionOptions(meta.actionOptions ?? []);
          if (!showChat) {
            setUnreadCount((count) => count + 1);
          }
        },
        (err) => {
          setIsStreaming(false);
          setError(err.message);
          addAssistantMessage('Lo siento, no pude procesar la solicitud. Intenta de nuevo.', false);
        },
      );
    } else {
      setIsStreaming(true);
      addAssistantMessage('Escribiendo...', true);

      try {
        const response = await sendChatMessage(payload);
        setChatMessages((prev) =>
          prev.map((message) =>
            message.role === 'assistant' && message.pending
              ? {
                  ...message,
                  text: response.message,
                  pending: false,
                }
              : message,
          ),
        );
        setActionOptions(response.actionOptions ?? []);
        if (!showChat) {
          setUnreadCount((count) => count + 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setChatMessages((prev) =>
          prev.map((message) =>
            message.role === 'assistant' && message.pending
              ? {
                  ...message,
                  text: 'Lo siento, no pude procesar la solicitud. Intenta de nuevo.',
                  pending: false,
                }
              : message,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    }
  };

  const handleActionClick = async (action: ChatActionOption) => {
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: nextIdRef.current++,
      text: action.label,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setError(null);
    setActionOptions([]);
    setIsStreaming(true);
    addAssistantMessage('Procesando acción...', true);

    try {
      if (documentId) {
        const response = await executeDocumentChatAction(documentId, {
          action,
          conversationId,
          mode,
        });

        setChatMessages((prev) =>
          prev.map((message) =>
            message.role === 'assistant' && message.pending
              ? {
                  ...message,
                  text: response.message,
                  pending: false,
                }
              : message,
          ),
        );
        setActionOptions(response.actionOptions ?? []);
      } else {
        handleSendMessage(action.command?.trim() || action.label.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setChatMessages((prev) =>
        prev.map((message) =>
          message.role === 'assistant' && message.pending
            ? {
                ...message,
                text: 'Lo siento, no pude procesar la acción. Intenta de nuevo.',
                pending: false,
              }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const clearConversation = async () => {
    if (isStreaming) return;

    try {
      await clearChatConversation(conversationId);
    } catch {
      // Ignorar errores al limpiar el historial remoto
    }

    const newConversationId = createConversationId();
    window.localStorage.setItem(CHAT_CONVERSATION_KEY, newConversationId);
    setConversationId(newConversationId);
    setChatMessage('');
    setChatMessages([
      {
        id: nextIdRef.current++,
        text: getInitialGreeting(chatLanguage),
        role: 'assistant',
        timestamp: new Date().toISOString(),
      },
    ]);
    setError(null);
    setActionOptions([]);
    setUnreadCount(0);
  };

  const toggleChat = () => {
    setShowChat((prev) => !prev);
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-7 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {showChat && (
        <div className={`fixed bottom-[88px] right-7 w-[420px] min-h-[520px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden ${darkMode ? 'bg-[#1A1D28]' : 'bg-white'}`}>
          <div className="px-5 py-4 bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Dani AI</div>
              <div className="text-[11px] opacity-75">Asistente ISO 27001</div>
            </div>
            <button
              type="button"
              onClick={clearConversation}
              className="mr-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] text-white transition hover:bg-white/20"
            >
              {localizedUiText[chatLanguage].clear}
            </button>
            <button onClick={toggleChat} className="opacity-70 hover:opacity-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-[12px] text-slate-600 dark:border-[#2A2E3D] dark:bg-[#161923] dark:text-slate-300">
            {documentId ? (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">Modo de chat</span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as ChatMode)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] dark:border-[#2A2E3D] dark:bg-[#111318] dark:text-white"
                >
                  <option value="iso">ISO</option>
                  <option value="document">Documento</option>
                  <option value="both">Documento + ISO</option>
                </select>
              </div>
            ) : (
              <div>{localizedUiText[chatLanguage].documentMode}</div>
            )}
          </div>

          <div className="flex-1 p-4 max-h-[340px] overflow-y-auto space-y-2.5">
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} ai={msg.role === 'assistant'} darkMode={darkMode} pending={msg.pending}>
                {msg.text}
              </ChatBubble>
            ))}
            <div ref={chatEndRef} />
          </div>

          {error ? (
            <div className="px-4 py-2 text-sm text-red-600">{error}</div>
          ) : null}

          {actionOptions.length > 0 ? (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 dark:border-[#2A2E3D] dark:bg-[#161923]">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sugerencias de acción
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {actionOptions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleActionClick(action)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-900 hover:bg-slate-100 transition dark:border-[#2A2E3D] dark:bg-[#111318] dark:text-white dark:hover:bg-[#1D2234]"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={`p-3 border-t flex gap-2 ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.chatPlaceholder ?? 'Escribe tu pregunta aquí...'}
              className={`flex-1 px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7] ${
                darkMode
                  ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                  : 'bg-white border-[#E2E5EB] text-[#1A1D26]'
              }`}
              disabled={isStreaming}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isStreaming}
              className="px-3.5 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3D5BE0] transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {isStreaming ? 'Escribiendo...' : t.send}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type ChatBubbleProps = {
  ai?: boolean
  darkMode: boolean
  pending?: boolean
  children: React.ReactNode
}

function ChatBubble({ ai, darkMode, pending, children }: ChatBubbleProps) {
  return (
    <div
      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
        ai
          ? `bg-[#EEF1FE] dark:bg-[#1C2340] text-[#1A1D26] dark:text-[#E4E7EE] rounded-bl-sm ${pending ? 'opacity-80 italic' : ''}`
          : 'bg-[#4F6EF7] text-white ml-auto rounded-br-sm'
      }`}
    >
      {children}
    </div>
  );
}
>>>>>>> Chat-bot
