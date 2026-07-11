/**
 * MOA Materials Library API
 * Google Apps Script Web App
 *
 * Capacidades:
 * - GET: listar todos los recursos.
 * - POST crear: agregar una ficha.
 * - POST actualizar: editar una ficha por ID.
 * - POST eliminar / eliminarVarios: retirar fichas del Sheet.
 * - POST subirArchivo / subirDesdeUrl: guardar archivos en Google Drive.
 *
 * Los archivos de Drive NO se eliminan cuando se borra una ficha. Esto evita
 * pérdidas accidentales y permite recuperarlos desde el banco de archivos.
 */

const NOMBRE_HOJA = 'Recursos'
const DRIVE_FOLDER_ID = ''
const NOMBRE_CARPETA_BANCO = 'MOA Materials Library - Banco de Archivos'
const MAX_ARCHIVO_BYTES = 20 * 1024 * 1024

const HEADERS = [
  'id',
  'fecha',
  'actualizado',
  'titulo',
  'tipo',
  'url',
  'grados',
  'edades',
  'cefr',
  'tema',
  'competencias',
  'descripcion',
  'archivoId',
  'archivoNombre',
  'archivoMime',
  'archivoTamano',
  'previewUrl',
  'fuente',
]

function _hoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let hoja = ss.getSheetByName(NOMBRE_HOJA)
  if (!hoja) {
    hoja = ss.insertSheet(NOMBRE_HOJA)
    hoja.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    hoja.setFrozenRows(1)
    return hoja
  }
  _asegurarHeaders(hoja)
  return hoja
}

function _asegurarHeaders(hoja) {
  const lastColumn = Math.max(hoja.getLastColumn(), 1)
  const actuales = hoja.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || '').trim()
  })

  if (!actuales.some(Boolean)) {
    hoja.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    hoja.setFrozenRows(1)
    return
  }

  const faltantes = HEADERS.filter(function (header) {
    return actuales.indexOf(header) === -1
  })

  if (faltantes.length) {
    const startColumn = actuales.filter(Boolean).length + 1
    hoja.getRange(1, startColumn, 1, faltantes.length).setValues([faltantes])
  }
  hoja.setFrozenRows(1)
}

function _headersActuales(hoja) {
  return hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(function (value) {
    return String(value || '').trim()
  })
}

function _salidaJSON(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON)
}

function _parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('No se recibió información en la solicitud.')
  return JSON.parse(e.postData.contents)
}

function _limpiarTexto(value) {
  return String(value == null ? '' : value).trim()
}

function _buscarFilaPorId(hoja, id) {
  const cleanId = _limpiarTexto(id)
  if (!cleanId || hoja.getLastRow() < 2) return -1
  const headers = _headersActuales(hoja)
  const idIndex = headers.indexOf('id')
  if (idIndex === -1) return -1
  const values = hoja.getRange(2, idIndex + 1, hoja.getLastRow() - 1, 1).getValues()
  for (let index = 0; index < values.length; index += 1) {
    if (_limpiarTexto(values[index][0]) === cleanId) return index + 2
  }
  return -1
}

function _objetoDesdeFila(headers, row) {
  const result = {}
  headers.forEach(function (header, index) {
    if (header) result[header] = row[index]
  })
  return result
}

function _filaDesdeObjeto(headers, object) {
  return headers.map(function (header) {
    const value = object[header]
    return value === undefined || value === null ? '' : value
  })
}

function _obtenerCarpetaBanco() {
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim()) return DriveApp.getFolderById(DRIVE_FOLDER_ID.trim())
  const folders = DriveApp.getFoldersByName(NOMBRE_CARPETA_BANCO)
  if (folders.hasNext()) return folders.next()
  return DriveApp.createFolder(NOMBRE_CARPETA_BANCO)
}

function _obtenerOCrearSubcarpeta(parent, name) {
  const safeName = _limpiarNombreArchivo(name || 'Otros', 'Otros')
  const folders = parent.getFoldersByName(safeName)
  if (folders.hasNext()) return folders.next()
  return parent.createFolder(safeName)
}

