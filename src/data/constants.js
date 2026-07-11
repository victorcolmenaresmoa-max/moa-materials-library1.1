export const TIPOS_RECURSO = ['Video', 'Imagen', 'PDF', 'Link de Juego', 'Otro']
export const TIPOS_CON_BANCO = ['Imagen', 'PDF', 'Otro']
export const TIPOS_SOLO_ENLACE = ['Video', 'Link de Juego']

export const GRADOS_ESCOLARES = [
  'Preescolar', '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado',
  '6to Grado', '1er Año', '2do Año', '3er Año', '4to Año', '5to Año',
]

export const EDADES = ['3-5 años', '6-8 años', '9-11 años', '12-14 años', '15+ años']

export const NIVELES_CEFR = ['N1', 'N2', 'P1', 'P2', 'P3', 'A1', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B1.3', 'B2.1']

export const TEMAS_SUGERIDOS = [
  'Gramática', 'Vocabulario', 'Fonética', 'Cultura', 'Festividades', 'Matemáticas',
  'Ciencias', 'Arte', 'Valores', 'Comprensión Lectora', 'Evaluación', 'Speaking',
  'Listening', 'Writing', 'Reading', 'Teacher Resources',
]

export const COMPETENCIAS = ['Listening', 'Speaking', 'Reading', 'Writing']

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'title-asc', label: 'Título A–Z' },
  { value: 'title-desc', label: 'Título Z–A' },
  { value: 'type', label: 'Tipo de recurso' },
  { value: 'cefr', label: 'Nivel CEFR' },
]

export const TYPE_META = {
  Video: { icon: 'video', className: 'video' },
  Imagen: { icon: 'image', className: 'image' },
  PDF: { icon: 'pdf', className: 'pdf' },
  'Link de Juego': { icon: 'game', className: 'game' },
  Otro: { icon: 'file', className: 'file' },
}

const PALETA_ROTATIVA = ['teal', 'purple', 'coral', 'yellow', 'mint', 'sand', 'blue', 'gray']

export function colorParaTexto(texto = '') {
  let hash = 0
  for (let i = 0; i < texto.length; i += 1) hash = texto.charCodeAt(i) + ((hash << 5) - hash)
  return PALETA_ROTATIVA[Math.abs(hash) % PALETA_ROTATIVA.length]
}
