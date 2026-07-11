import Icon from './Icon.jsx'
import { TIPOS_RECURSO, NIVELES_CEFR, COMPETENCIAS, TYPE_META } from '../data/constants.js'

function countBy(resources, field, options, arrayField = false) {
  return options.map((option) => ({
    label: option,
    count: resources.filter((resource) => arrayField ? (resource[field] || []).includes(option) : resource[field] === option).length,
  }))
}

function Metric({ icon, value, label, note }) {
  return (
    <article className="insight-metric">
      <span className="insight-metric__icon"><Icon name={icon} size={22} /></span>
      <div><strong>{value}</strong><span>{label}</span><small>{note}</small></div>
    </article>
  )
}

function Distribution({ title, subtitle, items, accent = 'teal' }) {
  const max = Math.max(...items.map((item) => item.count), 1)
  return (
    <section className="insight-card">
      <div className="insight-card__head"><div><p>{subtitle}</p><h3>{title}</h3></div></div>
      <div className="insight-bars">
        {items.map((item) => (
          <div className="insight-bar" key={item.label}>
            <div className="insight-bar__label"><span>{item.label}</span><strong>{item.count}</strong></div>
            <div className="insight-bar__track"><span className={`insight-bar__fill insight-bar__fill--${accent}`} style={{ width: `${(item.count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Insights({ resources, favorites }) {
  const withDrive = resources.filter((resource) => resource.fuente === 'Google Drive').length
  const withDescription = resources.filter((resource) => resource.descripcion).length
  const themes = new Set(resources.map((resource) => resource.tema).filter(Boolean)).size
  const typeData = countBy(resources, 'tipo', TIPOS_RECURSO)
  const levelData = countBy(resources, 'cefr', NIVELES_CEFR).filter((item) => item.count)
  const skillData = countBy(resources, 'competencias', COMPETENCIAS, true)

  const recent = [...resources]
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
    .slice(0, 5)

  return (
    <main className="moa-insights page-shell">
      <section className="premium-hero premium-hero--insights">
        <div className="premium-hero__content">
          <p><span /> MOA Library Intelligence</p>
          <h1>Insights del repositorio</h1>
          <p className="premium-hero__description">Una lectura rápida de la cobertura académica, formatos disponibles y calidad de catalogación de la biblioteca.</p>
        </div>
        <div className="premium-hero__visual"><Icon name="chart" size={58} /></div>
      </section>

      <div className="insight-metrics">
        <Metric icon="library" value={resources.length} label="Recursos totales" note="Catálogo disponible" />
        <Metric icon="heart" value={favorites.size} label="Favoritos" note="Guardados en este navegador" />
        <Metric icon="folder" value={withDrive} label="Archivos en Drive" note="Banco centralizado" />
        <Metric icon="sparkles" value={themes} label="Temas cubiertos" note="Diversidad curricular" />
      </div>

      <div className="insights-grid">
        <Distribution title="Formatos disponibles" subtitle="Distribución por tipo" items={typeData} accent="teal" />
        <Distribution title="Cobertura por nivel" subtitle="Niveles CEFR con materiales" items={levelData.length ? levelData : [{ label: 'Sin datos', count: 0 }]} accent="purple" />
        <Distribution title="Competencias lingüísticas" subtitle="Recursos por skill" items={skillData} accent="pink" />

        <section className="insight-card insight-card--quality">
          <div className="insight-card__head"><div><p>Calidad de catálogo</p><h3>Completitud de las fichas</h3></div></div>
          <div className="quality-score">
            <div className="quality-score__circle"><strong>{resources.length ? Math.round((withDescription / resources.length) * 100) : 0}%</strong><span>con descripción</span></div>
            <div className="quality-checklist">
              <span><Icon name="check" size={15} /> {withDescription} fichas documentadas</span>
              <span><Icon name="check" size={15} /> {withDrive} recursos centralizados</span>
              <span><Icon name="check" size={15} /> {resources.filter((r) => r.cefr && r.cefr !== 'N/A').length} recursos nivelados</span>
            </div>
          </div>
        </section>
      </div>

      <section className="insight-card insight-card--recent">
        <div className="insight-card__head"><div><p>Actividad reciente</p><h3>Últimos recursos agregados</h3></div></div>
        <div className="recent-table">
          {recent.map((resource) => {
            const meta = TYPE_META[resource.tipo] || TYPE_META.Otro
            return <div className="recent-table__row" key={resource.id}><span className={`recent-table__icon recent-table__icon--${meta.className}`}><Icon name={meta.icon} size={18} /></span><strong>{resource.titulo}</strong><span>{resource.tipo}</span><span>{resource.cefr || 'N/A'}</span></div>
          })}
          {!recent.length && <p className="moa-empty-inline">Todavía no hay recursos registrados.</p>}
        </div>
      </section>
    </main>
  )
}
