import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import MultiSelect from './MultiSelect.jsx'
import Tag from './Tag.jsx'
import {
  TIPOS_RECURSO,
  TIPOS_CON_BANCO,
  TIPOS_SOLO_ENLACE,
  GRADOS_ESCOLARES,
  EDADES,
  NIVELES_CEFR,
  TEMAS_SUGERIDOS,
  COMPETENCIAS,
  TYPE_META,
  colorParaTexto,
} from '../data/constants.js'
import { actualizarRecurso, crearRecurso, subirArchivoRecurso } from '../lib/sheetsApi.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { obtenerPreviewRecurso } from '../lib/thumbnails.js'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const DRAFT_KEY = 'moa-materials-form-draft-v2'

const EMPTY = {
  titulo: '', tipo: '', url: '', grados: [], edades: [], cefr: '', tema: '',
  competencias: [], descripcion: '', archivoId: '', archivoNombre: '', archivoMime: '',
  archivoTamano: '', previewUrl: '', fuente: '',
}

const ACCEPT_BY_TYPE = {
  Imagen: 'image/*',
  PDF: 'application/pdf,.pdf',
  Otro: '.doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.zip,.rar,.txt,.mp3,.mp4,.mov,.png,.jpg,.jpeg,.webp',
}

const SOURCE_COPY = {
  Video: { label: 'Enlace del video', placeholder: 'https://youtube.com/watch?v=…', help: 'Usa YouTube, Vimeo o un enlace compartido de Google Drive.' },
  'Link de Juego': { label: 'Enlace del juego', placeholder: 'https://wordwall.net/…', help: 'Funciona con Wordwall, Kahoot, Genially y otras plataformas.' },
  Imagen: { label: 'Banco de imágenes', placeholder: 'https://sitio.com/imagen.png', help: 'Arrastra, pega o selecciona una imagen. También puedes importarla desde una URL directa.' },
  PDF: { label: 'Banco de documentos', placeholder: 'https://sitio.com/documento.pdf', help: 'El PDF se almacenará en el banco central de Google Drive.' },
  Otro: { label: 'Banco de archivos', placeholder: 'https://sitio.com/archivo.docx', help: 'Admite documentos, presentaciones, audios, ZIP y otros materiales de apoyo.' },
}

function validUrl(value) {
  try { new URL(String(value || '').trim()); return true } catch { return false }
}

function usesBank(type) { return TIPOS_CON_BANCO.includes(type) }
function usesLink(type) { return TIPOS_SOLO_ENLACE.includes(type) }

