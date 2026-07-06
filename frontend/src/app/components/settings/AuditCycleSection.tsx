import { useIntl } from 'react-intl';
import { useEffect, useState } from 'react';
import { usePreferences } from '../AppShell';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import auditScheduleApi from '../../../api/auditSchedule';
import Toast from '../../utils/toast';

export default function AuditCycleSection() {
  const intl = useIntl();
  const { auditCycle, setAuditCycle } = usePreferences();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  const options = [
    { value: 'monthly', label: intl.formatMessage({ id: 'settings.auditCycle.monthly', defaultMessage: 'Monthly' }) },
    { value: 'quarterly', label: intl.formatMessage({ id: 'settings.auditCycle.quarterly', defaultMessage: 'Quarterly' }) },
    { value: 'annual', label: intl.formatMessage({ id: 'settings.auditCycle.annual', defaultMessage: 'Annual' }) },
  ] as const;
  const frequencyLabelMap: Record<string, string> = Object.fromEntries(options.map((opt) => [opt.value, opt.label]))

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await auditScheduleApi.get()
        if (!mounted) return
        setData(res)
        if (res?.audit_day_of_month != null) {
          setDayOfMonth(res.audit_day_of_month)
        }
      } catch (e) {
        console.error('failed to load audit schedule', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const onSetFrequency = async (value: string) => {
    // update local preference first for immediate UX
    try {
      setAuditCycle(value)
    } catch (e) {
      // ignore if preferences not available
    }

    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
      Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastInvalidDay', defaultMessage: 'Day of month must be between 1 and 28' }))
      return
    }

    // debug: ensure click reaches handler
    try {
      // eslint-disable-next-line no-console
      console.log('AuditCycleSection.onSetFrequency', value)
    } catch (e) {}

    try {
      const res = await auditScheduleApi.update({ cycle_frequency: value, audit_day_of_month: dayOfMonth })
      setData(res)
      try { Toast.success(intl.formatMessage({ id: 'settings.auditCycle.toastUpdated', defaultMessage: 'Frequency updated' })) } catch (e) {}
    } catch (e) {
      // Log completo para debugging
      // eslint-disable-next-line no-console
      console.error('failed to update frequency', e)
      try {
        // Mostrar mensaje más explícito para permisos (403)
        // `e` puede venir de Axios y contener `response.status`
        const status = (e as any)?.response?.status ?? (e as any)?.status
        if (status === 403) {
          Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastPermissionDenied', defaultMessage: 'Insufficient permissions to update frequency' }))
        } else {
          Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastUpdateError', defaultMessage: 'Error updating frequency' }))
        }
      } catch (err) {}
    }
  }

  const onSaveDay = async () => {
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
      Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastInvalidDay', defaultMessage: 'Day of month must be between 1 and 28' }))
      return
    }

    try {
      const res = await auditScheduleApi.update({ cycle_frequency: data?.cycle_frequency || auditCycle || 'monthly', audit_day_of_month: dayOfMonth })
      setData(res)
      try { Toast.success(intl.formatMessage({ id: 'settings.auditCycle.toastUpdated', defaultMessage: 'Frequency updated' })) } catch (e) {}
    } catch (e) {
      console.error('failed to save audit day', e)
      try {
        const status = (e as any)?.response?.status ?? (e as any)?.status
        if (status === 403) {
          Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastPermissionDenied', defaultMessage: 'Insufficient permissions to update frequency' }))
        } else {
          Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastUpdateError', defaultMessage: 'Error updating frequency' }))
        }
      } catch (err) {}
    }
  }

  const onMarkCompleted = async () => {
    try {
      // debug: ensure click reaches handler
      // eslint-disable-next-line no-console
      console.log('AuditCycleSection.onMarkCompleted')
    } catch (e) {}

    try {
      const res = await auditScheduleApi.markCompleted()
      setData(res)
      try { Toast.success(intl.formatMessage({ id: 'settings.auditCycle.toastCompleted', defaultMessage: 'Audit marked as completed' })) } catch (e) {}
    } catch (e) {
      console.error('failed to mark completed', e)
      try { Toast.error(intl.formatMessage({ id: 'settings.auditCycle.toastCompleteError', defaultMessage: 'Error marking audit as completed' })) } catch (err) {}
    }
  }

  // sync initial preference from backend if available
  useEffect(() => {
    if (data?.cycle_frequency) {
      try {
        setAuditCycle(data.cycle_frequency)
      } catch (e) {
        // ignore
      }
    }
  }, [data?.cycle_frequency])

  const parseUtcOnlyDate = (value: string) => {
    const utcDate = new Date(value)
    return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
  }

  const selectedFrequency = data?.cycle_frequency || auditCycle || 'monthly'
  const nextDate = data?.next_audit_date ? parseUtcOnlyDate(data.next_audit_date) : null
  const formattedNextDate = nextDate
    ? nextDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : intl.formatMessage({ id: 'settings.auditCycle.notScheduled', defaultMessage: 'Not scheduled' })
  const historyItems = data?.history ?? []
  const isSaving = loading && !data

  return (
    <section className="relative rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-900 dark:text-white">{intl.formatMessage({ id: 'settings.auditCycle.title', defaultMessage: 'Audit cycle' })}</p>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {intl.formatMessage({ id: 'settings.auditCycleHelp' })}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{intl.formatMessage({ id: 'settings.auditCycle.currentFrequency', defaultMessage: 'Current frequency' })}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{frequencyLabelMap[selectedFrequency] ?? selectedFrequency}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                {frequencyLabelMap[selectedFrequency] ?? selectedFrequency}
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <label htmlFor="audit-day-of-month" className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                  {intl.formatMessage({ id: 'settings.auditCycle.dayOfMonth', defaultMessage: 'Audit day of month' })}
                </label>
                <input
                  id="audit-day-of-month"
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={(event) => setDayOfMonth(Number(event.target.value))}
                  className="mt-3 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {intl.formatMessage({ id: 'settings.auditCycle.dayOfMonthHelp', defaultMessage: 'Choose a day between 1 and 28 for the audit schedule.' })}
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{intl.formatMessage({ id: 'settings.auditCycle.auditDayPreview', defaultMessage: 'Selected audit day' })}</p>
                <p className="mt-3 text-5xl font-semibold text-slate-900 dark:text-white">{dayOfMonth}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {intl.formatMessage({ id: 'settings.auditCycle.dayOfMonth', defaultMessage: 'Audit day of month' })}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onSaveDay}
                className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {intl.formatMessage({ id: 'settings.auditCycle.saveDay', defaultMessage: 'Save day' })}
              </button>
              <div className="grid gap-3 sm:grid-cols-3 sm:flex-1">
                {options.map((option) => {
                  const isActive = selectedFrequency === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onSetFrequency(option.value)}
                      disabled={isSaving}
                      aria-pressed={isActive}
                      className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isActive
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900'
                      } ${isSaving ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{intl.formatMessage({ id: 'settings.auditCycle.nextAudit', defaultMessage: 'Next audit' })}</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{formattedNextDate}</p>
              </div>
              <div className="rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {nextDate
                  ? intl.formatMessage({ id: 'settings.auditCycle.scheduled', defaultMessage: 'Scheduled' })
                  : intl.formatMessage({ id: 'settings.auditCycle.noDate', defaultMessage: 'No date' })}
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {nextDate
                ? <DayPicker mode="single" selected={nextDate} defaultMonth={nextDate} className="rounded-[24px]" />
                : <div className="min-h-[240px] rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    {intl.formatMessage({ id: 'settings.auditCycle.emptyCalendar', defaultMessage: 'Schedule an audit to display its date in the calendar.' })}
                  </div>}
            </div>

            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={onMarkCompleted}
                disabled={isSaving}
                className="w-full rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {intl.formatMessage({ id: 'settings.auditCycle.markCompleted', defaultMessage: 'Mark audit as completed' })}
              </button>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">{intl.formatMessage({ id: 'settings.auditCycle.history', defaultMessage: 'History' })}</p>
                {historyItems.length ? (
                  <ul className="mt-4 space-y-2">
                    {historyItems.map((d: string) => (
                      <li key={d} className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                        {new Date(d).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{intl.formatMessage({ id: 'settings.auditCycle.historyEmpty', defaultMessage: 'No completed audits have been registered yet.' })}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