function _limpiarNombreArchivo(name, fallback) {
  const value = String(name || fallback || 'archivo')
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return (value || fallback || 'archivo').slice(0, 140)
}

function _extensionPorMime(mimeType) {
  const mime = String(mimeType || '').toLowerCase()
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/zip': '.zip',
    'text/plain': '.txt',
  }
  return map[mime] || ''
}

function _nombreDesdeUrl(url, mimeType, fallback) {
  try {
    const clean = String(url || '').split('?')[0].split('#')[0]
    const parts = clean.split('/').filter(Boolean)
    const last = decodeURIComponent(parts[parts.length - 1] || '')
    if (last && last.indexOf('.') !== -1) return _limpiarNombreArchivo(last, fallback)
  } catch (error) {
    // Usamos fallback si la URL no permite extraer un nombre.
  }
  const extension = _extensionPorMime(mimeType)
  return _limpiarNombreArchivo((fallback || 'archivo') + extension, 'archivo' + extension)
}

function _validarTipoArchivo(resourceType, mimeType, name) {
  const type = String(resourceType || '')
  const mime = String(mimeType || '').toLowerCase()
  const lowerName = String(name || '').toLowerCase()
  if (type === 'Imagen' && mime.indexOf('image/') !== 0) throw new Error('El archivo seleccionado no parece ser una imagen.')
  if (type === 'PDF' && mime !== 'application/pdf' && !lowerName.endsWith('.pdf')) throw new Error('El archivo seleccionado no parece ser un PDF.')
}

function _guardarBlobEnBanco(blob, resourceType, originalName) {
  const bytes = blob.getBytes()
  if (bytes.length > MAX_ARCHIVO_BYTES) throw new Error('El archivo supera el límite de 20 MB para carga directa.')

  const bankFolder = _obtenerCarpetaBanco()
  const typeFolder = _obtenerOCrearSubcarpeta(bankFolder, resourceType || 'Otros')
  const timezone = Session.getScriptTimeZone() || 'UTC'
  const stamp = Utilities.formatDate(new Date(), timezone, 'yyyyMMdd-HHmmss')
  const safeName = _limpiarNombreArchivo(originalName || blob.getName(), 'archivo')
  const file = typeFolder.createFile(blob.setName(stamp + '-' + safeName))

  let warning = ''
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  } catch (error) {
    warning = 'El archivo se guardó, pero no se pudo activar el acceso por enlace automáticamente.'
  }

  const fileId = file.getId()
  return {
    fileId: fileId,
    archivoId: fileId,
    archivoNombre: file.getName(),
    archivoMime: file.getMimeType(),
    archivoTamano: file.getSize(),
    url: file.getUrl(),
    previewUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
    carpetaUrl: typeFolder.getUrl(),
    fuente: 'Google Drive',
    advertencia: warning,
  }
}

function _subirArchivoBase64(data) {
  if (!data || !data.base64) throw new Error('No se recibió el archivo para subir.')
  const resourceType = data.tipoRecurso || 'Otro'
  const mimeType = data.mimeType || 'application/octet-stream'
  const name = _limpiarNombreArchivo(data.nombre || 'archivo' + _extensionPorMime(mimeType), 'archivo')
  _validarTipoArchivo(resourceType, mimeType, name)
  const base64 = String(data.base64).replace(/^data:[^;]+;base64,/, '')
  const bytes = Utilities.base64Decode(base64)
  return _guardarBlobEnBanco(Utilities.newBlob(bytes, mimeType, name), resourceType, name)
}

function _subirArchivoDesdeUrl(data) {
  if (!data || !data.url) throw new Error('No se recibió la URL del archivo.')
  const resourceType = data.tipoRecurso || 'Otro'
  const response = UrlFetchApp.fetch(data.url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { 'User-Agent': 'Mozilla/5.0 MOA-Materials-Library' },
  })
  const status = response.getResponseCode()
  if (status < 200 || status >= 300) throw new Error('No se pudo copiar el archivo desde esa URL. Código: ' + status)
  const responseHeaders = response.getAllHeaders()
  const contentType = responseHeaders['Content-Type'] || responseHeaders['content-type'] || ''
  const mimeType = String(contentType).split(';')[0] || 'application/octet-stream'
  const name = _nombreDesdeUrl(data.url, mimeType, data.nombre || 'archivo')
  const blob = response.getBlob().setName(name)
  _validarTipoArchivo(resourceType, mimeType, name)
  return _guardarBlobEnBanco(blob, resourceType, name)
}