function validateFile(type, file) {
  if (!file) return 'Selecciona un archivo válido.'
  if (file.size > MAX_UPLOAD_BYTES) return 'El archivo supera el límite de 20 MB.'
  const mime = String(file.type || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  if (type === 'Imagen' && !mime.startsWith('image/')) return 'Selecciona un archivo de imagen.'
  if (type === 'PDF' && mime !== 'application/pdf' && !name.endsWith('.pdf')) return 'Selecciona un archivo PDF.'
  return ''
}

function formatBytes(bytes) {
  const number = Number(bytes || 0)
  if (!number) return '0 KB'
  if (number >= 1024 * 1024) return `${(number / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.ceil(number / 1024)} KB`
}

function sourceState(resource) {
  return {
    ...EMPTY,
    ...resource,
    grados: Array.isArray(resource?.grados) ? resource.grados : [],
    edades: Array.isArray(resource?.edades) ? resource.edades : [],
    competencias: Array.isArray(resource?.competencias) ? resource.competencias : [],
  }
}

function SectionHeading({ number, title, description, optional }) {
  return (
    <div className="form-section__heading">
      <span>{number}</span>
      <div><h3>{title}</h3><p>{description}</p></div>
      {optional && <em>Opcional</em>}
    </div>
  )
}

export default function ResourceForm({ resource, onSaved, onCancel }) {
  const editing = Boolean(resource?.id)
  const [form, setForm] = useState(() => editing ? sourceState(resource) : sourceState(readJSON(DRAFT_KEY, EMPTY)))
  const [file, setFile] = useState(null)
  const [localPreview, setLocalPreview] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)

  useEffect(() => {
    if (editing) setForm(sourceState(resource))
  }, [editing, resource])

  useEffect(() => {
    if (editing) return undefined
    const timer = window.setTimeout(() => {
      writeJSON(DRAFT_KEY, form)
      setDraftSaved(true)
      window.setTimeout(() => setDraftSaved(false), 1200)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [editing, form])

  useEffect(() => () => {
    if (localPreview.startsWith('blob:')) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const typeMeta = TYPE_META[form.tipo] || TYPE_META.Otro
  const livePreview = useMemo(() => {
    if (localPreview) return { tipo: 'imagen', src: localPreview }
    return obtenerPreviewRecurso(form)
  }, [form, localPreview])

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function clearSource() {
    setFile(null)
    setLocalPreview('')
    setExternalUrl('')
    setForm((current) => ({ ...current, url: '', archivoId: '', archivoNombre: '', archivoMime: '', archivoTamano: '', previewUrl: '', fuente: '' }))
  }

  function changeType(type) {
    setForm((current) => ({ ...current, tipo: type, url: '', archivoId: '', archivoNombre: '', archivoMime: '', archivoTamano: '', previewUrl: '', fuente: '' }))
    setFile(null)
    setLocalPreview('')
    setExternalUrl('')
    setError('')
  }

  function selectFile(nextFile) {
    const message = validateFile(form.tipo, nextFile)
    if (message) { setError(message); return }
    if (localPreview.startsWith('blob:')) URL.revokeObjectURL(localPreview)
    setFile(nextFile)
    setExternalUrl('')
    setLocalPreview(form.tipo === 'Imagen' ? URL.createObjectURL(nextFile) : '')
    setForm((current) => ({ ...current, url: '', archivoId: '', archivoNombre: '', archivoMime: '', archivoTamano: '', previewUrl: '', fuente: '' }))
    setError('')
  }

  function validate() {
    if (!form.titulo.trim()) return 'Escribe el título del recurso.'
    if (!form.tipo) return 'Selecciona el tipo de recurso.'
    if (!form.grados.length) return 'Selecciona al menos un grado escolar.'
    if (usesLink(form.tipo)) {
      if (!form.url.trim()) return 'Agrega el enlace del recurso.'
      if (!validUrl(form.url)) return 'El enlace debe incluir https://'
    }
    if (usesBank(form.tipo) && !file && !externalUrl.trim() && !form.url.trim()) return 'Sube un archivo o pega una URL directa.'
    if (externalUrl.trim() && !validUrl(externalUrl)) return 'La URL directa debe incluir https://'
    return ''
  }

  async function prepareSource() {
    if (!usesBank(form.tipo) || (!file && !externalUrl.trim())) return form
    setUploading(true)
    const uploaded = await subirArchivoRecurso({ file, externalUrl: externalUrl.trim(), tipoRecurso: form.tipo, titulo: form.titulo })
    setUploading(false)
    return {
      ...form,
      url: uploaded.url || '',
      archivoId: uploaded.archivoId || uploaded.fileId || '',
      archivoNombre: uploaded.archivoNombre || '',
      archivoMime: uploaded.archivoMime || '',
      archivoTamano: uploaded.archivoTamano || '',
      previewUrl: uploaded.previewUrl || '',
      fuente: uploaded.fuente || 'Google Drive',
    }
  }

  async function submit(event) {
    event.preventDefault()
    const message = validate()
    if (message) { setError(message); return }
    setSaving(true)
    setError('')
    try {
      const ready = await prepareSource()
      const saved = editing ? await actualizarRecurso(resource.id, ready) : await crearRecurso(ready)
      if (!editing) {
        writeJSON(DRAFT_KEY, EMPTY)
        setForm(EMPTY)
      }
      onSaved(saved, editing ? 'updated' : 'created')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el recurso.')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const buttonText = uploading ? 'Subiendo al banco…' : saving ? 'Guardando ficha…' : editing ? 'Guardar cambios' : usesBank(form.tipo) ? 'Subir y publicar recurso' : 'Publicar recurso'

  return (
    <main className="page-shell resource-form-page">
      <section className="premium-hero premium-hero--form">
        <div className="premium-hero__content">
          <p><span /> MOA Resource Launchpad</p>
          <h1>{editing ? 'Editar recurso educativo' : 'Publicar un nuevo recurso'}</h1>
          <p className="premium-hero__description">Construye una ficha clara, útil y fácil de encontrar para todo el equipo académico.</p>
        </div>
        <div className="premium-hero__visual"><Icon name={editing ? 'edit' : 'upload'} size={56} /></div>
      </section>

      <div className="resource-form-layout">
        <form className="resource-form" onSubmit={submit}>
          <div className="resource-form__topbar">
            <button type="button" onClick={onCancel}><Icon name="arrowLeft" size={17} /> Volver a la biblioteca</button>
            <span className={draftSaved ? 'is-visible' : ''}><Icon name="check" size={14} /> Borrador guardado</span>
          </div>

          <section className="form-section">
            <SectionHeading number="01" title="Identidad del recurso" description="Define un nombre reconocible y el formato principal." />
            <div className="form-grid form-grid--2">
              <label className="moa-field moa-field--wide"><span>Título del recurso <em>Requerido</em></span><input value={form.titulo} onChange={(event) => set('titulo', event.target.value)} placeholder="Ej. Present simple speaking cards" /></label>
              <label className="moa-field"><span>Tipo de recurso <em>Requerido</em></span><select value={form.tipo} onChange={(event) => changeType(event.target.value)}><option value="">Seleccionar…</option>{TIPOS_RECURSO.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="moa-field"><span>Nivel de inglés / CEFR</span><select value={form.cefr} onChange={(event) => set('cefr', event.target.value)}><option value="">Seleccionar…</option>{NIVELES_CEFR.map((level) => <option key={level}>{level}</option>)}</select></label>
            </div>
          </section>

          <section className="form-section">
            <SectionHeading number="02" title="Fuente y archivo" description="Conecta el material o súbelo al banco central de Drive." />
            <SourceField type={form.tipo} url={form.url} onUrl={(value) => set('url', value)} externalUrl={externalUrl} onExternalUrl={(value) => { setExternalUrl(value); if (value.trim()) { setFile(null); setLocalPreview('') } }} file={file} localPreview={localPreview} onFile={selectFile} onClear={clearSource} existing={form.archivoNombre} />
          </section>

          <section className="form-section">
            <SectionHeading number="03" title="Clasificación académica" description="Haz que el recurso sea fácil de encontrar para cualquier especialista." />
            <div className="form-grid form-grid--2">
              <MultiSelect label="Grados escolares · Requerido" options={GRADOS_ESCOLARES} selected={form.grados} onChange={(value) => set('grados', value)} color="purple" />
              <MultiSelect label="Edades recomendadas" options={EDADES} selected={form.edades} onChange={(value) => set('edades', value)} color="sand" />
              <label className="moa-field"><span>Tema o categoría</span><input list="moa-topic-options" value={form.tema} onChange={(event) => set('tema', event.target.value)} placeholder="Ej. Gramática, Fonética…" /><datalist id="moa-topic-options">{TEMAS_SUGERIDOS.map((topic) => <option key={topic} value={topic} />)}</datalist></label>
              <MultiSelect label="Competencias" options={COMPETENCIAS} selected={form.competencias} onChange={(value) => set('competencias', value)} color="mint" />
            </div>
          </section>

          <section className="form-section">
            <SectionHeading number="04" title="Contexto pedagógico" description="Explica qué aporta el material y cómo puede aprovecharse." optional />
            <label className="moa-field"><span>Descripción breve</span><textarea rows="5" value={form.descripcion} onChange={(event) => set('descripcion', event.target.value)} placeholder="Describe el objetivo, cómo usarlo y para qué tipo de actividad resulta ideal…" /></label>
          </section>

          {error && <div className="form-alert"><Icon name="info" size={18} /><span>{error}</span></div>}

          <div className="resource-form__actions">
            <button type="button" className="moa-secondary-button" onClick={onCancel}>Cancelar</button>
            {!editing && <button type="button" className="moa-secondary-button" onClick={() => { setForm(EMPTY); clearSource(); writeJSON(DRAFT_KEY, EMPTY) }}>Limpiar</button>}
            <button type="submit" className="moa-primary-button moa-primary-button--large" disabled={saving || uploading}><Icon name={editing ? 'check' : 'upload'} size={18} /> {buttonText}</button>
          </div>
        </form>

        <aside className="resource-live-preview">
          <div className="resource-live-preview__head"><p>Vista previa</p><h2>Así se verá en la biblioteca</h2></div>
          <div className="preview-card">
            <div className="preview-card__media">
              {livePreview.tipo === 'imagen' ? <img src={livePreview.src} alt="" /> : <div className={`preview-card__fallback preview-card__fallback--${typeMeta.className}`}><Icon name={typeMeta.icon} size={52} /></div>}
              <span className={`resource-type resource-type--${typeMeta.className}`}><Icon name={typeMeta.icon} size={14} /> {form.tipo || 'Tipo'}</span>
            </div>
            <div className="preview-card__body">
              <span>{form.cefr || 'Sin nivel'}</span>
              <h3>{form.titulo || 'Título del recurso'}</h3>
              <p>{form.descripcion || 'La descripción aparecerá aquí para ayudar al equipo a entender el material.'}</p>
              <div>{form.grados.slice(0, 2).map((grade) => <Tag key={grade} label={grade} color="purple" small />)}{form.tema && <Tag label={form.tema} color={colorParaTexto(form.tema)} small />}</div>
            </div>
          </div>
          <div className="form-guidance">
            <h3><Icon name="sparkles" size={18} /> Ficha de alta calidad</h3>
            <span><Icon name="check" size={14} /> Usa un título específico y corto.</span>
            <span><Icon name="check" size={14} /> Agrega al menos un grado.</span>
            <span><Icon name="check" size={14} /> Describe el uso pedagógico.</span>
            <span><Icon name="check" size={14} /> Selecciona skills y nivel CEFR.</span>
          </div>
        </aside>
      </div>
    </main>
  )
}

function SourceField({ type, url, onUrl, externalUrl, onExternalUrl, file, localPreview, onFile, onClear, existing }) {
  const copy = SOURCE_COPY[type]
  if (!type) return <div className="source-empty"><span><Icon name="info" size={22} /></span><div><strong>Selecciona primero el tipo de recurso</strong><p>Mostraremos automáticamente el campo correcto para video, imagen, PDF, juego o archivo.</p></div></div>

  if (usesLink(type)) {
    return <div className="source-link-panel"><label className="moa-field"><span>{copy.label} <em>Requerido</em></span><div className="input-with-icon"><Icon name="link" size={18} /><input type="url" value={url} onChange={(event) => onUrl(event.target.value)} placeholder={copy.placeholder} /></div><small>{copy.help}</small></label></div>
  }

  return (
    <div className="source-bank">
      <div className="source-bank__head"><div><p>{copy.label}</p><h3>Carga inteligente de archivos</h3></div><span>Máx. 20 MB</span></div>
      <DropZone type={type} file={file} localPreview={localPreview} onFile={onFile} onClear={onClear} existing={existing} />
      <div className="source-divider"><span>o importa desde una URL directa</span></div>
      <label className="moa-field"><span>URL directa del archivo</span><div className="input-with-icon"><Icon name="link" size={18} /><input type="url" value={externalUrl} onChange={(event) => onExternalUrl(event.target.value)} placeholder={copy.placeholder} /></div><small>{copy.help}</small></label>
    </div>
  )
}

function DropZone({ type, file, localPreview, onFile, onClear, existing }) {
  const inputId = `resource-file-${type}`

  function drop(event) {
    event.preventDefault()
    const nextFile = event.dataTransfer.files?.[0]
    if (nextFile) onFile(nextFile)
  }

  function paste(event) {
    const item = [...(event.clipboardData?.items || [])].find((entry) => entry.kind === 'file')
    if (item) { event.preventDefault(); onFile(item.getAsFile()) }
  }

  return (
    <div className={`resource-dropzone ${file || existing ? 'has-file' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={drop} onPaste={paste} tabIndex={0}>
      <input id={inputId} type="file" accept={ACCEPT_BY_TYPE[type] || '*/*'} onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])} />
      {file || existing ? (
        <div className="resource-dropzone__ready">
          {localPreview ? <img src={localPreview} alt="" /> : <span className="resource-dropzone__fileIcon"><Icon name={type === 'PDF' ? 'pdf' : 'file'} size={32} /></span>}
          <div><strong>{file?.name || existing}</strong><p>{file ? `${formatBytes(file.size)} · Listo para subir` : 'Archivo actual del recurso'}</p></div>
          <button type="button" onClick={onClear}>Quitar</button>
        </div>
      ) : (
        <div className="resource-dropzone__empty">
          <span><Icon name="upload" size={30} /></span>
          <div><strong>Arrastra, pega o selecciona el archivo</strong><p>También puedes pegar una imagen con Ctrl + V.</p></div>
          <label htmlFor={inputId}>Seleccionar archivo</label>
        </div>
      )}
    </div>
  )
}
