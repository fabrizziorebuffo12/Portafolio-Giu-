# Giulia — Portfolio (v0)

Primera versión del layout basada en el mockup: wordmark "Giulia" de fondo,
tag "xx2026", grid de tarjetas de proyecto (por ahora con fotos de interiores
como placeholder) y link "About me".

## Stack
- React 18 + Vite
- Bootstrap 5
- Font Awesome 6
- CSS puro para el layout/grid

## Cómo correrlo en GitHub Codespaces
1. Sube esta carpeta a un repo de GitHub (o abre este mismo repo).
2. En GitHub, botón verde **Code → Codespaces → Create codespace on main**.
3. Cuando abra el terminal del Codespace:
   ```bash
   npm install
   npm run dev -- --host
   ```
4. Codespaces detecta el puerto 5173 y te ofrece abrirlo en el navegador
   (o pestaña **Ports** → abrir en el navegador).

## Cómo correrlo local
```bash
npm install
npm run dev
```

## Estado actual
- Las 6 tarjetas flotan de forma ambiental (cada una con su propio recorrido
  y tiempo, para que no se muevan todas igual) mientras el cursor no está
  encima.
- Al pasar el cursor sobre una tarjeta: se detiene su flotación, se agranda
  y (si tiene `video` asignado en `src/App.jsx`) reproduce el clip; si no,
  se queda en la imagen.
- Tipografía: Helvetica Neue con fallback a Arial (no es libre fuera de
  macOS, así que esta es la opción más parecida sin costo de licencia).

## Próximos pasos
- Cargar los videos reales de cada proyecto en el array `projects` de
  `src/App.jsx` (campo `video`) en cuanto Giulia los mande.
- Sustituir las imágenes placeholder (picsum.photos) por las fotos reales.
- Efecto de scroll/zoom general de la página (acercamiento progresivo al
  hacer scroll) — pendiente de definir con más detalle.

## Update: 6 cartas flotando + video en hover
- Cada una de las 6 tarjetas flota de forma independiente y continua por su
  zona (posición, distancia de flotado y velocidad distintas por tarjeta,
  en `src/App.jsx`, array `projects`).
- Al pasar el cursor sobre una tarjeta: deja de flotar, crece (`scale`) y
  reproduce su video (por ahora un video de muestra — `poster`/`video` en
  cada proyecto son placeholders, hay que reemplazarlos por los reales).
- Al sacar el cursor: el video se pausa, se reinicia, y la tarjeta vuelve a
  flotar.
- Tipografía: usando **Arimo** (Google Fonts, gratuita), metric-compatible
  con Arial y visualmente muy cercana a Helvetica. Si Giulia tiene licencia
  real de Helvetica Neue, se puede self-hostear y reemplazar en `App.css`.

## Pendiente
- Reemplazar `poster` (imagen) y `video` (clip) de cada proyecto en
  `src/App.jsx` por el material real de Giulia.
- Efecto de scroll/zoom general de la página, todavía por definir.
- Ajustar rangos de flotado (`dx`/`dy`/`dur`/`delay`) una vez se vea con
  contenido real.
