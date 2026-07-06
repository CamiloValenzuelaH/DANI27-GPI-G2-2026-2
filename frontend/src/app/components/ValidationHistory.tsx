import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { listExternalValidationJobs, getExternalValidationResult } from '../../api/externalValidation';
import type { ValidationReportResponse } from '../../api/externalValidation';
import { formatDateTime } from '../lib/date';

function getComplianceScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'processing': return 'text-yellow-500';
    case 'queued': return 'text-blue-400';
    case 'failed': return 'text-rose-500';
    default: return 'text-gray-400';
  }
}

function translateStatus(status: string, formatMessage: (v: { id: string; defaultMessage: string }) => string) {
  switch (status) {
    case 'completed': return formatMessage({ id: 'validation.status.completed', defaultMessage: 'Completed' });
    case 'processing': return formatMessage({ id: 'validation.status.processing', defaultMessage: 'Processing' });
    case 'queued': return formatMessage({ id: 'validation.status.queued', defaultMessage: 'Queued' });
    case 'failed': return formatMessage({ id: 'validation.status.failed', defaultMessage: 'Failed' });
    default: return status;
  }
}

function getDocumentStatusColor(status?: string) {
  switch (status) {
    case 'COMPLETO': return 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40';
    case 'INCOMPLETO': return 'bg-amber-600/25 text-amber-300 border-amber-500/40';
    case 'INEXISTENTE': return 'bg-rose-700/25 text-rose-300 border-rose-500/40';
    default: return 'bg-slate-700/25 text-slate-300 border-slate-500/40';
  }
}

