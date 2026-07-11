import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Tag from './Tag.jsx'
import { TYPE_META, colorParaTexto } from '../data/constants.js'
import { obtenerPreviewRecurso } from '../lib/thumbnails.js'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function formatBytes(bytes) {
  const number = Number(bytes || 0)
  if (!number) return ''
  if (number >= 1024 * 1024) return `${(number / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.ceil(number / 1024)} KB`
}

export default function ResourceCard({
  resource,
  viewMode,
  favorite,
  selected,
  onSelect,
  onToggleFavorite,
  onOpen,
  onDetails,
  onEdit,
  onDuplicate,
  onCopy,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const menuRef = useRef(null)
  const preview = obtenerPreviewRecurso(resource)
  const typeMeta = TYPE_META[resource.tipo] || TYPE_META.Otro
  const grades = Array.isArray(resource.grados) ? resource.grados : []
  const competencies = Array.isArray(resource.competencias) ? resource.competencias : []

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  return (
    <article className={`resource-card resource-card--${viewMode} ${selected ? 'is-selected' : ''}`}>
      <div className="resource-card__media" onClick={() => onDetails(resource)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onDetails(resource)}>
        {preview.tipo === 'imagen' && !imageError ? (
          <img src={preview.src} alt="" onError={() => setImageError(true)} />
        ) : (
          <div className={`resource-card__fallback resource-card__fallback--${typeMeta.className}`}><Icon name={typeMeta.icon} size={42} /></div>
        )}
        <div className="resource-card__mediaShade" />
        <span className={`resource-type resource-type--${typeMeta.className}`}><Icon name={typeMeta.icon} size={14} /> {resource.tipo}</span>
        <button type="button" className={`resource-card__select ${selected ? 'is-active' : ''}`} onClick={(event) => { event.stopPropagation(); onSelect(resource.id) }} aria-label="Seleccionar recurso">
          {selected && <Icon name="check" size={14} />}
        </button>
        <button type="button" className={`resource-card__favorite ${favorite ? 'is-active' : ''}`} onClick={(event) => { event.stopPropagation(); onToggleFavorite(resource.id) }} aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
          <Icon name="heart" size={18} filled={favorite} />
        </button>
      </div>

      <div className="resource-card__content">
        <div className="resource-card__eyebrow">
          <span>{resource.cefr || 'N/A'}</span>
          <span>{formatDate(resource.fecha)}</span>
        </div>
        <h3 onClick={() => onDetails(resource)}>{resource.titulo || 'Recurso sin título'}</h3>
        <p className="resource-card__description">{resource.descripcion || 'Sin descripción agregada.'}</p>

        <div className="resource-card__tags">
          {grades.slice(0, 2).map((grade) => <Tag key={grade} label={grade} color="purple" small />)}
          {grades.length > 2 && <Tag label={`+${grades.length - 2}`} color="purple" small />}
          {competencies.slice(0, 2).map((skill) => <Tag key={skill} label={skill} color="mint" small />)}
          {resource.tema && <Tag label={resource.tema} color={colorParaTexto(resource.tema)} small />}
        </div>

        <div className="resource-card__footer">
          <div className="resource-card__source">
            <span className="resource-card__sourceIcon"><Icon name={resource.fuente === 'Google Drive' ? 'folder' : 'link'} size={15} /></span>
            <span>{resource.archivoNombre || resource.fuente || 'Enlace externo'}</span>
            {resource.archivoTamano && <em>{formatBytes(resource.archivoTamano)}</em>}
          </div>
          <div className="resource-card__actions" ref={menuRef}>
            <button type="button" className="resource-card__open" onClick={() => onOpen(resource)}><Icon name="external" size={15} /> Abrir</button>
            <button type="button" className="resource-card__more" onClick={() => setMenuOpen((value) => !value)} aria-label="Más acciones"><Icon name="more" size={18} /></button>
            {menuOpen && (
              <div className="resource-menu">
                <button type="button" onClick={() => { setMenuOpen(false); onDetails(resource) }}><Icon name="eye" size={16} /> Ver detalles</button>
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(resource) }}><Icon name="edit" size={16} /> Editar recurso</button>
                <button type="button" onClick={() => { setMenuOpen(false); onDuplicate(resource) }}><Icon name="copy" size={16} /> Duplicar ficha</button>
                <button type="button" onClick={() => { setMenuOpen(false); onCopy(resource) }}><Icon name="link" size={16} /> Copiar enlace</button>
                <hr />
                <button type="button" className="is-danger" onClick={() => { setMenuOpen(false); onDelete(resource) }}><Icon name="trash" size={16} /> Eliminar</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
