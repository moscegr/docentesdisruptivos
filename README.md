# Docentes Disruptivos · Prototipo robusto

Esta versión amplía el prototipo inicial para la autorización institucional y una prueba piloto más convincente con docentes de bachillerato DGETI Guerrero.

## Qué incluye
- 9 páginas HTML navegables
- diseño visual cercano a producción
- 6 formularios funcionales con `localStorage`
- dashboard del docente con foto de perfil personalizable
- buscador global del dashboard (módulos, evidencias, planeaciones, diagnósticos)
- panel de notificaciones descartables
- sección de evidencias
- sección de comunidad y webinars
- página de analítica de pilotaje
- recursos descargables filtrables
- exportar todos los datos como JSON
- responsivo en móvil, tablet y escritorio
- accesibilidad mejorada (navegación por teclado en pestañas, foco visible, ARIA en menú móvil)

## Cómo probarlo
1. Descomprime el ZIP.
2. Abre `index.html` en tu navegador.
3. Recorre las páginas desde el menú superior.
4. Completa formularios en Metodología, Módulos, Comunidad, Evidencias y Pilotaje.
5. Revisa `dashboard.html` y `pilotaje.html` para ver cómo cambian los indicadores.
6. En el dashboard puedes cambiar la foto de perfil, exportar tus datos como JSON o reiniciar la demo.

## Datos guardados
Todo se almacena en el navegador usando `localStorage`, por lo que el prototipo funciona sin backend.

## Archivos principales
- `index.html` inicio
- `metodologia.html` fundamentos y diagnóstico
- `modulos.html` ruta y secuencia didáctica
- `recursos.html` biblioteca filtrable
- `comunidad.html` webinars y foros
- `dgeti.html` vinculación institucional
- `evidencias.html` portafolio del pilotaje
- `pilotaje.html` analítica básica
- `dashboard.html` panel interno del docente

## Cambios respecto a la versión anterior
- Se eliminaron las referencias a "tesis" del texto visible y de los meta-tags.
- Se restructuró el sistema responsivo con cinco breakpoints (1180, 1024, 820, 640 y 420 px).
- Se corrigieron conteos incorrectos (8 → 9 páginas, 4 → 6 formularios).
- Se sumó la foto de perfil del docente al dashboard, con opción de subir una imagen propia.
- El campo de búsqueda del dashboard ahora funciona y filtra módulos, evidencias, planeaciones, diagnósticos y páginas.
- El estado de notificaciones se muestra en un panel descartable dentro del dashboard.
- Se agregó botón de exportar datos a JSON.
- Se agregó botón flotante "volver arriba".
- Las pestañas de Módulos ahora se navegan con flechas del teclado.
- Las tablas hacen scroll horizontal en pantallas pequeñas.
- Se escapó el HTML en todos los puntos donde se renderiza contenido del usuario.