export default function ValidationHistory() {
  const intl = useIntl();
  const [jobs, setJobs] = useState<ValidationReportResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [dateRange, setDateRange] = useState<'7'|'30'|'all'>('7');
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ValidationReportResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listExternalValidationJobs(50);
        if (!mounted) return;
        setJobs(data);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filteredJobs = useMemo(() => {
    const now = new Date();
    const days = dateRange === '7' ? 7 : dateRange === '30' ? 30 : Infinity;
    return jobs.filter((job) => {
      // date filter
      const d = new Date(job.created_at ?? job.updated_at ?? new Date().toISOString());
      const withinDays = days === Infinity ? true : ((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) <= days;
      if (!withinDays) return false;
      // search filter (file_name ILIKE %search%) - local, case-insensitive (debounced)
      if (!debouncedSearch) return true;
      const fname = (job.file_name ?? job.job_id ?? '').toLowerCase();
      return fname.includes(debouncedSearch.toLowerCase());
    });
  }, [jobs, debouncedSearch, dateRange]);

  const displayedJobs = filteredJobs.slice(0, visibleCount);

  const onView = async (jobId: string) => {
    setDetailLoading(true);
    setSelected(null);
    setError(null);
    try {
      const report = await getExternalValidationResult(jobId);
      setSelected(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{intl.formatMessage({ id: 'validation.historyTitle', defaultMessage: 'Validation history' })}</h3>
        <div className="text-sm text-gray-400">{loading ? intl.formatMessage({ id: 'common.loading', defaultMessage: 'Loading...' }) : intl.formatMessage({ id: 'validation.jobsCount', defaultMessage: '{count} jobs' }, { count: jobs.length })}</div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder={intl.formatMessage({ id: 'validation.searchPlaceholder', defaultMessage: 'Search by file name...' })}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(10); }}
          className="px-3 py-2 rounded-md bg-[#0B0D12] border border-[#22252F] text-sm text-white w-64"
        />
        <select
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value as '7'|'30'|'all'); setVisibleCount(10); }}
          className="px-3 py-2 rounded-md bg-[#0B0D12] border border-[#22252F] text-sm text-white"
        >
          <option value="7">{intl.formatMessage({ id: 'validation.last7Days', defaultMessage: 'Last 7 days' })}</option>
          <option value="30">{intl.formatMessage({ id: 'validation.last30Days', defaultMessage: 'Last 30 days' })}</option>
          <option value="all">{intl.formatMessage({ id: 'validation.all', defaultMessage: 'All' })}</option>
        </select>
        <div className="text-sm text-gray-400 ml-auto">{loading ? intl.formatMessage({ id: 'common.loading', defaultMessage: 'Loading...' }) : intl.formatMessage({ id: 'validation.jobsCount', defaultMessage: '{count} jobs' }, { count: filteredJobs.length })}</div>
      </div>

      <div className="bg-[#0F1119] border border-[#2A2E3D] rounded-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">{intl.formatMessage({ id: 'validation.table.file', defaultMessage: 'File' })}</th>
              <th className="px-4 py-3">{intl.formatMessage({ id: 'validation.table.score', defaultMessage: 'Score' })}</th>
              <th className="px-4 py-3">{intl.formatMessage({ id: 'validation.table.status', defaultMessage: 'Status' })}</th>
              <th className="px-4 py-3">{intl.formatMessage({ id: 'validation.table.action', defaultMessage: 'Action' })}</th>
            </tr>
          </thead>
          <tbody>
            {displayedJobs.map((job) => (
              <tr key={job.job_id} className="border-t border-[#1F2430]">
                <td className="px-4 py-3 text-gray-300">{formatDateTime(job.created_at ?? job.updated_at ?? new Date().toISOString())}</td>
                <td className="px-4 py-3 text-white">{job.file_name ?? job.job_id}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${getComplianceScoreColor(job.overall_score ?? 0)}`}>
                    {job.overall_score ?? 0}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${getStatusColor(job.status)}`}>{translateStatus(job.status, intl.formatMessage)}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onView(job.job_id)}
                    className="px-3 py-1.5 rounded-md bg-[#4F6EF7] hover:bg-[#3D5AD7] text-white text-xs"
                  >
                    {intl.formatMessage({ id: 'validation.viewDetail', defaultMessage: 'View detail' })}
                  </button>
                </td>
              </tr>
            ))}
            {filteredJobs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">{intl.formatMessage({ id: 'validation.noJobs', defaultMessage: 'No jobs found' })}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredJobs.length > displayedJobs.length && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + 10)}
            className="px-4 py-2 rounded-md bg-[#2B3350] text-white text-sm"
          >
            {intl.formatMessage({ id: 'common.viewMore', defaultMessage: 'View more' })}
          </button>
        </div>
      )}

      {error && (
        <div className="text-rose-300 text-sm">
          {error.includes('Not Found') || error.includes('not found')
            ? intl.formatMessage({ id: 'validation.detailUnavailable', defaultMessage: 'This result is not available. Only jobs completed after the latest update can be viewed in detail.' })
            : error}
        </div>
      )}

      {detailLoading && <div className="text-gray-400">{intl.formatMessage({ id: 'validation.loadingDetail', defaultMessage: 'Loading detail...' })}</div>}

      {selected && selected.status === 'completed' && (
        <div className="mt-4 space-y-3">
          <div className="bg-[#0F1119] p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">{intl.formatMessage({ id: 'validation.table.file', defaultMessage: 'File' })}</p>
            <p className="text-white font-medium">{selected.file_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F1119] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">{intl.formatMessage({ id: 'validation.avgCompliance', defaultMessage: 'Average compliance' })}</p>
              <p className={`text-2xl font-bold ${getComplianceScoreColor(selected.overall_score ?? 0)}`}>
                {selected.overall_score ?? 0}%
              </p>
            </div>
            <div className="bg-[#0F1119] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">{intl.formatMessage({ id: 'validation.table.status', defaultMessage: 'Status' })}</p>
              <p className={`font-medium ${getStatusColor(selected.status)}`}>
                {selected.status === 'completed' ? intl.formatMessage({ id: 'validation.completed', defaultMessage: 'Validation completed' }) : selected.status.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="bg-[#0F1119] p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">{intl.formatMessage({ id: 'validation.summary', defaultMessage: 'Summary' })}</p>
            <p className="text-white text-sm">{selected.summary}</p>
          </div>

          {selected.findings.length > 0 && (
            <div className="bg-[#0F1119] p-4 rounded-lg space-y-2">
              <p className="text-gray-400 text-sm mb-3">{intl.formatMessage({ id: 'validation.findingsByChunk', defaultMessage: 'Findings by ISO chunk' })}</p>
              <div className="space-y-2">
                {selected.findings.map((finding, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        finding.observations.some((o:any) => o.severity === 'critical') ? 'bg-red-900 text-red-200' :
                        finding.observations.some((o:any) => o.severity === 'major') ? 'bg-orange-900 text-orange-200' :
                        'bg-yellow-900 text-yellow-200'
                      }`}>
                        {finding.clause_ref}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-white font-medium">{finding.title}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${getDocumentStatusColor(finding.document_status)}`}>
                            {finding.document_status ?? ''}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{intl.formatMessage({ id: 'validation.scoreRelevance', defaultMessage: 'Score: {score}% · Relevance: {relevance}%' }, { score: finding.compliance_score, relevance: Math.round((finding.relevance_score ?? 0) * 100) })}</p>
                        {(finding.missing_elements?.length ?? 0) > 0 && (
                          <div className="mt-2">
                            <p className="text-rose-300 text-xs font-medium">{intl.formatMessage({ id: 'validation.missingElements', defaultMessage: 'Missing elements:' })}</p>
                            <ul className="mt-1 space-y-1 text-rose-200 text-xs list-disc list-inside">
                              {finding.missing_elements?.map((m:any, i:number) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        )}
                        {finding.observations.length > 0 && (
                          <ul className="mt-2 space-y-1 text-gray-300 text-xs">
                            {finding.observations.map((obs:any, oi:number) => (
                              <li key={oi}><span className="font-semibold uppercase">[{obs.severity}]</span> {obs.text}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