function _crearRecurso(data) {
  const sheet = _hoja()
  const headers = _headersActuales(sheet)
  const now = new Date().toISOString()
  const values = Object.assign({}, data || {}, {
    id: Utilities.getUuid(),
    fecha: now,
    actualizado: now,
  })
  const row = _filaDesdeObjeto(headers, values)
  sheet.appendRow(row)
  return _objetoDesdeFila(headers, row)
}

function _actualizarRecurso(id, data) {
  const sheet = _hoja()
  const rowNumber = _buscarFilaPorId(sheet, id)
  if (rowNumber === -1) throw new Error('No se encontró el recurso que intentas actualizar.')
  const headers = _headersActuales(sheet)
  const existingRow = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0]
  const existing = _objetoDesdeFila(headers, existingRow)
  const values = Object.assign({}, existing, data || {}, {
    id: existing.id,
    fecha: existing.fecha,
    actualizado: new Date().toISOString(),
  })
  const nextRow = _filaDesdeObjeto(headers, values)
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([nextRow])
  return _objetoDesdeFila(headers, nextRow)
}

function _eliminarRecurso(id) {
  const sheet = _hoja()
  const rowNumber = _buscarFilaPorId(sheet, id)
  if (rowNumber === -1) throw new Error('No se encontró el recurso que intentas eliminar.')
  sheet.deleteRow(rowNumber)
  return id
}

function _eliminarRecursos(ids) {
  const sheet = _hoja()
  const rows = (ids || []).map(function (id) {
    return _buscarFilaPorId(sheet, id)
  }).filter(function (row) {
    return row > 1
  }).sort(function (a, b) {
    return b - a
  })

  rows.forEach(function (row) {
    sheet.deleteRow(row)
  })
  return rows.length
}

function doGet() {
  try {
    const sheet = _hoja()
    const values = sheet.getDataRange().getValues()
    if (!values.length) return _salidaJSON({ ok: true, recursos: [] })
    const headers = values[0].map(function (value) { return String(value || '').trim() })
    const resources = values.slice(1)
      .filter(function (row) { return _limpiarTexto(row[headers.indexOf('id')]) })
      .map(function (row) { return _objetoDesdeFila(headers, row) })
      .reverse()
    return _salidaJSON({ ok: true, recursos: resources })
  } catch (error) {
    return _salidaJSON({ ok: false, error: String(error && error.message ? error.message : error), recursos: [] })
  }
}

function doPost(e) {
  try {
    const body = _parseBody(e)
    const action = body.accion

    if (action === 'subirArchivo') return _salidaJSON({ ok: true, archivo: _subirArchivoBase64(body.datos) })
    if (action === 'subirDesdeUrl') return _salidaJSON({ ok: true, archivo: _subirArchivoDesdeUrl(body.datos) })
    if (action === 'crear') return _salidaJSON({ ok: true, recurso: _crearRecurso(body.datos) })
    if (action === 'actualizar') return _salidaJSON({ ok: true, recurso: _actualizarRecurso(body.id, body.datos) })
    if (action === 'eliminar') return _salidaJSON({ ok: true, id: _eliminarRecurso(body.id) })
    if (action === 'eliminarVarios') return _salidaJSON({ ok: true, eliminados: _eliminarRecursos(body.ids) })

    return _salidaJSON({ ok: false, error: 'Acción no soportada.' })
  } catch (error) {
    return _salidaJSON({ ok: false, error: String(error && error.message ? error.message : error) })
  }
}

function autorizarMoaDrive() {
  const sheet = _hoja()
  const folder = _obtenerCarpetaBanco()
  Logger.log('Hoja conectada: ' + sheet.getName())
  Logger.log('Carpeta del banco: ' + folder.getUrl())
  return 'Autorización completada. Carpeta: ' + folder.getUrl()
}
