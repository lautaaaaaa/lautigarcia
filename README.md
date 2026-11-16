# Web Lautaro García

Web estática (HTML/CSS/JS, sin build). Deploy en Vercel: subir esta carpeta tal cual.

## Pendiente
- `config.js`: número de WhatsApp (todos los botones lo toman de ahí).
- `privacidad/index.html`: completar los `[PENDIENTE]`.

## Crear una propuesta para un cliente
1. Duplicar la carpeta `_plantilla-propuesta` y renombrarla, ej. `dra-valeria-ruiz`.
2. Abrir su `index.html` y completar el bloque `window.PROPUESTA` (clínica, médico, titular, Loom, tratamientos, bloques incluidos).
3. Poner el logo dentro de esa carpeta (ej. `logo.png`) y escribir `logo: "logo.png"`.
4. Subir a Vercel. Queda en `[DOMINIO]/dra-valeria-ruiz` (noindex, no linkeada desde la home).

## Archivos
- `index.html`, `styles.css`, `main.js`: la home.
- `demo/`: la demo interactiva (componente reutilizable).
- `propuesta.js`, `propuesta.css`: lógica y estilos de las propuestas.
- `config.js`: WhatsApp y datos generales.

Al cambiar CSS/JS, subir el número de `?v=20261111` en los `<link>`/`<script>` para que los navegadores no muestren la versión vieja.
