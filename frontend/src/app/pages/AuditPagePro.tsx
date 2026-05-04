import { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, MessageCircle, Send } from 'lucide-react';
import type { AuditValidationResponse, AuditFinding } from '../../api/audit';
import { validateAudit } from '../../api/audit';

interface ChatMessage {
  id: number;
  text: string;
  isAgent: boolean;
  timestamp: Date;
}

export default function AuditPage() {
  const [title, setTitle] = useState('Evaluación de Seguridad Física');
  const [description, setDescription] = useState('Auditoría de controles de acceso físico');
  const [evidenceText, setEvidenceText] = useState(
    'Tenemos 5 servidores físicos en la sala de reuniones principal. Los servidores están sobre la mesa de conferencias y cualquier visitante puede verlos.'
  );
  const [auditType, setAuditType] = useState<'security' | 'compliance' | 'operational' | 'financial'>('security');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  const [auditResponse, setAuditResponse] = useState<AuditValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: '¡Hola! Soy el Agente de Auditoría. Estoy listo para analizar tu evidencia de cumplimiento y proporcionar validación basada en estándares ISO 27001.',
      isAgent: true,
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const onValidateAudit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await validateAudit({
        title,
        description,
        evidence_text: evidenceText,
        audit_type: auditType,
        priority
      });
      setAuditResponse(response);

      // Agregar mensaje del agente al chat
      setChatMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `He completado el análisis de auditoría. Score de cumplimiento: ${response.overall_compliance_score}%. Status: ${response.status}. Se encontraron ${response.findings.length} hallazgos.`,
        isAgent: true,
        timestamp: new Date()
      }]);
    } catch (err) {
      setAuditResponse(null);
      if (err instanceof Error) {
        setErrorMessage(`Error en la validación: ${err.message}`);
      } else {
        setErrorMessage('Error desconocido en la validación');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSendChatMessage = () => {
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, {
      id: prev.length + 1,
      text: chatInput,
      isAgent: false,
      timestamp: new Date()
    }]);

    // Simular respuesta del agente
    setTimeout(() => {
      let agentResponse = '';
      if (chatInput.toLowerCase().includes('riesgo') || chatInput.toLowerCase().includes('critical')) {
        agentResponse = 'Los riesgos críticos identificados incluyen: acceso físico no controlado a equipamiento, falta de MFA, y políticas de rotación de credenciales insuficientes.';
      } else if (chatInput.toLowerCase().includes('recomendación')) {
        agentResponse = 'Te recomiendo: 1) Implementar acceso físico controlado, 2) Activar MFA en todos los sistemas, 3) Establecer políticas de rotación de credenciales cada 90 días.';
      } else {
        agentResponse = 'Entendido. Basándome en el análisis de auditoría, puedo ayudarte con consultas sobre hallazgos, recomendaciones, o próximos pasos.';
      }

      setChatMessages(prev => [...prev, {
        id: prev.length + 1,
        text: agentResponse,
        isAgent: true,
        timestamp: new Date()
      }]);
    }, 500);

    setChatInput('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'non_compliant': return 'text-red-600';
      case 'needs_review': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1119] to-[#1A1D28] p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Principal - Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Auditoría de Cumplimiento</h1>
            <p className="text-gray-400">Valida tu evidencia de conformidad con estándares ISO 27001</p>
          </div>

          {/* Formulario */}
          <div className="bg-[#1A1D28] border border-[#2A2E3D] rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Título de la Auditoría</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Evaluación de Seguridad Física"
                className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#4F6EF7]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve de la auditoría"
                className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#4F6EF7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Auditoría</label>
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value as any)}
                  className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4F6EF7]"
                >
                  <option value="security">Seguridad</option>
                  <option value="compliance">Cumplimiento</option>
                  <option value="operational">Operacional</option>
                  <option value="financial">Financiero</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4F6EF7]"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Evidencia</label>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Describe la evidencia a analizar..."
                rows={6}
                className="w-full bg-[#0F1119] border border-[#2A2E3D] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#4F6EF7]"
              />
            </div>

            {errorMessage && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-600 text-sm">{errorMessage}</div>
              </div>
            )}

            <button
              onClick={onValidateAudit}
              disabled={isLoading}
              className="w-full bg-[#4F6EF7] hover:bg-[#3D5AD7] disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
            >
              {isLoading ? 'Validando...' : 'Validar Auditoría'}
            </button>
          </div>

          {/* Resultados */}
          {auditResponse && (
            <div className="bg-[#1A1D28] border border-[#2A2E3D] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Resultados de Auditoría</h2>
                <div className={`text-4xl font-bold ${getComplianceScoreColor(auditResponse.overall_compliance_score)}`}>
                  {auditResponse.overall_compliance_score}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F1119] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Estado</p>
                  <p className={`text-lg font-semibold ${getStatusColor(auditResponse.status)}`}>
                    {auditResponse.status === 'compliant' ? '✓ Conforme' : auditResponse.status === 'non_compliant' ? '✗ No Conforme' : '⚠ Requiere Revisión'}
                  </p>
                </div>
                <div className="bg-[#0F1119] p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Hallazgos</p>
                  <p className="text-lg font-semibold text-white">{auditResponse.findings.length}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3">Hallazgos Detectados</h3>
                <div className="space-y-3">
                  {auditResponse.findings.map((finding, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(finding.severity)}`}>
                      <div className="font-semibold mb-1">{finding.issue}</div>
                      <div className="text-sm mb-2">Severidad: <span className="capitalize font-medium">{finding.severity}</span></div>
                      <div className="text-sm mb-2"><strong>Recomendación:</strong> {finding.recommendation}</div>
                      <div className="text-sm"><strong>Impacto:</strong> {finding.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F1119] p-4 rounded-lg border border-[#2A2E3D]">
                <p className="text-gray-400 text-sm mb-2">Notas del Agente</p>
                <p className="text-white text-sm">{auditResponse.agent_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat del Agente */}
        <div className="lg:col-span-1">
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full mb-4 bg-[#4F6EF7] hover:bg-[#3D5AD7] text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-5 h-5" />
            {showChat ? 'Cerrar Chat' : 'Abrir Chat'}
          </button>

          {showChat && (
            <div className="bg-[#1A1D28] border border-[#2A2E3D] rounded-xl flex flex-col h-[600px]">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isAgent ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.isAgent
                          ? 'bg-[#4F6EF7] text-white'
                          : 'bg-[#2A2E3D] text-gray-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="border-t border-[#2A2E3D] p-4 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSendChatMessage()}
                  placeholder="Pregunta al agente..."
                  className="flex-1 bg-[#0F1119] border border-[#2A2E3D] rounded px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#4F6EF7]"
                />
                <button
                  onClick={onSendChatMessage}
                  className="bg-[#4F6EF7] hover:bg-[#3D5AD7] text-white px-3 py-2 rounded transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
