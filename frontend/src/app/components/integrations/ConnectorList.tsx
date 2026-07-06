import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import ConnectorCard from './ConnectorCard';
import { fetchConnectors, ConnectorInfo } from './connectorsApi';

export default function ConnectorList() {
  const intl = useIntl();
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchConnectors()
      .then((data) => {
        if (mounted) setConnectors(data);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: connectors.length,
      connected: connectors.filter((item) => item.status === 'connected').length,
      syncing: connectors.filter((item) => item.status === 'syncing').length,
      upcoming: connectors.filter((item) => item.status === 'upcoming').length,
    }),
    [connectors]
  );

  return (
    <div className="px-4 py-8 sm:px-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="inline-flex rounded-full bg-slate-800/70 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
              {intl.formatMessage({ id: 'integrations.hub', defaultMessage: 'Integrations Hub' })}
            </p>
            <h1 className="text-3xl font-semibold text-white">{intl.formatMessage({ id: 'menu.integrations' })}</h1>
            <p className="max-w-2xl text-slate-400">
              {intl.formatMessage({ id: 'integrations.subtitle', defaultMessage: 'Centralize service connections, automate synchronization, and reduce manual work.' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
        <div className="rounded-[24px] border border-slate-700/80 bg-slate-950/80 p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{intl.formatMessage({ id: 'integrations.activeConnectors', defaultMessage: 'Active connectors' })}</div>
          <div className="mt-4 text-3xl font-semibold text-white">{summary.connected + summary.syncing}</div>
          <div className="mt-2 text-sm text-slate-400">{intl.formatMessage({ id: 'integrations.activeConnectorsHelp', defaultMessage: 'Ready to sync automatically.' })}</div>
        </div>

        <div className="rounded-[24px] border border-slate-700/80 bg-slate-950/80 p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{intl.formatMessage({ id: 'integrations.totalIntegrations', defaultMessage: 'Total integrations' })}</div>
          <div className="mt-4 text-3xl font-semibold text-white">{summary.total}</div>
          <div className="mt-2 text-sm text-slate-400">{intl.formatMessage({ id: 'integrations.totalIntegrationsHelp', defaultMessage: 'Connectors available in this workspace.' })}</div>
        </div>

        <div className="rounded-[24px] border border-slate-700/80 bg-slate-950/80 p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{intl.formatMessage({ id: 'integrations.upcomingReleases', defaultMessage: 'Upcoming releases' })}</div>
          <div className="mt-4 text-3xl font-semibold text-white">{summary.upcoming}</div>
          <div className="mt-2 text-sm text-slate-400">{intl.formatMessage({ id: 'integrations.upcomingReleasesHelp', defaultMessage: 'Integrations that will be available soon.' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
        {loading && (
          <div className="col-span-full rounded-[24px] border border-slate-700/80 bg-slate-950/80 p-12 text-center text-slate-400">
            {intl.formatMessage({ id: 'integrations.loading', defaultMessage: 'Loading connectors...' })}
          </div>
        )}

        {!loading && connectors.map((connector) => (
          <div key={connector.id} className="w-full">
            <ConnectorCard
              connector={connector}
              onUpdate={(updated) => setConnectors((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
