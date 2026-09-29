# AIRE · Estación Águilas — marzo de 2024

Dashboard estático en React, Vite y TypeScript. Consume los cinco CSV/JSON de `public/datos` mediante `fetch`; no requiere servidor de aplicación, base de datos, claves ni servicios externos. No modifica las fuentes.

## Instalar y ejecutar

Requisito: Node.js 24 LTS y npm (la verificación usa soporte nativo de TypeScript de Node).

```powershell
cd "C:\Users\Sergi\OneDrive\Documentos\Sprint 1\Sprint_1"
npm ci
npm run dev
```

Abre la URL que muestra Vite. En este equipo las dependencias ya están instaladas. Para iniciar siempre en el mismo puerto:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

## Verificar y compilar

```powershell
npm run verify:data
npm run build
npm run preview
```

`build` verifica los datos y los tipos antes de crear `dist`. La verificación comprueba:

- 744 registros horarios consecutivos, 31 días y 48 horas del seguimiento.
- Categorías horarias y diarias, dominantes y corresponsabilidades contra el JSON.
- Todos los máximos, disponibilidad de NowCast y correlaciones de Pearson.
- Completitud, faltantes y rangos de las siete variables.
- Todas las celdas del seguimiento contra la serie horaria.
- Conteos diarios, promedios de partículas redondeados, máximos de ozono y temperatura diaria.
- Identidad SHA-256 de los cinco archivos con el paquete original, cuando está presente en la carpeta hermana. En una copia independiente se indica que solo se comprobó consistencia interna.

La aplicación también comprueba consistencia al cargar y muestra discrepancias. Las copias incluidas son idénticas a los originales. El script falla si detecta diferencias; no las corrige ni altera los archivos.

## Publicar como sitio estático

1. Ejecuta `npm ci` y `npm run build`.
2. Copia **todo el contenido de `dist`**, incluidas las carpetas `assets` y `datos`, a la carpeta pública de tu alojamiento estático.
3. Sirve `index.html` como documento de inicio a través de HTTP/HTTPS.
4. Comprueba que se cargan las gráficas y que los cinco enlaces de descarga en «Fuentes, metodología y verificación» funcionan.

El valor `base: './'` permite alojarlo en la raíz o en una subcarpeta. No se necesitan redirecciones para rutas: la navegación usa secciones. En una plataforma que compile el repositorio, configura Node 24, directorio de proyecto `Sprint_1`, comando `npm run build` y directorio publicado `dist` (o la raíz si subes únicamente este proyecto). No publiques `node_modules` ni el paquete de investigación completo. No abras `dist/index.html` con `file://`: el navegador necesita HTTP para cargar los CSV.

## Uso durante la exposición

- Panorama: portada, indicadores y balance horario.
- Series: elige PM10, PM2.5, O₃ o temperatura y el intervalo de fechas. Consulta cada hora con el cursor, deslizador o teclado; abre la tabla para ver los valores.
- Partículas: la línea continua es directa y la discontinua es NowCast ajustado. Los faltantes producen huecos, nunca ceros.
- Calendario: selecciona un día y pulsa «Ver las 24 horas» para filtrar la serie.
- Seguimiento: reproduce o selecciona las 48 horas del 27 y 28. La animación recorre registros históricos, no genera datos.
- Modo presentación: solicita pantalla completa, oculta el menú lateral y muestra una sección a la vez con texto ampliado. Navega con los botones o flechas izquierda/derecha cuando el foco no esté en un control. Esc o «Salir» termina el modo. Si el navegador bloquea la pantalla completa, continúa en modo presentación dentro de la ventana. Las secciones extensas conservan desplazamiento vertical.

## Fuentes y alcance

Los archivos `datos_horarios_procesados_AGU_marzo_2024.csv`, `resumen_diario_AGU_marzo_2024.csv`, `simulacion_27_28_marzo_AGU.csv`, `calidad_datos_AGU_marzo_2024.csv` y `resumen_resultados.json` proceden del paquete proporcionado. La metodología se tomó de `codigo/README_reproduccion.md` y `codigo/analisis_agu_marzo_2024.py` del mismo paquete.

El dashboard lee categorías ya calculadas. Las horarias usan NowCast para partículas; las diarias usan promedio de 24 horas (al menos 18 válidas) y máximo horario de O₃. No confundir categoría diaria con peor hora. NowCast usa ventana ponderada de 12 horas y factores 0.714/0.694: no se interpreta como reducción de emisiones. No se recalcula NowCast en el navegador.

Se conserva la hora escrita en el CSV sin suponer zona horaria. No se imputan faltantes. Los porcentajes del panorama se calculan sobre 744 horas y se muestran con un decimal. Ozono conserva hasta tres decimales; temperatura hasta dos. La representación redondeada no cambia los archivos.

Resultados de control: 534 horas Buena, 169 Aceptable, 41 Mala; 9 días Buena, 20 Aceptable y 2 Mala (27 y 28). O₃ máximo: 0.101 ppm. PM2.5: 709 observaciones directas y 735 NowCast válidos. Correlación O₃/temperatura: 0.783. RH, WS y WD: 100% faltantes.

La discusión de sociedad civil y las recomendaciones son interpretación explícita, no resultados observados. Una estación y un mes no permiten generalizar a toda la ciudad ni demostrar causalidad o atribuir fuentes de contaminación.
