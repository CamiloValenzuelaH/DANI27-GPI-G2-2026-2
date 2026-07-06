import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { ConnectorInfo, updateSchedule } from './connectorsApi';

export default function SyncScheduler({ connector, onUpdate }: { connector: ConnectorInfo; onUpdate: (c: ConnectorInfo) => void }) {
  const intl = useIntl();
  const [hours, setHours] = useState(connector.scheduleHours ?? 24);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      await updateSchedule(connector.id, hours);
      onUpdate({ ...connector, scheduleHours: hours });
    } catch (e) {
      console.error('schedule update failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 rounded-3xl bg-white border border-slate-200 p-4 dark:bg-[#0B1116] dark:border-[#2A2E3D]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{intl.formatMessage({ id: 'integrations.syncFrequency', defaultMessage: 'Sync frequency' })}</p>
          <p className="text-sm text-slate-900">{intl.formatMessage({ id: 'integrations.syncEveryHours', defaultMessage: 'Automatically updates every {hours} hours' }, { hours: connector.scheduleHours ?? 24 })}</p>
        </div>
        <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={save} disabled={saving}>{intl.formatMessage({ id: 'common.save', defaultMessage: 'Save' })}</button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          type="number"
          min={1}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="input w-full bg-white dark:bg-[#071018] border-slate-300 dark:border-[#2A2E3D] text-slate-900 dark:text-white"
        />
        <span className="text-xs text-slate-500">{intl.formatMessage({ id: 'common.hours', defaultMessage: 'Hours' })}</span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{intl.formatMessage({ id: 'integrations.syncHelp', defaultMessage: '24 hours is the standard setting; use it for daily syncs and avoid very frequent calls unless you need real-time data.' })}</p>
    </div>
  );
}
