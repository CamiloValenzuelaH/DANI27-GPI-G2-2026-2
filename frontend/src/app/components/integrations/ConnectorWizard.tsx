import React from 'react';
import { useIntl } from 'react-intl';
import { ConnectorInfo, authUrlFor } from './connectorsApi';

export default function ConnectorWizard({ connector, onClose, onConnected }: { connector: ConnectorInfo; onClose: () => void; onConnected: (c: ConnectorInfo) => void }) {
  const intl = useIntl();
  const start = async () => {
    try {
      const url = authUrlFor(connector.id);
      window.open(url, '_blank', 'width=700,height=800');
    } catch (e) {
      console.error('OAuth start failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#111827] rounded p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold">{intl.formatMessage({ id: 'integrations.wizard.connect', defaultMessage: 'Connect {name}' }, { name: connector.name })}</h3>
        <p className="text-sm text-muted mt-2">{intl.formatMessage({ id: 'integrations.wizard.subtitle', defaultMessage: 'Follow the steps to authorize access.' })}</p>
        <ol className="list-decimal list-inside mt-4 text-sm">
          <li>{intl.formatMessage({ id: 'integrations.wizard.step1', defaultMessage: 'Start the authorization flow.' })}</li>
          <li>{intl.formatMessage({ id: 'integrations.wizard.step2', defaultMessage: 'Confirm permissions in the provider window.' })}</li>
          <li>{intl.formatMessage({ id: 'integrations.wizard.step3', defaultMessage: 'You will be redirected back to the app when finished.' })}</li>
        </ol>
        <div className="mt-4 flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onClose}>{intl.formatMessage({ id: 'common.close', defaultMessage: 'Close' })}</button>
          <button className="btn btn-primary" onClick={start}>{intl.formatMessage({ id: 'integrations.wizard.startAuth', defaultMessage: 'Start authorization' })}</button>
        </div>
      </div>
    </div>
  );
}
