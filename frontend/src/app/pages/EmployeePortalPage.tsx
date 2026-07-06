import { useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { BookOpen, CheckCircle2, ChevronRight, RefreshCcw, ShieldCheck } from 'lucide-react'
import { portalApi } from '../../api/portal'
import type { PolicyOut } from '../../api/types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'

function formatDate(value: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function PolicyCard({
  policy,
  acknowledged,
  onOpen,
  intl,
}: {
  policy: PolicyOut
  acknowledged: boolean
  onOpen: (policy: PolicyOut) => void
  intl: ReturnType<typeof useIntl>
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/40 transition duration-300 hover:-translate-y-0.5 hover:border-white/15">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={policy.mandatory ? 'destructive' : 'secondary'}>
              {policy.mandatory
                ? intl.formatMessage({ id: 'portal.mandatory', defaultMessage: 'Mandatory' })
                : intl.formatMessage({ id: 'portal.optional', defaultMessage: 'Optional' })}
            </Badge>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">v{policy.document_version}</span>
            <span className="text-xs text-slate-400">{formatDate(policy.published_at)}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{policy.title}</h2>
            {policy.summary ? (
              <p className="mt-2 text-sm leading-6 text-slate-300">{policy.summary}</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-300 line-clamp-3">{policy.content}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          {acknowledged ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
              <CheckCircle2 className="size-4" /> {intl.formatMessage({ id: 'portal.acknowledged', defaultMessage: 'Acknowledged' })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/90 px-3 py-1 text-sm text-slate-300">
              {intl.formatMessage({ id: 'portal.pending', defaultMessage: 'Pending' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen(policy)}
            className="min-w-[120px]"
          >
            {intl.formatMessage({ id: 'portal.viewPolicy', defaultMessage: 'View policy' })}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function PolicyViewModal({
  policy,
  open,
  loading,
  acknowledged,
  checked,
  error,
  onOpenChange,
  onToggleChecked,
  onAcknowledge,
  intl,
}: {
  policy: PolicyOut | null
  open: boolean
  loading: boolean
  acknowledged: boolean
  checked: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onToggleChecked: (nextValue: boolean) => void
  onAcknowledge: () => Promise<void>
  intl: ReturnType<typeof useIntl>
}) {
  if (!policy) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40 ring-1 ring-white/5">
        <DialogHeader className="space-y-4 border-b border-white/10 px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-slate-400">
            <ShieldCheck className="size-4 text-primary" />
            <span>{intl.formatMessage({ id: 'menu.portal', defaultMessage: 'Portal' })}</span>
          </div>
          <div className="sm:flex sm:items-start sm:justify-between sm:gap-6">
            <div className="space-y-3">
              <DialogTitle className="text-3xl font-semibold tracking-tight text-white">{policy.title}</DialogTitle>
              <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-400">
                {intl.formatMessage(
                  { id: 'portal.versionLine', defaultMessage: 'Version {version} · {kind} · Published {date}' },
                  {
                    version: policy.document_version,
                    kind: policy.mandatory
                      ? intl.formatMessage({ id: 'portal.mandatory', defaultMessage: 'Mandatory' })
                      : intl.formatMessage({ id: 'portal.optional', defaultMessage: 'Optional' }),
                    date: formatDate(policy.published_at),
                  },
                )}
              </DialogDescription>
            </div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-sm sm:mt-0">
              <span className="font-semibold text-white">{intl.formatMessage({ id: 'validation.table.status', defaultMessage: 'Status' })}</span>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em]">
                <Badge variant={policy.mandatory ? 'destructive' : 'secondary'}>
                  {policy.mandatory
                    ? intl.formatMessage({ id: 'portal.mandatory', defaultMessage: 'Mandatory' })
                    : intl.formatMessage({ id: 'portal.optional', defaultMessage: 'Optional' })}
                </Badge>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-300">v{policy.document_version}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8 text-sm leading-7 text-slate-200">
          <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{intl.formatMessage({ id: 'validation.summary', defaultMessage: 'Summary' })}</h3>
              <span className="text-xs text-slate-400">{intl.formatMessage({ id: 'portal.officialSummary', defaultMessage: 'Official summary' })}</span>
            </div>
            <p className="text-sm text-slate-200">{policy.summary ?? intl.formatMessage({ id: 'portal.noSummary', defaultMessage: 'No summary available.' })}</p>
          </section>

          <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{intl.formatMessage({ id: 'portal.fullText', defaultMessage: 'Full text' })}</h3>
              <span className="text-xs text-slate-400">{intl.formatMessage({ id: 'portal.readCarefully', defaultMessage: 'Read carefully' })}</span>
            </div>
            <div className="rounded-3xl bg-slate-950 p-4 text-sm leading-7 text-slate-200">
              <p className="whitespace-pre-wrap">{policy.content}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox checked={checked} onCheckedChange={(value) => onToggleChecked(value === true)} />
              <div className="space-y-2 text-sm text-slate-200">
                <p className="font-medium">{intl.formatMessage({ id: 'portal.ackCheckboxText', defaultMessage: 'I have read this policy and acknowledge the current document version.' })}</p>
                <p className="text-slate-400">{intl.formatMessage({ id: 'portal.ackCheckboxHelp', defaultMessage: 'This acknowledgment will be recorded for your organization.' })}</p>
              </div>
            </label>
          </section>

          {error ? <p className="text-sm text-destructive-300">{error}</p> : null}
          {acknowledged ? (
            <p className="text-sm text-emerald-300">{intl.formatMessage({ id: 'portal.ackSuccess', defaultMessage: 'Policy acknowledged successfully.' })}</p>
          ) : null}
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {intl.formatMessage({ id: 'common.close', defaultMessage: 'Close' })}
          </Button>
          <Button
            onClick={onAcknowledge}
            disabled={!checked || loading || acknowledged}
          >
            {loading
              ? intl.formatMessage({ id: 'common.saving', defaultMessage: 'Saving...' })
              : acknowledged
                ? intl.formatMessage({ id: 'portal.acknowledged', defaultMessage: 'Acknowledged' })
                : intl.formatMessage({ id: 'portal.acknowledgePolicy', defaultMessage: 'Acknowledge policy' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function EmployeePortalPage() {
  const intl = useIntl()
  const [policies, setPolicies] = useState<PolicyOut[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyOut | null>(null)
  const [opened, setOpened] = useState(false)
  const [checked, setChecked] = useState(false)
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const selectedAcknowledged = useMemo(
    () => selectedPolicy ? acknowledgedIds.has(selectedPolicy.id) : false,
    [acknowledgedIds, selectedPolicy],
  )

  const pendingCount = useMemo(
    () => policies.filter((policy) => !acknowledgedIds.has(policy.id)).length,
    [policies, acknowledgedIds],
  )

  const loadPolicies = async () => {
    setFetching(true)
    setError(null)
    try {
      const items = await portalApi.listPolicies()
      setPolicies(items)
      // populate acknowledged ids from server-side info
      const acked = new Set<string>()
      items.forEach((it) => {
        if ((it as any).acknowledged) acked.add(it.id)
      })
      setAcknowledgedIds(acked)
    } catch (err) {
      console.error('Failed to load portal policies', err)
      setError(intl.formatMessage({ id: 'portal.loadError', defaultMessage: 'Unable to load portal policies. Please try again later.' }))
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    void loadPolicies()
  }, [])

  const handleOpenPolicy = (policy: PolicyOut) => {
    setSelectedPolicy(policy)
    setChecked(false)
    setOpened(true)
  }

  const handleAcknowledge = async () => {
    if (!selectedPolicy) return
    setLoading(true)
    setError(null)

    try {
      const ack = await portalApi.acknowledgePolicy(selectedPolicy.id, selectedPolicy.document_version)
      setAcknowledgedIds(prev => new Set(prev).add(selectedPolicy.id))
      // Refresh policies to reflect counts/metadata from server
      try {
        await loadPolicies()
      } catch (e) {
        // ignore refresh errors
      }
      // close modal and reset checked
      setOpened(false)
      setChecked(false)
      // show toast with hash and time
      if (ack && ack.content_hash) {
        const when = ack.acknowledged_at ? new Date(ack.acknowledged_at).toLocaleString() : new Date().toLocaleString()
        setToast(intl.formatMessage({ id: 'portal.toastAcknowledged', defaultMessage: 'Policy acknowledged • hash: {hash} • {when}' }, { hash: ack.content_hash, when }))
      }
    } catch (err) {
      console.error('Acknowledge failed', err)
      setError(intl.formatMessage({ id: 'portal.ackError', defaultMessage: 'Could not acknowledge policy. Check your connection and try again.' }))
    } finally {
      setLoading(false)
    }
  }

  // auto-hide toast after 5s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPolicies()
    setRefreshing(false)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/90 p-8 shadow-2xl shadow-black/40 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%)] before:opacity-70 before:pointer-events-none">
        <div className="relative grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-sky-200">
              <BookOpen className="size-4 text-sky-300" />
              {intl.formatMessage({ id: 'menu.portal', defaultMessage: 'Portal' })}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{intl.formatMessage({ id: 'portal.pageTitle', defaultMessage: 'Policy acknowledgments' })}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              {intl.formatMessage({ id: 'portal.pageSubtitle', defaultMessage: 'Review policies published by your organization and confirm the ones you have read.' })}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-sm">
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400">{intl.formatMessage({ id: 'portal.publishedPolicies', defaultMessage: 'Published policies' })}</span>
              <p className="mt-4 text-3xl font-semibold text-white">{policies.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-sm">
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400">{intl.formatMessage({ id: 'portal.pending', defaultMessage: 'Pending' })}</span>
              <p className="mt-4 text-3xl font-semibold text-white">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">{intl.formatMessage({ id: 'validation.table.status', defaultMessage: 'Status' })}</span>
            <span className="ml-2 text-slate-400">{intl.formatMessage({ id: 'portal.statusAutoUpdate', defaultMessage: 'Updates automatically as policies are acknowledged.' })}</span>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className="size-4" />
            {refreshing
              ? intl.formatMessage({ id: 'common.refreshing', defaultMessage: 'Refreshing' })
              : intl.formatMessage({ id: 'common.refresh', defaultMessage: 'Refresh' })}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 mt-8">
        {fetching ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center text-slate-300 shadow-sm">
            {intl.formatMessage({ id: 'portal.loadingPolicies', defaultMessage: 'Loading policies...' })}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-sm text-destructive-100 shadow-sm">
            {error}
          </div>
        ) : policies.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center text-slate-300 shadow-sm">
            {intl.formatMessage({ id: 'portal.noPolicies', defaultMessage: 'No published policies found for your organization.' })}
          </div>
        ) : (
          <div className="grid gap-4">
            {policies.map(policy => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                acknowledged={acknowledgedIds.has(policy.id)}
                onOpen={handleOpenPolicy}
                intl={intl}
              />
            ))}
          </div>
        )}
      </div>

      <PolicyViewModal
        policy={selectedPolicy}
        open={opened}
        loading={loading}
        acknowledged={selectedAcknowledged}
        checked={checked}
        error={error}
        onOpenChange={(next) => {
          setOpened(next)
          if (!next) {
            setSelectedPolicy(null)
            setChecked(false)
            setError(null)
          }
        }}
        onToggleChecked={setChecked}
        onAcknowledge={handleAcknowledge}
        intl={intl}
      />
      {/* Toast */}
      {toast ? (
        <div className="fixed right-6 bottom-6 max-w-sm z-50">
          <div className="rounded-lg bg-slate-900 border border-white/10 px-4 py-3 text-sm text-slate-200 shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  )
}
