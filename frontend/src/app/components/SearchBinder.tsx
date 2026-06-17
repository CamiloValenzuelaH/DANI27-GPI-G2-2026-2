import { useEffect, useMemo, useState } from 'react'
import { Search, Folder, Plus, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { searchIsoChunks, SearchResultItem } from '../../api/search'

const ANEXO_FOLDERS = [
  'A.5',
  'A.6',
  'A.7',
  'A.8',
  'A.9',
  'A.10',
  'A.11',
  'A.12',
  'A.13',
  'A.14',
  'A.15',
  'A.16',
  'A.17',
  'A.18',
]

const MAX_LOG = 50

const STORAGE_KEYS = {
  selectedIds: 'searchBinder.selectedIds',
  selectedItems: 'searchBinder.selectedItems',
  actionLog: 'searchBinder.actionLog',
}

function getUserKey(userId: string | null, key: string) {
  return userId ? `${userId}.${key}` : key
}

function loadSessionStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    const stored = sessionStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveSessionStorage<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') {
      return
    }

    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore sessionStorage errors
  }
}

function getFolderForClause(clauseRef: string) {
  if (!clauseRef) return 'Anexo A'
  const normalized = clauseRef.toUpperCase().trim()
  const folder = ANEXO_FOLDERS.find((prefix) => normalized.startsWith(prefix))
  return folder ? `Anexo A / ${folder}` : 'Anexo A / Otros'
}

interface SearchBinderProps {
  initialQuery?: string
}

