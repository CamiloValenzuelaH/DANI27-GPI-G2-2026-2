import { useState } from 'react';
import { useIntl } from 'react-intl';

import Card from '../components/common/Card';
import { isMissingDeepSeekKeyError, runDoubleAgentAudit, type AuditResponse } from '../../services/aiService';

type AuditPageProps = {
  // App.tsx hoy le pasa `t={t}`; lo dejamos opcional para no romper.
  t?: unknown;
};

export default function AuditPage(_props: AuditPageProps) {
  const intl = useIntl();
  const [evidenceText, setEvidenceText] = useState(
    intl.formatMessage({
      id: 'auditPage.evidenceSeed',
      defaultMessage: 'We have 5 physical servers in the main meeting room. The servers are on the conference table and any visitor can see them.',
    })
  );

  const [auditResponse, setAuditResponse] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onAnalyzeEvidence = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await runDoubleAgentAudit(evidenceText);
      setAuditResponse(response);
    } catch (err) {
      setAuditResponse(null);
      if (isMissingDeepSeekKeyError(err)) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(`${intl.formatMessage({ id: 'auditPage.analysisError', defaultMessage: 'Could not run the analysis' })}: ${err.message}`);
      } else {
        setErrorMessage(intl.formatMessage({ id: 'auditPage.unexpectedError', defaultMessage: 'Could not run the analysis בגלל an unexpected error.' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onClear = () => {
    setEvidenceText('');
    setAuditResponse(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{intl.formatMessage({ id: 'auditPage.title', defaultMessage: 'Evidence Audit Module (PoC)' })}</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          {intl.formatMessage({ id: 'auditPage.analyzeNew', defaultMessage: 'Analyze New Evidence' })}
        </button>
      </div>

      {/* Pantalla Dividida */}
      <div className="grid grid-cols-2 gap-6">
        {/* Izquierda - Input */}
        <Card title={intl.formatMessage({ id: 'auditPage.uploadTitle', defaultMessage: '📤 Upload Evidence' })}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1D26] dark:text-[#E4E7EE] mb-2">
                {intl.formatMessage({ id: 'auditPage.evidenceDescription', defaultMessage: 'Evidence Description' })}
              </label>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors resize-none bg-[#F7F8FA] dark:bg-[#111318] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE]"
                placeholder={intl.formatMessage({ id: 'auditPage.evidencePlaceholder', defaultMessage: 'Describe the evidence found...' })}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onAnalyzeEvidence}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-sm font-medium hover:bg-[#3D5BE0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? intl.formatMessage({ id: 'auditPage.analyzing', defaultMessage: 'Analyzing...' }) : intl.formatMessage({ id: 'auditPage.analyzeEvidence', defaultMessage: '🔍 Analyze Evidence' })}
              </button>
              <button
                onClick={onClear}
                className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg text-sm hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-all text-[#1A1D26] dark:text-[#E4E7EE]"
              >
                {intl.formatMessage({ id: 'auditPage.clear', defaultMessage: 'Clear' })}
              </button>
            </div>
          </div>
        </Card>

        {/* Derecha - Output */}
        <Card title={intl.formatMessage({ id: 'auditPage.resultTitle', defaultMessage: '📋 Analysis Result' })}>
          {errorMessage && (
            <div className="mb-4 p-4 bg-[#FEECEE] dark:bg-[#2A1214] border border-[#F4B4B8] dark:border-[#5A1E22] rounded-lg">
              <div className="text-sm font-semibold text-[#A1242A] dark:text-[#F06669]">{intl.formatMessage({ id: 'auditPage.error', defaultMessage: 'Error' })}</div>
              <div className="text-xs mt-1 text-[#A1242A] dark:text-[#F06669] whitespace-pre-wrap">{errorMessage}</div>
            </div>
          )}

          {auditResponse?.veredicto === 'NO CUMPLE' && (
            <div className="mb-4 p-4 bg-[#E5484D] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">⚠</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{intl.formatMessage({ id: 'auditPage.verdictNonCompliant', defaultMessage: 'VERDICT: NON-COMPLIANT' })}</div>
                  <div className="text-white/80 text-xs">{intl.formatMessage({ id: 'auditPage.correctiveAction', defaultMessage: 'Corrective action required' })}</div>
                </div>
              </div>
            </div>
          )}

          {auditResponse?.veredicto === 'CUMPLE' && (
            <div className="mb-4 p-4 bg-[#1DB954] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{intl.formatMessage({ id: 'auditPage.verdictCompliant', defaultMessage: 'VERDICT: COMPLIANT' })}</div>
                  <div className="text-white/80 text-xs">{intl.formatMessage({ id: 'auditPage.noActions', defaultMessage: 'No actions required' })}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bloque de Código JSON */}
          <div className="bg-[#1A1D26] rounded-lg p-4 overflow-x-auto">
            <pre className="text-[#E4E7EE] text-xs font-mono leading-relaxed">
              {auditResponse
                ? JSON.stringify(auditResponse, null, 2)
                : isLoading
                  ? '{\n  "status": "Analizando evidencia..."\n}'
                  : '{\n  "status": "' + intl.formatMessage({ id: 'auditPage.noResult', defaultMessage: 'No result yet. Enter evidence and press Analyze.' }) + '"\n}'}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
