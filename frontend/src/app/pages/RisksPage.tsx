import { FormEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { assetsApi } from '../../api/assets'
import { parseFastApiError } from '../../api/errors'
import { risksApi, LinkRiskThreatRequest } from '../../api/risks'
import { threatsApi, CreateThreatRequest } from '../../api/threats'
import { vulnerabilitiesApi, CreateVulnerabilityRequest } from '../../api/vulnerabilities'
import { usePreferences } from '../components/AppShell'
import type { Asset, Risk, Threat, Vulnerability } from '../../api/types'

const THREAT_CATEGORIES = ['HUMAN', 'TECHNICAL', 'ENVIRONMENTAL', 'ORGANIZATIONAL']
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const LIKELIHOOD_OPTIONS = [1, 2, 3, 4, 5]

export default function RisksPage() {
  const intl = useIntl()
  
  // Helper function to get translation value
  const getT = (key: string, fallback: string): string => {
    return intl.formatMessage({ id: key, defaultMessage: fallback })
  }
  const [threats, setThreats] = useState<Threat[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submittingThreat, setSubmittingThreat] = useState(false)
  const [submittingVulnerability, setSubmittingVulnerability] = useState(false)
  const [submittingRisk, setSubmittingRisk] = useState(false)
  const [linkingThreat, setLinkingThreat] = useState(false)
  const [selectedRiskId, setSelectedRiskId] = useState('')
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [riskForm, setRiskForm] = useState({
    name: '',
    description: '',
    asset_id: '',
    probability: 1,
    impact: 1,
  })

  const {
    register: registerThreat,
    handleSubmit: handleSubmitThreat,
    reset: resetThreat,
    formState: { errors: threatErrors },
  } = useForm<CreateThreatRequest>({ defaultValues: { category: 'TECHNICAL', likelihood: 1, impact: 1 } })
  const { darkMode } = usePreferences()

  const {
    register: registerVulnerability,
    handleSubmit: handleSubmitVulnerability,
    reset: resetVulnerability,
    formState: { errors: vulnerabilityErrors },
  } = useForm<CreateVulnerabilityRequest>({ defaultValues: { severity: 'LOW', threat_id: '' } })

  const [selectedThreatId, setSelectedThreatId] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [threatList, vulnerabilityList, riskList, assetList] = await Promise.all([
        threatsApi.list(),
        vulnerabilitiesApi.list(),
        risksApi.list(),
        assetsApi.list(),
      ])
      setThreats(threatList)
      setVulnerabilities(vulnerabilityList)
      setRisks(riskList)
      setAssets(assetList)
    } catch (err) {
      console.error(err)
      setFormError(parseFastApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onCreateThreat = async (data: CreateThreatRequest) => {
    setFormError(null)
    setSuccessMessage(null)
    setSubmittingThreat(true)

    try {
      await threatsApi.create(data)
      resetThreat({ category: 'TECHNICAL', likelihood: 1, impact: 1 })
      setSuccessMessage(getT('risks.threatCreatedSuccess', 'Threat created successfully'))
      await loadData()
    } catch (err) {
      setFormError(parseFastApiError(err))
    } finally {
      setSubmittingThreat(false)
    }
  }

  const onCreateVulnerability = async (data: CreateVulnerabilityRequest) => {
    setFormError(null)
    setSuccessMessage(null)
    setSubmittingVulnerability(true)

    try {
      await vulnerabilitiesApi.create({
        ...data,
        threat_id: data.threat_id || undefined,
      })
      resetVulnerability({ severity: 'LOW', threat_id: '' })
      setSuccessMessage(getT('risks.vulnerabilityCreatedSuccess', 'Vulnerability created successfully'))
      await loadData()
    } catch (err) {
      setFormError(parseFastApiError(err))
    } finally {
      setSubmittingVulnerability(false)
    }
  }

  const openRiskForm = () => {
    setRiskForm({
      name: '',
      description: '',
      asset_id: '',
      probability: 1,
      impact: 1,
    })
    setFormError(null)
    setSuccessMessage(null)
    setShowRiskForm(true)
  }

  const closeRiskForm = () => {
    setShowRiskForm(false)
  }

  const handleRiskFormChange = (field: keyof typeof riskForm, value: string | number) => {
    setRiskForm((prev) => ({ ...prev, [field]: value }))
  }

  const onCreateRisk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (!riskForm.name.trim()) {
      setFormError(getT('risks.fieldRequired', 'This field is required'))
      return
    }

    if (!riskForm.asset_id) {
      setFormError(getT('risks.fieldRequired', 'This field is required'))
      return
    }

    setSubmittingRisk(true)

    try {
      await risksApi.create({
        name: riskForm.name,
        description: riskForm.description || undefined,
        asset_id: riskForm.asset_id,
        probability: riskForm.probability,
        impact: riskForm.impact,
      })
      await loadData()
      setSuccessMessage(getT('risks.riskCreatedSuccess', 'Risk created successfully'))
      closeRiskForm()
    } catch (err) {
      setFormError(parseFastApiError(err))
    } finally {
      setSubmittingRisk(false)
    }
  }

  const onLinkThreat = async () => {
    if (!selectedRiskId || !selectedThreatId) {
      setFormError(getT('risks.linkSelectionRequired', 'Please select a risk and a threat to link'))
      return
    }
    setFormError(null)
    setSuccessMessage(null)
    setLinkingThreat(true)

    try {
      await risksApi.linkThreat(selectedRiskId, { threat_id: selectedThreatId })
      setSuccessMessage(getT('risks.threatLinkedSuccess', 'Threat linked to risk successfully'))
      setSelectedRiskId('')
      setSelectedThreatId('')
      await loadData()
    } catch (err) {
      setFormError(parseFastApiError(err))
    } finally {
      setLinkingThreat(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="rounded-3xl border border-slate-700 bg-[#111827] p-6 shadow-[0_15px_45px_-25px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{getT('risks.title', 'Risk Management')}</h1>
            <p className="max-w-2xl text-sm text-slate-300">{getT('risks.subtitle', 'Create threats, vulnerabilities, and link threats to existing risks.')}</p>
          </div>
          <button
            type="button"
            onClick={openRiskForm}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#4F6EF7] to-[#405CEE] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#4F6EF7]/15 transition hover:brightness-110"
          >
            {getT('risks.addRiskButton', 'Agregar riesgo')}
          </button>
        </div>
      </div>

      {formError && (
        <div className="rounded-[24px] border border-[#E5484D]/20 bg-[#3A151B] px-4 py-3 text-sm text-[#F5B9C3] shadow-[0_20px_45px_-30px_rgba(229,72,77,0.85)]">
          {formError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-[24px] border border-[#4F6EF7]/20 bg-[#111B31] px-4 py-3 text-sm text-[#C0D7FF] shadow-[0_20px_45px_-30px_rgba(79,110,247,0.75)]">
          {successMessage}
        </div>
      )}

      {showRiskForm && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={closeRiskForm} />
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
            <div
              className="w-full max-w-[540px] max-h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950/95 border border-slate-700/40 rounded-[32px] shadow-[0_35px_80px_-40px_rgba(15,23,42,0.25)] sm:rounded-[32px] sm:mt-0"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-700/30 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-sm">
                <div>
                  <h2 className="text-base font-semibold text-white">{getT('risks.createRiskTitle', 'Create Risk')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{getT('risks.createRiskDescription', 'Register a new risk into the risk register.')}</p>
                </div>
                <button
                  type="button"
                  onClick={closeRiskForm}
                  className="text-white/30 hover:text-white transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={onCreateRisk} className="px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.riskNameLabel', 'Name')} *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    placeholder={getT('risks.riskNamePlaceholder', 'e.g. Insufficient access control')}
                    value={riskForm.name}
                    onChange={(event) => handleRiskFormChange('name', event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.riskDescriptionLabel', 'Description')}</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
                    placeholder={getT('risks.riskDescriptionPlaceholder', 'Optional additional context')}
                    value={riskForm.description}
                    onChange={(event) => handleRiskFormChange('description', event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.riskAssetLabel', 'Asset')} *</label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    value={riskForm.asset_id}
                    onChange={(event) => handleRiskFormChange('asset_id', event.target.value)}
                  >
                    <option value="">{getT('risks.selectAsset', 'Select asset')}</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id} className="bg-[#1A1D28]">
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">{getT('risks.probabilityLabel', 'Probability')} *</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                      value={riskForm.probability}
                      onChange={(event) => handleRiskFormChange('probability', Number(event.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">{getT('risks.impactLabel', 'Impact')} *</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                      value={riskForm.impact}
                      onChange={(event) => handleRiskFormChange('impact', Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRiskForm}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700/30 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:border-slate-400"
                  >
                    {getT('risks.cancelButton', 'Cancelar')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRisk}
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#4F6EF7] to-[#5D7DFF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#4F6EF7]/20 transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingRisk ? getT('risks.creating', 'Creating...') : getT('risks.createRiskButton', 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-700/30 bg-slate-950/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-4 mb-6 border-b border-slate-700/20 pb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">{getT('risks.createThreatTitle', 'Create Threat')}</h2>
                <p className="text-sm text-slate-300">{getT('risks.createThreatDescription', 'Identify threats linked to your risk program.')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitThreat(onCreateThreat)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.threatNameLabel', 'Name')} *</label>
                <input
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-2xl px-3 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/15 transition-colors"
                  placeholder={getT('risks.threatNamePlaceholder', 'e.g. Internal phishing')}
                  {...registerThreat('name', { required: getT('risks.fieldRequired', 'This field is required') })}
                />
                {threatErrors.name && <p className="text-xs text-[#E5484D]">{threatErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.threatDescriptionLabel', 'Description')}</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-2xl px-3 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/15 transition-colors resize-none"
                  placeholder={getT('risks.threatDescriptionPlaceholder', 'Additional information about the threat')}
                  {...registerThreat('description')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.threatCategoryLabel', 'Category')} *</label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-2xl px-3 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/15 transition-colors"
                    {...registerThreat('category', { required: getT('risks.fieldRequired', 'This field is required') })}
                  >
                    <option value="">{getT('risks.selectCategory', 'Select category')}</option>
                    {THREAT_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="bg-[#1A1D28]">
                        {getT(`risks.category.${category.toLowerCase()}`, category)}
                      </option>
                    ))}
                  </select>
                  {threatErrors.category && <p className="text-xs text-[#E5484D]">{threatErrors.category.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.threatLikelihoodLabel', 'Likelihood')} *</label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerThreat('likelihood', { valueAsNumber: true })}
                  >
                    {LIKELIHOOD_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#1A1D28]">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.threatImpactLabel', 'Impact')} *</label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerThreat('impact', { valueAsNumber: true })}
                  >
                    {[1, 2, 3, 4, 5].map((option) => (
                      <option key={option} value={option} className="bg-[#1A1D28]">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingThreat}
                className="inline-flex items-center justify-center rounded-lg bg-[#4F6EF7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4060E0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingThreat ? getT('risks.saving', 'Saving...') : getT('risks.createThreatButton', 'Create Threat')}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-slate-700/30 bg-slate-950/95 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <div className="mb-6 border-b border-slate-700/30 pb-5">
              <h2 className="text-lg font-semibold text-white">{getT('risks.createVulnerabilityTitle', 'Create Vulnerability')}</h2>
              <p className="text-sm text-slate-300">{getT('risks.createVulnerabilityDescription', 'Register vulnerabilities related to critical assets.')}</p>
            </div>

            <form onSubmit={handleSubmitVulnerability(onCreateVulnerability)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.vulnerabilityNameLabel', 'Name')} *</label>
                <input
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder={getT('risks.vulnerabilityNamePlaceholder', 'e.g. Outdated version')}
                  {...registerVulnerability('name', { required: getT('risks.fieldRequired', 'This field is required') })}
                />
                {vulnerabilityErrors.name && <p className="text-xs text-[#E5484D]">{vulnerabilityErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.vulnerabilityDescriptionLabel', 'Description')}</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
                  placeholder={getT('risks.vulnerabilityDescriptionPlaceholder', 'Details of the vulnerability')}
                  {...registerVulnerability('description')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.vulnerabilityThreatLabel', 'Linked Threat')}</label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  {...registerVulnerability('threat_id')}
                >
                  <option value="">{getT('risks.selectThreatPlaceholder', 'Select threat')}</option>
                  {threats.map((threat) => (
                    <option key={threat.id} value={threat.id} className="bg-[#1A1D28]">
                      {threat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">{getT('risks.vulnerabilityThreatHelp', 'Link a threat to keep the vulnerability connected to its threat context.')}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.vulnerabilityAssetLabel', 'Affected Asset')} *</label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerVulnerability('asset_id', { required: getT('risks.fieldRequired', 'This field is required') })}
                  >
                    <option value="">{getT('risks.selectAsset', 'Select asset')}</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id} className="bg-[#1A1D28]">
                        {asset.name}
                      </option>
                    ))}
                  </select>
                  {vulnerabilityErrors.asset_id && <p className="text-xs text-[#E5484D]">{vulnerabilityErrors.asset_id.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">{getT('risks.vulnerabilitySeverityLabel', 'Severity')} *</label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerVulnerability('severity', { required: getT('risks.fieldRequired', 'This field is required') })}
                  >
                    <option value="">{getT('risks.selectSeverity', 'Select severity')}</option>
                    {SEVERITY_OPTIONS.map((severity) => (
                      <option key={severity} value={severity} className="bg-[#1A1D28]">
                        {getT(`risks.severity.${severity.toLowerCase()}`, severity)}
                      </option>
                    ))}
                  </select>
                  {vulnerabilityErrors.severity && <p className="text-xs text-[#E5484D]">{vulnerabilityErrors.severity.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingVulnerability}
                className="inline-flex items-center justify-center rounded-lg bg-[#4F6EF7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4060E0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingVulnerability ? getT('risks.saving', 'Saving...') : getT('risks.createVulnerabilityButton', 'Create Vulnerability')}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-slate-700/30 bg-slate-950/95 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <div className="mb-6 border-b border-slate-700/30 pb-5">
              <h2 className="text-lg font-semibold text-white">{getT('risks.linkThreatTitle', 'Link Threat to Risk')}</h2>
              <p className="text-sm text-slate-300">{getT('risks.linkThreatDescription', 'Select a risk and an existing threat.')}</p>
            </div>

            <div className="space-y-5 bg-slate-950/90 border border-slate-700/30 rounded-3xl p-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.selectRiskLabel', 'Risk')} *</label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  value={selectedRiskId}
                  onChange={(event) => setSelectedRiskId(event.target.value)}
                >
                  <option value="">{getT('risks.selectRiskPlaceholder', 'Select risk')}</option>
                  {risks.map((risk) => (
                    <option key={risk.id} value={risk.id} className="bg-[#1A1D28]">
                      {risk.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">{getT('risks.selectThreatLabel', 'Threat')} *</label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700/30 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  value={selectedThreatId}
                  onChange={(event) => setSelectedThreatId(event.target.value)}
                >
                  <option value="">{getT('risks.selectThreatPlaceholder', 'Select threat')}</option>
                  {threats.map((threat) => (
                    <option key={threat.id} value={threat.id} className="bg-[#1A1D28]">
                      {threat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onLinkThreat}
                disabled={linkingThreat}
                className="inline-flex items-center justify-center rounded-lg bg-[#4F6EF7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4060E0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkingThreat ? getT('risks.linking', 'Linking...') : getT('risks.linkThreatButton', 'Link Threat')}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-700/30 bg-slate-950/95 p-6 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.2)]">
            <h3 className="text-base font-semibold text-white mb-4">{getT('risks.recentThreatsTitle', 'Recent Threats')}</h3>
            {isLoading ? (
              <div className="text-sm text-slate-400">{getT('risks.loadingThreats', 'Loading threats...')}</div>
            ) : threats.length === 0 ? (
              <div className="text-sm text-slate-400">{getT('risks.noThreats', 'No threats registered.')}</div>
            ) : (
              <ul className="space-y-3">
                {threats.slice(0, 4).map((threat) => (
                  <li key={threat.id} className="rounded-3xl border border-slate-700/20 bg-slate-800/90 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{threat.name}</p>
                        <p className="text-xs text-slate-300">{threat.category}</p>
                      </div>
                      <span className="text-[11px] rounded-full border border-[#4F6EF7] px-2 py-1 text-[#4F6EF7]">
                        P{threat.likelihood}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-700/30 bg-slate-950/95 p-6 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.2)]">
            <h3 className="text-base font-semibold text-white mb-4">{getT('risks.recentVulnerabilitiesTitle', 'Recent Vulnerabilities')}</h3>
            {isLoading ? (
              <div className="text-sm text-slate-400">{getT('risks.loadingVulnerabilities', 'Loading vulnerabilities...')}</div>
            ) : vulnerabilities.length === 0 ? (
              <div className="text-sm text-slate-400">{getT('risks.noVulnerabilities', 'No vulnerabilities registered.')}</div>
            ) : (
              <ul className="space-y-3">
                {vulnerabilities.slice(0, 4).map((vuln) => (
                  <li key={vuln.id} className="rounded-3xl border border-slate-700/20 bg-slate-800/90 p-4">
                    <p className="text-sm font-semibold text-white">{vuln.name}</p>
                    <p className="text-xs text-slate-300">
                      {vuln.severity} · Activo: {assets.find((asset) => asset.id === vuln.asset_id)?.name ?? 'N/A'}
                      {vuln.threat_id ? ` · Threat: ${threats.find((threat) => threat.id === vuln.threat_id)?.name ?? 'N/A'}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