export default function SearchBinder({ initialQuery = '' }: SearchBinderProps) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedItemsData, setSelectedItemsData] = useState<SearchResultItem[]>([])
  const [activeBinderId, setActiveBinderId] = useState<string | null>(null)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const selectedIdsKey = getUserKey(userId, STORAGE_KEYS.selectedIds)
    const selectedItemsKey = getUserKey(userId, STORAGE_KEYS.selectedItems)
    const actionLogKey = getUserKey(userId, STORAGE_KEYS.actionLog)

    setSelectedIds(loadSessionStorage(selectedIdsKey, []))
    setSelectedItemsData(loadSessionStorage(selectedItemsKey, []))
    setActionLog(loadSessionStorage(actionLogKey, []))
  }, [userId])

  useEffect(() => {
    const selectedIdsKey = getUserKey(userId, STORAGE_KEYS.selectedIds)
    saveSessionStorage(selectedIdsKey, selectedIds)
  }, [selectedIds, userId])

  useEffect(() => {
    const selectedItemsKey = getUserKey(userId, STORAGE_KEYS.selectedItems)
    saveSessionStorage(selectedItemsKey, selectedItemsData)
  }, [selectedItemsData, userId])

  useEffect(() => {
    const actionLogKey = getUserKey(userId, STORAGE_KEYS.actionLog)
    saveSessionStorage(actionLogKey, actionLog)
  }, [actionLog, userId])

  const selectedItems = useMemo(() => {
    const selectedMap = new Map<string, SearchResultItem>()
    selectedItemsData.forEach((item) => selectedMap.set(item.id, item))
    results.forEach((item) => {
      if (selectedIds.includes(item.id)) {
        selectedMap.set(item.id, item)
      }
    })

    return selectedIds
      .map((id) => selectedMap.get(id))
      .filter((item): item is SearchResultItem => Boolean(item))
  }, [results, selectedIds, selectedItemsData])

  const logAction = (message: string) => {
    setActionLog((prev) => [
      `${new Date().toLocaleTimeString('es-ES', { hour12: false })} - ${message}`,
      ...prev.slice(0, MAX_LOG - 1),
    ])
  }

  const performSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      setError('Ingrese un término para buscar.')
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      const response = await searchIsoChunks(trimmed)
      const normalized = response.results.map((item) => ({
        ...item,
        folder: getFolderForClause(item.clause_ref),
        preview: item.content.slice(0, 220),
      }))
      setResults(normalized)
      logAction(`Buscar: "${trimmed}" (${normalized.length} resultados) `)
    } catch (err) {
      console.error(err)
      setError('Error al buscar. Intente de nuevo.')
      logAction(`Error de búsqueda: "${trimmed}"`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => performSearch(query)

  const toggleSelectItem = (item: SearchResultItem) => {
    const isSelected = selectedIds.includes(item.id)
    const nextIds = isSelected ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id]
    const nextItems = isSelected
      ? selectedItemsData.filter((selected) => selected.id !== item.id)
      : [...selectedItemsData.filter((selected) => selected.id !== item.id), item]

    setSelectedIds(nextIds)
    setSelectedItemsData(nextItems)
    logAction(`${isSelected ? 'Deseleccionado' : 'Seleccionado'}: ${item.clause_ref} — ${item.title}`)
  }

  const removeBinderItem = (itemId: string) => {
    setSelectedIds((prevIds) => prevIds.filter((id) => id !== itemId))
    setSelectedItemsData((prevItems) => prevItems.filter((item) => item.id !== itemId))
    if (activeBinderId === itemId) {
      setActiveBinderId(null)
    }
    logAction(`Eliminado del binder: ${itemId}`)
  }

  const clearSelection = () => {
    setSelectedIds([])
    setSelectedItemsData([])
    setActiveBinderId(null)
    saveSessionStorage(STORAGE_KEYS.selectedIds, [])
    saveSessionStorage(STORAGE_KEYS.selectedItems, [])
    logAction('Binder vaciado')
  }

  const previewCountLabel = selectedItems.length === 1 ? '1 elemento seleccionado' : `${selectedItems.length} elementos seleccionados`
  const activeBinderItem = selectedItems.find((item) => item.id === activeBinderId) || null

  useEffect(() => {
    if (!initialQuery.trim()) {
      return
    }

    setQuery(initialQuery)
    performSearch(initialQuery)
  }, [initialQuery])

  return (
    <div className="bg-white dark:bg-[#0F1729] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-3xl p-5 shadow-sm space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 text-[#4F6EF7] -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Busca en lenguaje natural: e.g. políticas de acceso, evidencias de auditoría"
            className="w-full rounded-full border border-[#E2E5EB] bg-white px-12 py-3 text-sm text-[#1A1D26] outline-none transition focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 dark:border-[#2A2E3D] dark:bg-[#111318] dark:text-white"
          />
        </div>
        <button
          onClick={handleSearch}
          className="inline-flex items-center gap-2 rounded-full bg-[#4F6EF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3B5EEB]"
        >
          Buscar
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#4F6EF7] font-semibold">Resultados relevantes</p>
              <h2 className="text-lg font-semibold text-[#1A1D26] dark:text-white">Vista rápida de Anexo A</h2>
            </div>
            <div className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0]">{results.length} resultados</div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-[#4F6EF7]/30 bg-[#F7F8FA] p-8 text-center text-sm text-[#4F6EF7] dark:bg-[#111318] dark:border-[#4F6EF7]/30">
                Cargando resultados…
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E2E5EB] bg-[#F8F9FC] p-8 text-center text-sm text-[#5F6B7A] dark:border-[#2A2E3D] dark:bg-[#111318] dark:text-[#9AA3B0]">
                Ejecuta una búsqueda para ver fragmentos del Anexo A.
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-3xl border border-[#E2E5EB] bg-white p-5 transition hover:border-[#4F6EF7] hover:shadow-lg dark:border-[#2A2E3D] dark:bg-[#111318]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#4F6EF7] font-semibold">
                        <Folder className="h-3.5 w-3.5" />
                        <span>{item.folder}</span>
                      </div>
                      <div className="text-sm font-semibold text-[#0F1729] dark:text-white">{item.clause_ref} · {item.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${selectedIds.includes(item.id)
                        ? 'bg-[#1DB954]/10 text-[#0F5132] border border-[#0F5132]/10'
                        : 'bg-[#E5E7EB] text-[#475569] hover:bg-[#CBD5E1] dark:bg-[#1E2434] dark:text-[#E2E8F0] dark:hover:bg-[#2A3045]'}`}
                    >
                      {selectedIds.includes(item.id) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {selectedIds.includes(item.id) ? 'Agregado binder' : 'Agregar binder'}
                    </button>
                  </div>
                  <div className="mt-4 text-sm leading-6 text-[#5F6B7A] dark:text-[#CAD5E8]">
                    {item.preview}...
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    <span className="rounded-full bg-[#EEF2FF] px-2 py-1 dark:bg-[#1E293B]">Relevancia {Math.round(item.relevance_score * 100)}%</span>
                    <span className="rounded-full bg-[#ECFDF5] px-2 py-1 text-[#166534] dark:bg-[#164E37]/10">{item.clause_ref}</span>
                    <span className="flex items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-1 dark:bg-[#111827]">Preview inline</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-[#E2E5EB] bg-[#F8F9FC] p-5 shadow-sm dark:border-[#2A2E3D] dark:bg-[#111318]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#F97316] font-semibold">Binder</p>
                <h3 className="text-sm font-semibold text-[#0F1729] dark:text-white">Selección múltiple</h3>
              </div>
              <button
                onClick={clearSelection}
                className="text-xs font-semibold text-[#4F6EF7] hover:text-[#2563EB]"
              >Limpiar</button>
            </div>
            <div className="mt-4 space-y-3">
              {selectedItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white px-4 py-5 text-sm text-[#64748B] dark:border-[#334155] dark:bg-[#0F1729] dark:text-[#94A3B8]">
                  No hay elementos seleccionados. Agrega items del listado.
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`w-full rounded-3xl border p-4 transition ${
                      activeBinderId === item.id
                        ? 'border-[#4F6EF7] bg-[#EFF6FF] dark:border-[#4F6EF7] dark:bg-[#111827]'
                        : 'border-[#E5E7EB] bg-white dark:border-[#2A2E3D] dark:bg-[#111318]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveBinderId(activeBinderId === item.id ? null : item.id)}
                        className="text-left flex-1"
                      >
                        <div className="text-sm font-semibold text-[#0F1729] dark:text-white">{item.clause_ref}</div>
                        <div className="mt-2 text-sm text-[#475569] dark:text-[#CBD5E1]">{item.title}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBinderItem(item.id)}
                        className="text-xs font-semibold text-[#EF4444] hover:text-[#B91C1C]"
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">{item.folder}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {activeBinderItem ? (
              <div className="mt-4 rounded-3xl border border-[#D1D5EB] bg-[#F8FAFC] p-4 text-sm text-[#334155] dark:border-[#2A2E3D] dark:bg-[#111318] dark:text-[#CAD5E8]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#4F6EF7] font-semibold">Detalle del binder</div>
                    <div className="text-sm font-semibold text-[#0F1729] dark:text-white">{activeBinderItem.clause_ref} · {activeBinderItem.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveBinderId(null)}
                    className="text-xs font-semibold text-[#4F6EF7] hover:text-[#2563EB]"
                  >Cerrar</button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-6 text-[#475569] dark:text-[#CBD5E1]">
                  {activeBinderItem.content}
                </div>
              </div>
            ) : null}
            <div className="mt-4 rounded-3xl bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8] dark:bg-[#1E293B] dark:text-[#93C5FD]">
              {previewCountLabel}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E2E5EB] bg-white p-5 shadow-sm dark:border-[#2A2E3D] dark:bg-[#111318]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#7C3AED] font-semibold">
              <Clock className="h-3.5 w-3.5" /> Registro de acciones
            </div>
            <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-2 text-sm text-[#475569] dark:text-[#CBD5E1]">
              {actionLog.length === 0 ? (
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Aquí aparecerán tus últimas 50 acciones.</p>
              ) : (
                actionLog.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="rounded-2xl bg-[#F8FAFC] px-3 py-2 text-[13px] dark:bg-[#111827]">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
