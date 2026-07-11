import Icon from './Icon.jsx'

const NAV_ITEMS = [
  { id: 'library', label: 'Biblioteca', icon: 'library' },
  { id: 'favorites', label: 'Favoritos', icon: 'heart' },
  { id: 'recent', label: 'Recientes', icon: 'clock' },
  { id: 'insights', label: 'Insights', icon: 'chart' },
]

export default function Header({ view, onNavigate, onNew, favoriteCount }) {
  return (
    <header className="moa-header">
      <div className="moa-header__inner">
        <button type="button" className="moa-brand" onClick={() => onNavigate('library')} aria-label="Ir a la biblioteca MOA">
          <span className="moa-brand__logoWrap"><img src="/moa-logo.png" alt="MOA Education" /></span>
          <span className="moa-brand__copy">
            <span className="moa-brand__eyebrow">Academic Operations</span>
            <span className="moa-brand__title">MOA Materials Library</span>
            <span className="moa-brand__subtitle">Repositorio inteligente de recursos educativos</span>
          </span>
        </button>

        <nav className="moa-nav" aria-label="Vistas principales">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} type="button" className={`moa-nav__item ${view === item.id ? 'is-active' : ''}`} onClick={() => onNavigate(item.id)}>
              <span className="moa-nav__icon"><Icon name={item.icon} size={17} /></span>
              <span>{item.label}</span>
              {item.id === 'favorites' && favoriteCount > 0 && <em>{favoriteCount}</em>}
            </button>
          ))}
        </nav>

        <div className="moa-header__actions">
          <span className="moa-workspace-pill"><i /> MOA Workspace</span>
          <button type="button" className="moa-primary-button" onClick={onNew}>
            <Icon name="plus" size={18} /> Nuevo recurso
          </button>
        </div>
      </div>
    </header>
  )
}
