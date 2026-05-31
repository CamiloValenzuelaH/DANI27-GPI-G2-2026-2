import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { assetsApi } from '../../api/assets'
import { parseFastApiError } from '../../api/errors'
import { risksApi, LinkRiskThreatRequest } from '../../api/risks'
import { threatsApi, CreateThreatRequest } from '../../api/threats'
import { vulnerabilitiesApi, CreateVulnerabilityRequest } from '../../api/vulnerabilities'
import type { Asset, Risk, Threat, Vulnerability } from '../../api/types'

const THREAT_CATEGORIES = ['HUMAN', 'TECHNICAL', 'ENVIRONMENTAL', 'ORGANIZATIONAL']
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const LIKELIHOOD_OPTIONS = [1, 2, 3, 4, 5]

export default function RisksPage() {
  const [threats, setThreats] = useState<Threat[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submittingThreat, setSubmittingThreat] = useState(false)
  const [submittingVulnerability, setSubmittingVulnerability] = useState(false)
  const [linkingThreat, setLinkingThreat] = useState(false)
  const [selectedRiskId, setSelectedRiskId] = useState('')

  const {
    register: registerThreat,
    handleSubmit: handleSubmitThreat,
    reset: resetThreat,
    formState: { errors: threatErrors },
  } = useForm<CreateThreatRequest>({ defaultValues: { category: 'TECHNICAL', likelihood: 1, impact: 1 } })

  const {
    register: registerVulnerability,
    handleSubmit: handleSubmitVulnerability,
    reset: resetVulnerability,
    formState: { errors: vulnerabilityErrors },
  } = useForm<CreateVulnerabilityRequest>({ defaultValues: { severity: 'LOW' } })

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
      setSuccessMessage('Amenaza creada correctamente')
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
      await vulnerabilitiesApi.create(data)
      resetVulnerability({ severity: 'LOW' })
      setSuccessMessage('Vulnerabilidad creada correctamente')
      await loadData()
    } catch (err) {
      setFormError(parseFastApiError(err))
    } finally {
      setSubmittingVulnerability(false)
    }
  }

  const onLinkThreat = async () => {
    if (!selectedRiskId || !selectedThreatId) {
      setFormError('Seleccione un riesgo y una amenaza para vincular')
      return
    }
    setFormError(null)
    setSuccessMessage(null)
    setLinkingThreat(true)

    try {
      await risksApi.linkThreat(selectedRiskId, { threat_id: selectedThreatId })
      setSuccessMessage('Amenaza vinculada al riesgo satisfactoriamente')
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Gestión de riesgos</h1>
          <p className="text-sm text-white/40 mt-0.5">Cree amenazas, vulnerabilidades y vincule amenazas a riesgos existentes.</p>
        </div>
      </div>

      {formError && (
        <div className="rounded-xl border border-[#E5484D]/20 bg-[#3D161F] px-4 py-3 text-sm text-[#F2B8C6]">
          {formError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-[#4F6EF7]/20 bg-[#16203A] px-4 py-3 text-sm text-[#B7D7FF]">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#2A2E3D] bg-[#111318] p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Crear amenaza</h2>
                <p className="text-sm text-white/40">Identifique amenazas vinculadas al programa de riesgos.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitThreat(onCreateThreat)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Nombre *</label>
                <input
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder="e.g. Phishing interno"
                  {...registerThreat('name', { required: 'Este campo es obligatorio' })}
                />
                {threatErrors.name && <p className="text-xs text-[#E5484D]">{threatErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
                  placeholder="Información adicional sobre la amenaza"
                  {...registerThreat('description')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Categoría *</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerThreat('category', { required: 'Este campo es obligatorio' })}
                  >
                    <option value="">Seleccione categoría</option>
                    {THREAT_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="bg-[#1A1D28]">
                        {category}
                      </option>
                    ))}
                  </select>
                  {threatErrors.category && <p className="text-xs text-[#E5484D]">{threatErrors.category.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Probabilidad *</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
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
                  <label className="text-xs font-medium text-white/50">Impacto *</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
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
                {submittingThreat ? 'Guardando...' : 'Crear amenaza'}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-[#2A2E3D] bg-[#111318] p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Crear vulnerabilidad</h2>
              <p className="text-sm text-white/40">Registre vulnerabilidades asociadas a activos críticos.</p>
            </div>

            <form onSubmit={handleSubmitVulnerability(onCreateVulnerability)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Nombre *</label>
                <input
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  placeholder="e.g. Versión desactualizada"
                  {...registerVulnerability('name', { required: 'Este campo es obligatorio' })}
                />
                {vulnerabilityErrors.name && <p className="text-xs text-[#E5484D]">{vulnerabilityErrors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#4F6EF7] transition-colors resize-none"
                  placeholder="Detalles de la vulnerabilidad"
                  {...registerVulnerability('description')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Activo afectado *</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerVulnerability('asset_id', { required: 'Este campo es obligatorio' })}
                  >
                    <option value="">Seleccione activo</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id} className="bg-[#1A1D28]">
                        {asset.name}
                      </option>
                    ))}
                  </select>
                  {vulnerabilityErrors.asset_id && <p className="text-xs text-[#E5484D]">{vulnerabilityErrors.asset_id.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Severidad *</label>
                  <select
                    className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                    {...registerVulnerability('severity', { required: 'Este campo es obligatorio' })}
                  >
                    <option value="">Seleccione severidad</option>
                    {SEVERITY_OPTIONS.map((severity) => (
                      <option key={severity} value={severity} className="bg-[#1A1D28]">
                        {severity}
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
                {submittingVulnerability ? 'Guardando...' : 'Crear vulnerabilidad'}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-[#2A2E3D] bg-[#111318] p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Vincular amenaza a riesgo</h2>
              <p className="text-sm text-white/40">Seleccione un riesgo y una amenaza existente.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Riesgo *</label>
                <select
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  value={selectedRiskId}
                  onChange={(event) => setSelectedRiskId(event.target.value)}
                >
                  <option value="">Seleccione riesgo</option>
                  {risks.map((risk) => (
                    <option key={risk.id} value={risk.id} className="bg-[#1A1D28]">
                      {risk.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">Amenaza *</label>
                <select
                  className="w-full bg-[#0A0D16] border border-[#2A2E3D] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4F6EF7] transition-colors"
                  value={selectedThreatId}
                  onChange={(event) => setSelectedThreatId(event.target.value)}
                >
                  <option value="">Seleccione amenaza</option>
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
                {linkingThreat ? 'Vinculando...' : 'Vincular amenaza'}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[#2A2E3D] bg-[#111318] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Amenazas recientes</h3>
            {isLoading ? (
              <div className="text-sm text-white/40">Cargando amenazas...</div>
            ) : threats.length === 0 ? (
              <div className="text-sm text-white/40">No hay amenazas registradas.</div>
            ) : (
              <ul className="space-y-3">
                {threats.slice(0, 4).map((threat) => (
                  <li key={threat.id} className="rounded-2xl border border-[#2A2E3D] bg-[#0D1018] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{threat.name}</p>
                        <p className="text-xs text-white/40">{threat.category}</p>
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

          <section className="rounded-3xl border border-[#2A2E3D] bg-[#111318] p-6">
            <h3 className="text-base font-semibold text-white mb-4">Vulnerabilidades recientes</h3>
            {isLoading ? (
              <div className="text-sm text-white/40">Cargando vulnerabilidades...</div>
            ) : vulnerabilities.length === 0 ? (
              <div className="text-sm text-white/40">No hay vulnerabilidades registradas.</div>
            ) : (
              <ul className="space-y-3">
                {vulnerabilities.slice(0, 4).map((vuln) => (
                  <li key={vuln.id} className="rounded-2xl border border-[#2A2E3D] bg-[#0D1018] p-4">
                    <p className="text-sm font-semibold text-white">{vuln.name}</p>
                    <p className="text-xs text-white/40">{vuln.severity} · Activo: {assets.find((asset) => asset.id === vuln.asset_id)?.name ?? 'N/A'}</p>
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
