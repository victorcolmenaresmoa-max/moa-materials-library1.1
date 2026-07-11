import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import Tag from './Tag.jsx'
import { TYPE_META, colorParaTexto } from '../data/constants.js'
import { obtenerPreviewRecurso } from '../lib/thumbnails.js'

function formatDate(value) {
  if (!value) return 'Sin fecha registrada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function Metadata({ icon, label, children }) {
  return (
    <div className="resource-detail__metaItem">
      <span><Icon name={icon} size={17} /></span>
      <div><small>{label}</small><strong>{children || 'No especificado'}</strong></div>
    </div>
  )
}

export default function ResourceDetails({ resource, favorite, onClose, onOpen, onEdit, onDelete, onToggleFavorite, onCopy }) {
  const [imageError, setImageError] = useState(false)
  const preview = obtenerPreviewRecurso(resource)
  const typeMeta = TYPE_META[resource.tipo] || TYPE_META.Otro

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
    }
  }, [onClose])

  return (
    <div className="moa-modal" role="dialog" aria-modal="true" aria-label={`Detalles de ${resource.titulo}`}>
      <button type="button" className="moa-modal__backdrop" onClick={onClose} aria-label="Cerrar" />
      <section className="resource-detail">
        <div className="resource-detail__topbar">
          <div className="resource-detail__brand"><img src="/moa-logo.png" alt="" /><span><small>MOA Materials</small><strong>Ficha de recurso</strong></span></div>
          <button type="button" className="moa-modal__close" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>

        <div className="resource-detail__layout">
          <div className="resource-detail__preview">
            {preview.tipo === 'imagen' && !imageError ? <img src={preview.src} alt="" onError={() => setImageError(true)} /> : <div className={`resource-detail__fallback resource-detail__fallback--${typeMeta.className}`}><Icon name={typeMeta.icon} size={72} /><strong>{resource.tipo}</strong></div>}
            <span className={`resource-type resource-type--${typeMeta.className}`}><Icon name={typeMeta.icon} size={14} /> {resource.tipo}</span>
          </div>

          <div className="resource-detail__content">
            <div className="resource-detail__heading">
              <div><p>Repositorio académico MOA</p><h2>{resource.titulo}</h2></div>
              <button type="button" className={`resource-detail__favorite ${favorite ? 'is-active' : ''}`} onClick={() => onToggleFavorite(resource.id)}><Icon name="heart" size={20} filled={favorite} /> {favorite ? 'Favorito' : 'Guardar'}</button>
            </div>

            <p className="resource-detail__description">{resource.descripcion || 'Este recurso todavía no tiene una descripción detallada.'}</p>

            <div className="resource-detail__tags">
              {(resource.grados || []).map((item) => <Tag key={item} label={item} color="purple" />)}
              {(resource.edades || []).map((item) => <Tag key={item} label={item} color="sand" />)}
              {(resource.competencias || []).map((item) => <Tag key={item} label={item} color="mint" />)}
              {resource.tema && <Tag label={resource.tema} color={colorParaTexto(resource.tema)} />}
            </div>

            <div className="resource-detail__metadata">
              <Metadata icon="chart" label="Nivel CEFR">{resource.cefr}</Metadata>
              <Metadata icon="clock" label="Agregado">{formatDate(resource.fecha)}</Metadata>
              <Metadata icon="folder" label="Fuente">{resource.fuente || 'Enlace externo'}</Metadata>
              <Metadata icon="file" label="Archivo">{resource.archivoNombre || 'No aplica'}</Metadata>
            </div>

            <div className="resource-detail__actions">
              <button type="button" className="moa-primary-button moa-primary-button--large" onClick={() => onOpen(resource)}><Icon name="external" size={18} /> Abrir recurso</button>
              <button type="button" className="moa-secondary-button" onClick={() => onEdit(resource)}><Icon name="edit" size={17} /> Editar</button>
              <button type="button" className="moa-secondary-button" onClick={() => onCopy(resource)}><Icon name="link" size={17} /> Copiar enlace</button>
              <button type="button" className="moa-danger-button" onClick={() => onDelete(resource)}><Icon name="trash" size={17} /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
