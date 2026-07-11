import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import ResourceForm from './components/ResourceForm.jsx'
import ResourceDetails from './components/ResourceDetails.jsx'
import Insights from './components/Insights.jsx'
import Icon from './components/Icon.jsx'
import { crearRecurso, eliminarRecurso, eliminarRecursos, obtenerRecursos } from './lib/sheetsApi.js'
import { readJSON, writeJSON } from './lib/storage.js'

const FAVORITES_KEY = 'moa-materials-favorites-v2'
const RECENT_KEY = 'moa-materials-recent-v2'
const MAX_RECENT = 24

export default function App() {
  const [view, setView] = useState('library')
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState(() => new Set(readJSON(FAVORITES_KEY, [])))
  const [recentIds, setRecentIds] = useState(() => readJSON(RECENT_KEY, []))
  const [details, setDetails] = useState(null)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState(null)

  const loadResources = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const data = await obtenerRecursos()
      setResources(data)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el repositorio.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadResources() }, [loadResources])
  useEffect(() => writeJSON(FAVORITES_KEY, [...favorites]), [favorites])
  useEffect(() => writeJSON(RECENT_KEY, recentIds), [recentIds])
  useEffect(() => {
    if (!resources.length) return
    const existing = new Set(resources.map((resource) => resource.id))
    setFavorites((current) => new Set([...current].filter((id) => existing.has(id))))
    setRecentIds((current) => current.filter((id) => existing.has(id)))
  }, [resources])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
      if (!typing && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        openNew()
      }
      if (event.key === 'Escape' && details) setDetails(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [details])

  const favoriteCount = favorites.size

  function notify(message, type = 'success') {
    setToast({ message, type })
  }

  function navigate(nextView) {
    setDetails(null)
    setEditing(null)
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openNew() {
    setDetails(null)
    setEditing(null)
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function editResource(resource) {
    setDetails(null)
    setEditing(resource)
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleFavorite(id) {
    setFavorites((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function rememberRecent(id) {
    setRecentIds((current) => [id, ...current.filter((item) => item !== id)].slice(0, MAX_RECENT))
  }

  function openResource(resource) {
    rememberRecent(resource.id)
    if (!resource.url) {
      notify('Este recurso no tiene un enlace disponible.', 'error')
      return
    }
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  async function copyResource(resource) {
    try {
      await navigator.clipboard.writeText(resource.url || '')
      notify('Enlace copiado al portapapeles.')
    } catch {
      notify('No se pudo copiar el enlace.', 'error')
    }
  }

  async function duplicateResource(resource) {
    try {
      const duplicate = await crearRecurso({ ...resource, titulo: `${resource.titulo} · Copia` })
      setResources((current) => [duplicate, ...current])
      notify('La ficha fue duplicada correctamente.')
    } catch (err) {
      notify(err.message || 'No se pudo duplicar el recurso.', 'error')
    }
  }

  async function deleteOne(resource) {
    if (!window.confirm(`¿Eliminar “${resource.titulo}” del repositorio? El archivo original de Drive permanecerá seguro.`)) return
    try {
      await eliminarRecurso(resource.id)
      setResources((current) => current.filter((item) => item.id !== resource.id))
      setFavorites((current) => {
        const next = new Set(current)
        next.delete(resource.id)
        return next
      })
      setRecentIds((current) => current.filter((id) => id !== resource.id))
      setDetails(null)
      notify('Recurso eliminado del repositorio.')
    } catch (err) {
      notify(err.message || 'No se pudo eliminar el recurso.', 'error')
    }
  }

  async function deleteMany(ids) {
    try {
      await eliminarRecursos(ids)
      const set = new Set(ids)
      setResources((current) => current.filter((item) => !set.has(item.id)))
      setFavorites((current) => new Set([...current].filter((id) => !set.has(id))))
      setRecentIds((current) => current.filter((id) => !set.has(id)))
      notify(`${ids.length} recurso${ids.length === 1 ? '' : 's'} eliminado${ids.length === 1 ? '' : 's'}.`)
    } catch (err) {
      notify(err.message || 'No se pudieron eliminar los recursos.', 'error')
      throw err
    }
  }

  function handleSaved(resource, action) {
    if (action === 'updated') {
      setResources((current) => current.map((item) => item.id === resource.id ? resource : item))
      notify('Los cambios fueron guardados.')
    } else {
      setResources((current) => [resource, ...current])
      notify('Nuevo recurso publicado en la biblioteca.')
    }
    setEditing(null)
    setView('library')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentDetails = useMemo(() => {
    if (!details) return null
    return resources.find((item) => item.id === details.id) || details
  }, [details, resources])

  return (
    <div className="moa-app">
      <Header view={view} onNavigate={navigate} onNew={openNew} favoriteCount={favoriteCount} />

      {['library', 'favorites', 'recent'].includes(view) && (
        <Dashboard
          mode={view}
          resources={resources}
          loading={loading}
          refreshing={refreshing}
          error={error}
          favorites={favorites}
          recentIds={recentIds}
          onToggleFavorite={toggleFavorite}
          onOpen={openResource}
          onDetails={setDetails}
          onEdit={editResource}
          onDuplicate={duplicateResource}
          onCopy={copyResource}
          onDelete={deleteOne}
          onDeleteMany={deleteMany}
          onRefresh={() => loadResources(true)}
          onNew={openNew}
        />
      )}

      {view === 'insights' && <Insights resources={resources} favorites={favorites} />}

      {view === 'form' && (
        <ResourceForm
          resource={editing}
          onSaved={handleSaved}
          onCancel={() => navigate('library')}
        />
      )}

      {currentDetails && (
        <ResourceDetails
          resource={currentDetails}
          favorite={favorites.has(currentDetails.id)}
          onClose={() => setDetails(null)}
          onOpen={openResource}
          onEdit={editResource}
          onDelete={deleteOne}
          onToggleFavorite={toggleFavorite}
          onCopy={copyResource}
        />
      )}

      {toast && (
        <div className={`moa-toast moa-toast--${toast.type}`}>
          <span><Icon name={toast.type === 'error' ? 'info' : 'check'} size={17} /></span>
          <strong>{toast.message}</strong>
          <button type="button" onClick={() => setToast(null)}><Icon name="close" size={15} /></button>
        </div>
      )}
    </div>
  )
}
