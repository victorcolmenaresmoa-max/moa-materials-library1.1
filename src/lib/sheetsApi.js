const API_URL = import.meta.env.VITE_SHEET_API_URL
const JOIN = '|'

if (!API_URL) {
  console.warn('[sheetsApi] Falta VITE_SHEET_API_URL. Configúrala en Vercel o en tu archivo .env.')
}

function limpiarTexto(valor) {
  return String(valor ?? '').trim()
}

function serializarLista(lista) {
  return Array.isArray(lista) ? lista.join(JOIN) : limpiarTexto(lista)
}

function deserializarLista(valor) {
  return valor ? String(valor).split(JOIN).map((item) => item.trim()).filter(Boolean) : []
}

export function serializarRecurso(formData) {
  return {
    titulo: limpiarTexto(formData.titulo),
    tipo: formData.tipo || 'Otro',
    url: limpiarTexto(formData.url),
    grados: serializarLista(formData.grados),
    edades: serializarLista(formData.edades),
    cefr: formData.cefr || 'N/A',
    tema: limpiarTexto(formData.tema),
    competencias: serializarLista(formData.competencias),
    descripcion: limpiarTexto(formData.descripcion),
    archivoId: limpiarTexto(formData.archivoId),
    archivoNombre: limpiarTexto(formData.archivoNombre),
    archivoMime: limpiarTexto(formData.archivoMime),
    archivoTamano: formData.archivoTamano ? String(formData.archivoTamano) : '',
    previewUrl: limpiarTexto(formData.previewUrl),
    fuente: limpiarTexto(formData.fuente),
  }
}

function deserializarFila(fila = {}) {
  return {
    id: String(fila.id || ''),
    fecha: fila.fecha || '',
    actualizado: fila.actualizado || fila.fecha || '',
    titulo: fila.titulo || '',
    tipo: fila.tipo || 'Otro',
    url: fila.url || '',
    grados: deserializarLista(fila.grados),
    edades: deserializarLista(fila.edades),
    cefr: fila.cefr || 'N/A',
    tema: fila.tema || '',
    competencias: deserializarLista(fila.competencias),
    descripcion: fila.descripcion || '',
    archivoId: fila.archivoId || fila.fileId || '',
    archivoNombre: fila.archivoNombre || '',
    archivoMime: fila.archivoMime || '',
    archivoTamano: fila.archivoTamano || '',
    previewUrl: fila.previewUrl || '',
    fuente: fila.fuente || '',
  }
}

async function postJSON(body, mensajeError) {
  if (!API_URL) throw new Error('Falta configurar VITE_SHEET_API_URL.')
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(mensajeError)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || mensajeError)
  return data
}

function leerArchivoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const resultado = String(reader.result || '')
      resolve(resultado.includes(',') ? resultado.split(',')[1] : resultado)
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'))
    reader.readAsDataURL(file)
  })
}

export async function obtenerRecursos() {
  if (!API_URL) throw new Error('Falta configurar VITE_SHEET_API_URL.')
  const separator = API_URL.includes('?') ? '&' : '?'
  const res = await fetch(`${API_URL}${separator}t=${Date.now()}`, { method: 'GET', cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo cargar el repositorio de recursos.')
  const data = await res.json()
  return (data.recursos || []).map(deserializarFila)
}

export async function subirArchivoRecurso({ file, externalUrl, tipoRecurso, titulo }) {
  if (file) {
    const base64 = await leerArchivoComoBase64(file)
    const data = await postJSON({
      accion: 'subirArchivo',
      datos: {
        tipoRecurso,
        nombre: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64,
      },
    }, 'No se pudo subir el archivo al banco de Drive.')
    return data.archivo
  }

  if (externalUrl) {
    const data = await postJSON({
      accion: 'subirDesdeUrl',
      datos: { tipoRecurso, url: externalUrl, nombre: titulo || 'recurso' },
    }, 'No se pudo copiar el archivo desde la URL indicada.')
    return data.archivo
  }

  throw new Error('Selecciona un archivo o pega una URL directa para subirlo al banco.')
}

export async function crearRecurso(formData) {
  const data = await postJSON(
    { accion: 'crear', datos: serializarRecurso(formData) },
    'No se pudo guardar el recurso.',
  )
  return deserializarFila(data.recurso)
}

export async function actualizarRecurso(id, formData) {
  const data = await postJSON(
    { accion: 'actualizar', id, datos: serializarRecurso(formData) },
    'No se pudo actualizar el recurso.',
  )
  return deserializarFila(data.recurso)
}

export async function eliminarRecurso(id) {
  const data = await postJSON(
    { accion: 'eliminar', id },
    'No se pudo eliminar el recurso.',
  )
  return data
}

export async function eliminarRecursos(ids) {
  const data = await postJSON(
    { accion: 'eliminarVarios', ids },
    'No se pudieron eliminar los recursos seleccionados.',
  )
  return data
}
