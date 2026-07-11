import Icon from './Icon.jsx'
import { SORT_OPTIONS } from '../data/constants.js'

export default function SearchBar({
  value,
  onChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onToggleFilters,
  filterCount,
  onRefresh,
  onExport,
  refreshing,
}) {
  return (
    <div className="moa-commandbar">
      <label className="moa-searchbox">
        <Icon name="search" size={20} />
        <input
          id="moa-global-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar por título, tema, nivel, grado o competencia…"
          autoComplete="off"
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div className="moa-commandbar__actions">
        <button type="button" className={`moa-tool-button ${filterCount ? 'is-active' : ''}`} onClick={onToggleFilters}>
          <Icon name="filter" size={17} /> Filtros {filterCount > 0 && <em>{filterCount}</em>}
        </button>

        <label className="moa-sort-select">
          <span>Ordenar</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
            {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <div className="moa-view-switch" aria-label="Cambiar vista">
          <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => onViewModeChange('grid')} aria-label="Vista de tarjetas"><Icon name="grid" size={17} /></button>
          <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => onViewModeChange('list')} aria-label="Vista de lista"><Icon name="list" size={18} /></button>
        </div>

        <button type="button" className="moa-icon-button" onClick={onExport} title="Exportar resultados a CSV"><Icon name="download" size={18} /></button>
        <button type="button" className={`moa-icon-button ${refreshing ? 'is-spinning' : ''}`} onClick={onRefresh} title="Actualizar repositorio" disabled={refreshing}><Icon name="refresh" size={18} /></button>
      </div>
    </div>
  )
}
