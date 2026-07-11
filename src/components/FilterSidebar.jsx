import Icon from './Icon.jsx'
import { TIPOS_RECURSO, GRADOS_ESCOLARES, EDADES, NIVELES_CEFR, COMPETENCIAS } from '../data/constants.js'

function FilterGroup({ title, options, selected, onToggle, counts = {} }) {
  return (
    <section className="moa-filter-group">
      <h3>{title}</h3>
      <div className="moa-filter-options">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button key={option} type="button" className={active ? 'is-active' : ''} onClick={() => onToggle(option)}>
              <span className="moa-filter-check">{active ? <Icon name="check" size={13} /> : null}</span>
              <span>{option}</span>
              <em>{counts[option] || 0}</em>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function FilterSidebar({ filters, setFilters, topics, counts, open, onClose, onClear }) {
  const toggle = (field, value) => {
    setFilters((current) => {
      const values = current[field]
      return { ...current, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] }
    })
  }

  const activeCount = Object.values(filters).reduce((total, values) => total + values.length, 0)

  return (
    <>
      {open && <button type="button" className="moa-filter-backdrop" onClick={onClose} aria-label="Cerrar filtros" />}
      <aside className={`moa-filter-panel ${open ? 'is-open' : ''}`}>
        <div className="moa-filter-panel__head">
          <div>
            <p>Refinar biblioteca</p>
            <h2>Filtros avanzados</h2>
          </div>
          <button type="button" onClick={onClose} className="moa-filter-panel__close"><Icon name="close" size={18} /></button>
        </div>

        {activeCount > 0 && (
          <div className="moa-active-filter-summary">
            <strong>{activeCount} filtro{activeCount === 1 ? '' : 's'} activo{activeCount === 1 ? '' : 's'}</strong>
            <button type="button" onClick={onClear}>Limpiar todo</button>
          </div>
        )}

        <div className="moa-filter-panel__body">
          <FilterGroup title="Tipo de recurso" options={TIPOS_RECURSO} selected={filters.tipo} onToggle={(value) => toggle('tipo', value)} counts={counts.tipo} />
          <FilterGroup title="Nivel CEFR" options={NIVELES_CEFR} selected={filters.cefr} onToggle={(value) => toggle('cefr', value)} counts={counts.cefr} />
          <FilterGroup title="Competencia" options={COMPETENCIAS} selected={filters.competencias} onToggle={(value) => toggle('competencias', value)} counts={counts.competencias} />
          <FilterGroup title="Grado escolar" options={GRADOS_ESCOLARES} selected={filters.grados} onToggle={(value) => toggle('grados', value)} counts={counts.grados} />
          <FilterGroup title="Edad recomendada" options={EDADES} selected={filters.edades} onToggle={(value) => toggle('edades', value)} counts={counts.edades} />
          {topics.length > 0 && <FilterGroup title="Temas del repositorio" options={topics} selected={filters.temas} onToggle={(value) => toggle('temas', value)} counts={counts.temas} />}
        </div>
      </aside>
    </>
  )
}
