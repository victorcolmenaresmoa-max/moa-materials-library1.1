import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import SearchBar from './SearchBar.jsx'
import FilterSidebar from './FilterSidebar.jsx'
import ResourceCard from './ResourceCard.jsx'
import { TIPOS_RECURSO, TYPE_META } from '../data/constants.js'
import { readJSON, writeJSON } from '../lib/storage.js'

const EMPTY_FILTERS = { tipo: [], grados: [], edades: [], cefr: [], competencias: [], temas: [] }

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function resourceMatches(resource, query, filters) {
  const searchable = normalize([
    resource.titulo,
    resource.descripcion,
    resource.tema,
    resource.tipo,
    resource.cefr,
    ...(resource.grados || []),
    ...(resource.edades || []),
    ...(resource.competencias || []),
  ].join(' '))

  if (query && !searchable.includes(normalize(query))) return false
  if (filters.tipo.length && !filters.tipo.includes(resource.tipo)) return false
  if (filters.cefr.length && !filters.cefr.includes(resource.cefr)) return false
  if (filters.temas.length && !filters.temas.includes(resource.tema)) return false
  if (filters.grados.length && !filters.grados.some((item) => (resource.grados || []).includes(item))) return false
  if (filters.edades.length && !filters.edades.some((item) => (resource.edades || []).includes(item))) return false
  if (filters.competencias.length && !filters.competencias.some((item) => (resource.competencias || []).includes(item))) return false
  return true
}

function sortResources(resources, sort) {
  const list = [...resources]
  const dateValue = (resource) => new Date(resource.fecha || 0).getTime() || 0
  if (sort === 'newest') return list.sort((a, b) => dateValue(b) - dateValue(a))
  if (sort === 'oldest') return list.sort((a, b) => dateValue(a) - dateValue(b))
  if (sort === 'title-desc') return list.sort((a, b) => String(b.titulo).localeCompare(String(a.titulo), 'es', { sensitivity: 'base' }))
  if (sort === 'type') return list.sort((a, b) => String(a.tipo).localeCompare(String(b.tipo), 'es'))
  if (sort === 'cefr') return list.sort((a, b) => String(a.cefr).localeCompare(String(b.cefr), 'es', { numeric: true }))
  return list.sort((a, b) => String(a.titulo).localeCompare(String(b.titulo), 'es', { sensitivity: 'base' }))
}

