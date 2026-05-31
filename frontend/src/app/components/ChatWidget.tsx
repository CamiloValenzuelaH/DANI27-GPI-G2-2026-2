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
