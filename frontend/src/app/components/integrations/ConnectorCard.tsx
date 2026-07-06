import React, { useState } from 'react';
import Card from '../../components/common/Card';
import { ConnectorInfo, disconnectConnector, startOAuth } from './connectorsApi';
import { connectorLogos } from './connectorLogos';
import client from '../../../api/client';
import { formatDistanceToNow } from 'date-fns';
import ConnectorWizard from './ConnectorWizard';
import SyncScheduler from './SyncScheduler';
import { useIntl } from 'react-intl';

export default function ConnectorCard({ connector, onUpdate }: { connector: ConnectorInfo; onUpdate: (c: ConnectorInfo) => void }) {
  const intl = useIntl();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    if (!connector.backendAvailable) {
      setWizardOpen(true);
      return;
    }

    let url: string | undefined;
    try {
      const res = await startOAuth(connector.id);
      url = res?.url;
    } catch (e) {
      setWizardOpen(true);
      return;
    }

    const popup = window.open(url, '_blank', 'width=700,height=800');
    if (!popup) {
      alert(intl.formatMessage({ id: 'integrations.popupRequired', defaultMessage: 'Please allow popups to start OAuth' }));
      return;
    }

    setBusy(true);
    const poll = setInterval(async () => {
      try {
        const { data: status } = await client.get(`/connectors/${connector.id}/status`);
        if (status.is_connected || status.status === 'connected') {
          clearInterval(poll);
          try {
            popup.close();
          } catch {
            // ignore
          }
          onUpdate({ ...connector, status: 'connected', lastSync: status.last_sync_at });
          setBusy(false);
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 1500);
  };

  const handleDisconnect = async () => {
    try {
      setBusy(true);
      await disconnectConnector(connector.id);
      onUpdate({ ...connector, status: 'disconnected' });
    } catch (e) {
      onUpdate({ ...connector, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const metadata = connectorLogos[connector.id] || {
    title: connector.name,
    color: 'bg-slate-100',
    icon: 'https://img.icons8.com/ios-filled/50/000000/link.png',
  };

  const statusLabel = connector.status === 'upcoming'
    ? intl.formatMessage({ id: 'integrations.status.upcoming', defaultMessage: 'Upcoming' })
    : connector.status === 'connected'
      ? intl.formatMessage({ id: 'integrations.status.connected', defaultMessage: 'Connected' })
      : connector.status === 'syncing'
        ? intl.formatMessage({ id: 'integrations.status.syncing', defaultMessage: 'Syncing' })
        : connector.status === 'error'
          ? intl.formatMessage({ id: 'integrations.status.error', defaultMessage: 'Error' })
          : intl.formatMessage({ id: 'integrations.status.disconnected', defaultMessage: 'Disconnected' });

  const statusBadge = connector.status === 'connected'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
    : connector.status === 'error'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-800 dark:text-rose-200'
      : connector.status === 'syncing'
        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200'
        : 'bg-slate-100 text-slate-700 dark:bg-[#0F1720] dark:text-white/80';

  return (
    <Card title={connector.name} borderColor="border-[#E5E7EB]">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${metadata.color}`}>
              <img src={metadata.icon} alt={metadata.title} className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{connector.name}</p>
              <p className="text-sm text-slate-500">{metadata.title}</p>
            </div>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-[#2A2E3D] dark:bg-[#0B1116]">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{intl.formatMessage({ id: 'integrations.lastSyncLabel', defaultMessage: 'Last sync' })}</div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              {connector.lastSync ? formatDistanceToNow(new Date(connector.lastSync), { addSuffix: true }) : intl.formatMessage({ id: 'integrations.noHistory', defaultMessage: 'No history' })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-[#2A2E3D] dark:bg-[#0B1116]">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">{intl.formatMessage({ id: 'integrations.frequency', defaultMessage: 'Frequency' })}</div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{intl.formatMessage({ id: 'integrations.everyHours', defaultMessage: 'Every {hours} hours' }, { hours: connector.scheduleHours ?? 24 })}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-[#2A2E3D] dark:bg-[#0B1116]">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">{intl.formatMessage({ id: 'integrations.connectorDescription', defaultMessage: 'Connector description' })}</div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-gray-300">
            {intl.formatMessage({ id: 'integrations.connectorDescriptionHelp', defaultMessage: 'Your credentials are kept secure and syncing runs in the background to keep data updated.' })}
          </p>
        </div>

        <div className="space-y-3">
          <button
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${connector.status === 'connected'
              ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700'
              : connector.status === 'upcoming'
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-[#1F2430] dark:text-slate-300'
                : 'bg-slate-900 hover:bg-slate-800'} `}
            onClick={connector.status === 'connected' ? handleDisconnect : handleConnect}
            disabled={busy || connector.status === 'upcoming'}
          >
            {connector.status === 'connected'
              ? intl.formatMessage({ id: 'integrations.disconnect', defaultMessage: 'Disconnect' })
              : connector.status === 'upcoming'
                ? intl.formatMessage({ id: 'integrations.status.upcoming', defaultMessage: 'Upcoming' })
                : busy
                  ? intl.formatMessage({ id: 'integrations.processing', defaultMessage: 'Processing...' })
                  : intl.formatMessage({ id: 'integrations.connect', defaultMessage: 'Connect' })}
          </button>
          <p className="text-xs text-slate-500">
            {intl.formatMessage({ id: 'integrations.reconnectHint', defaultMessage: 'If you need to refresh permissions, reconnect this connector from here.' })}
          </p>
        </div>

        <SyncScheduler connector={connector} onUpdate={onUpdate} />

        {wizardOpen && (
          <ConnectorWizard
            connector={connector}
            onClose={() => setWizardOpen(false)}
            onConnected={(info) => {
              onUpdate(info);
              setWizardOpen(false);
            }}
          />
        )}
      </div>
    </Card>
  );
}
