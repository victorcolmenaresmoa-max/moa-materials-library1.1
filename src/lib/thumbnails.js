export function detectarPreview(url = '') {
  const value = String(url || '').trim()
  if (!value) return { tipo: 'ninguno', src: '' }

  const youtube = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i)
  if (youtube) return { tipo: 'imagen', src: `https://img.youtube.com/vi/${youtube[1]}/hqdefault.jpg` }

  const drive = value.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/i)
  if (drive) return { tipo: 'imagen', src: `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1200` }

  if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value)) return { tipo: 'imagen', src: value }
  return { tipo: 'ninguno', src: '' }
}

export function obtenerPreviewRecurso(recurso = {}) {
  if (recurso.previewUrl) return { tipo: 'imagen', src: recurso.previewUrl }
  if (recurso.archivoId && ['Imagen', 'PDF'].includes(recurso.tipo)) {
    return { tipo: 'imagen', src: `https://drive.google.com/thumbnail?id=${recurso.archivoId}&sz=w1200` }
  }
  return detectarPreview(recurso.url)
}
