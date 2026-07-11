# MOA Materials Library — Premium Edition

Repositorio profesional de recursos educativos para MOA Education. El frontend está construido con React + Vite y utiliza Google Sheets + Google Apps Script como base de datos y banco de archivos en Google Drive.

## Funciones principales

- Biblioteca con búsqueda global, filtros avanzados y accesos rápidos por formato.
- Vistas Grid y List, ordenamiento persistente y exportación CSV.
- Favoritos y actividad reciente guardados por navegador.
- Panel de Insights con cobertura por tipo, CEFR, competencias y calidad de catalogación.
- Ficha detallada de cada recurso con preview, metadata y acciones.
- Crear, editar, duplicar, copiar enlace y eliminar recursos.
- Selección múltiple y eliminación en lote.
- Carga de imágenes, PDF y otros archivos a Google Drive.
- Importación por arrastrar/soltar, portapapeles o URL directa.
- Borrador automático del formulario.
- Diseño MOA Premium completamente responsive.

## Estructura del Google Sheet

La hoja debe llamarse exactamente `Recursos`. El Apps Script asegura automáticamente estos encabezados:

| Encabezado | Uso |
|---|---|
| id | UUID del recurso |
| fecha | Fecha de creación |
| actualizado | Fecha de última edición |
| titulo | Nombre del recurso |
| tipo | Video, Imagen, PDF, Link de Juego u Otro |
| url | Enlace principal |
| grados | Valores separados por `|` |
| edades | Valores separados por `|` |
| cefr | Nivel MOA/CEFR |
| tema | Tema o categoría |
| competencias | Skills separadas por `|` |
| descripcion | Contexto pedagógico |
| archivoId | ID del archivo en Drive |
| archivoNombre | Nombre del archivo |
| archivoMime | MIME type |
| archivoTamano | Tamaño en bytes |
| previewUrl | Imagen de preview |
| fuente | Google Drive o enlace externo |

No borres ni reordenes los encabezados existentes. El script puede agregar `actualizado` al final de una hoja antigua sin afectar la información.

## Actualizar Google Apps Script

1. Abre el Google Sheet.
2. Ve a **Extensiones → Apps Script**.
3. Reemplaza el contenido de `Code.gs` con `google-apps-script/Code.gs`.
4. Guarda el proyecto.
5. Ve a **Implementar → Administrar implementaciones → Editar**.
6. Selecciona **Nueva versión** y pulsa **Implementar**.
7. Copia la URL terminada en `/exec`.

El backend soporta:

- `crear`
- `actualizar`
- `eliminar`
- `eliminarVarios`
- `subirArchivo`
- `subirDesdeUrl`

Al eliminar una ficha, el archivo de Google Drive se conserva para evitar pérdidas accidentales.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

Configura `.env`:

```env
VITE_SHEET_API_URL=https://script.google.com/macros/s/TU_IMPLEMENTACION/exec
```

## Producción en Vercel

1. Importa el repositorio en Vercel.
2. Framework: **Vite**.
3. Agrega la variable:
   - `VITE_SHEET_API_URL` = URL `/exec` del Apps Script.
4. Deploy.

## Comandos

```bash
npm run dev
npm run build
npm run preview
```

## Estructura principal

```text
moa-materials-library/
├── google-apps-script/
│   ├── Code.gs
│   └── appsscript.json
├── public/
│   └── moa-logo.png
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```