function countField(resources, field, arrayField = false) {
  return resources.reduce((map, resource) => {
    const values = arrayField ? resource[field] || [] : [resource[field]]
    values.filter(Boolean).forEach((value) => { map[value] = (map[value] || 0) + 1 })
    return map
  }, {})
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function downloadCsv(resources) {
  const headers = ['Título', 'Tipo', 'URL', 'Grados', 'Edades', 'CEFR', 'Tema', 'Competencias', 'Descripción', 'Fecha']
  const rows = resources.map((resource) => [resource.titulo, resource.tipo, resource.url, resource.grados, resource.edades, resource.cefr, resource.tema, resource.competencias, resource.descripcion, resource.fecha])
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `moa-materials-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

const HERO_COPY = {
  library: {
    eyebrow: 'MOA Resource Studio',
    title: 'La biblioteca académica del equipo MOA.',
    description: 'Encuentra, organiza y reutiliza materiales listos para cada nivel, grado y competencia desde un solo workspace.',
  },
  favorites: {
    eyebrow: 'Tu selección curada',
    title: 'Favoritos que siempre quieres tener a mano.',
    description: 'Una colección personal y rápida de los materiales que más utilizas en planificación y producción académica.',
  },
  recent: {
    eyebrow: 'Actividad personal',
    title: 'Retoma exactamente donde lo dejaste.',
    description: 'Consulta los recursos que abriste recientemente y vuelve a ellos sin tener que buscarlos otra vez.',
  },
}

export default function Dashboard({
  mode = 'library',
  resources,
  loading,
  error,
  favorites,
  recentIds,
  onToggleFavorite,
  onOpen,
  onDetails,
  onEdit,
  onDuplicate,
  onCopy,
  onDelete,
  onDeleteMany,
  onRefresh,
  onNew,
  refreshing,
}) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState(() => readJSON('moa-materials-sort', 'newest'))
  const [viewMode, setViewMode] = useState(() => readJSON('moa-materials-view-mode', 'grid'))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [quickType, setQuickType] = useState('Todos')

  useEffect(() => writeJSON('moa-materials-sort', sort), [sort])
  useEffect(() => writeJSON('moa-materials-view-mode', viewMode), [viewMode])
  useEffect(() => setSelected(new Set()), [mode])

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.getElementById('moa-global-search')?.focus()
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  const modeResources = useMemo(() => {
    if (mode === 'favorites') return resources.filter((resource) => favorites.has(resource.id))
    if (mode === 'recent') {
      const order = new Map(recentIds.map((id, index) => [id, index]))
      return resources.filter((resource) => order.has(resource.id)).sort((a, b) => order.get(a.id) - order.get(b.id))
    }
    return resources
  }, [mode, resources, favorites, recentIds])

  const topics = useMemo(() => [...new Set(resources.map((resource) => resource.tema).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [resources])

  const counts = useMemo(() => ({
    tipo: countField(modeResources, 'tipo'),
    cefr: countField(modeResources, 'cefr'),
    temas: countField(modeResources, 'tema'),
    grados: countField(modeResources, 'grados', true),
    edades: countField(modeResources, 'edades', true),
    competencias: countField(modeResources, 'competencias', true),
  }), [modeResources])

  const results = useMemo(() => {
    let list = modeResources.filter((resource) => resourceMatches(resource, query, filters))
    if (quickType !== 'Todos') list = list.filter((resource) => resource.tipo === quickType)
    return mode === 'recent' && sort === 'newest' ? list : sortResources(list, sort)
  }, [modeResources, query, filters, quickType, sort, mode])

  const filterCount = Object.values(filters).reduce((total, values) => total + values.length, 0) + (quickType === 'Todos' ? 0 : 1)
  const hero = HERO_COPY[mode] || HERO_COPY.library
  const driveCount = modeResources.filter((resource) => resource.fuente === 'Google Drive').length
  const levelCount = new Set(modeResources.map((resource) => resource.cefr).filter((value) => value && value !== 'N/A')).size

  function toggleSelected(id) {
    setSelected((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearAll() {
    setQuery('')
    setFilters(EMPTY_FILTERS)
    setQuickType('Todos')
  }

  async function deleteSelected() {
    if (!selected.size) return
    const ids = [...selected]
    if (!window.confirm(`¿Eliminar ${ids.length} recurso${ids.length === 1 ? '' : 's'} del repositorio? Los archivos de Drive no se borrarán.`)) return
    await onDeleteMany(ids)
    setSelected(new Set())
  }

  return (
    <main className="page-shell moa-library-page">
      <section className={`premium-hero premium-hero--${mode}`}>
        <div className="premium-hero__content">
          <p><span /> {hero.eyebrow}</p>
          <h1>{hero.title}</h1>
          <p className="premium-hero__description">{hero.description}</p>
          <div className="premium-hero__quickActions">
            <button type="button" onClick={onNew}><Icon name="plus" size={17} /> Agregar recurso</button>
            <button type="button" onClick={() => document.getElementById('moa-global-search')?.focus()}><Icon name="search" size={17} /> Buscar en la biblioteca</button>
          </div>
        </div>
        <div className="premium-hero__stats">
          <article><span><Icon name="library" size={20} /></span><strong>{loading ? '…' : modeResources.length}</strong><small>{mode === 'favorites' ? 'favoritos' : mode === 'recent' ? 'recientes' : 'recursos'}</small></article>
          <article><span><Icon name="folder" size={20} /></span><strong>{loading ? '…' : driveCount}</strong><small>en Drive</small></article>
          <article><span><Icon name="chart" size={20} /></span><strong>{loading ? '…' : levelCount}</strong><small>niveles</small></article>
        </div>
        <div className="premium-hero__logoWatermark"><img src="/moa-logo.png" alt="" /></div>
      </section>

      <section className="library-control-center">
        <div className="library-control-center__head">
          <div><p>Explorar por formato</p><h2>Accesos rápidos</h2></div>
          <span>{results.length} resultado{results.length === 1 ? '' : 's'}</span>
        </div>
        <div className="quick-type-row">
          {['Todos', ...TIPOS_RECURSO].map((type) => {
            const meta = type === 'Todos' ? { icon: 'library', className: 'all' } : TYPE_META[type]
            return (
              <button key={type} type="button" className={`quick-type-card quick-type-card--${meta.className} ${quickType === type ? 'is-active' : ''}`} onClick={() => setQuickType(type)}>
                <span><Icon name={meta.icon} size={19} /></span><strong>{type}</strong><em>{type === 'Todos' ? modeResources.length : counts.tipo[type] || 0}</em>
              </button>
            )
          })}
        </div>
      </section>

      <SearchBar
        value={query}
        onChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleFilters={() => setFiltersOpen(true)}
        filterCount={filterCount}
        onRefresh={onRefresh}
        onExport={() => downloadCsv(results)}
        refreshing={refreshing}
      />

      {filterCount > 0 && (
        <div className="active-filter-row">
          <span><Icon name="filter" size={15} /> Filtros activos</span>
          {quickType !== 'Todos' && <button type="button" onClick={() => setQuickType('Todos')}>{quickType} ×</button>}
          {Object.entries(filters).flatMap(([field, values]) => values.map((value) => (
            <button key={`${field}-${value}`} type="button" onClick={() => setFilters((current) => ({ ...current, [field]: current[field].filter((item) => item !== value) }))}>{value} ×</button>
          )))}
          <button type="button" className="active-filter-row__clear" onClick={clearAll}>Limpiar todo</button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="bulk-toolbar">
          <span><Icon name="check" size={16} /> {selected.size} seleccionado{selected.size === 1 ? '' : 's'}</span>
          <button type="button" onClick={() => setSelected(new Set())}>Cancelar</button>
          <button type="button" className="is-danger" onClick={deleteSelected}><Icon name="trash" size={16} /> Eliminar selección</button>
        </div>
      )}

      <FilterSidebar filters={filters} setFilters={setFilters} topics={topics} counts={counts} open={filtersOpen} onClose={() => setFiltersOpen(false)} onClear={clearAll} />

      <section className="library-results" aria-live="polite">
        {error && <div className="moa-state-card moa-state-card--error"><Icon name="info" size={28} /><h2>No pudimos cargar la biblioteca</h2><p>{error}</p><button type="button" onClick={onRefresh}>Intentar de nuevo</button></div>}

        {!error && loading && <div className={`resource-grid resource-grid--${viewMode}`}>{Array.from({ length: 8 }).map((_, index) => <div key={index} className="resource-card resource-card--skeleton" />)}</div>}

        {!error && !loading && results.length === 0 && (
          <div className="moa-state-card">
            <span className="moa-state-card__logo"><img src="/moa-logo.png" alt="" /></span>
            <h2>{mode === 'favorites' ? 'Todavía no tienes favoritos' : mode === 'recent' ? 'Todavía no hay actividad reciente' : 'No encontramos recursos'}</h2>
            <p>{mode === 'favorites' ? 'Marca el corazón de cualquier recurso para construir tu colección personal.' : mode === 'recent' ? 'Los materiales que abras aparecerán aquí automáticamente.' : 'Prueba con otra búsqueda o reduce la cantidad de filtros activos.'}</p>
            {mode === 'library' ? <button type="button" onClick={clearAll}>Limpiar búsqueda</button> : <button type="button" onClick={onNew}>Agregar un recurso</button>}
          </div>
        )}

        {!error && !loading && results.length > 0 && (
          <div className={`resource-grid resource-grid--${viewMode}`}>
            {results.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                viewMode={viewMode}
                favorite={favorites.has(resource.id)}
                selected={selected.has(resource.id)}
                onSelect={toggleSelected}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpen}
                onDetails={onDetails}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onCopy={onCopy}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
