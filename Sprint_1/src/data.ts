export type Row = Record<string, string>
export type Summary = {
  station: string; period: string; records: number;
  hourly_category_counts: Record<string, number>; daily_category_counts: Record<string, number>;
  daily_dominant_patterns: Record<string, number>; daily_co_responsible_counts: Record<string, number>;
  maxima: Record<string, number>; valid_nowcast_hours: Record<string, number>; pearson_correlations: Record<string, number>
}
export const files = ['datos_horarios_procesados_AGU_marzo_2024.csv', 'resumen_diario_AGU_marzo_2024.csv', 'simulacion_27_28_marzo_AGU.csv', 'calidad_datos_AGU_marzo_2024.csv', 'resumen_resultados.json']
export const categories = ['Buena', 'Aceptable', 'Mala', 'Muy mala', 'Extremadamente mala']
export const colors: Record<string, string> = { Buena: '#269963', Aceptable: '#efd04c', Mala: '#ed8b35', 'Muy mala': '#d94249', 'Extremadamente mala': '#8454ae' }
export function parseCSV(text: string): Row[] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false
  const input = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (c === '"') { if (quoted && input[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted }
    else if (c === ',' && !quoted) { row.push(cell); cell = '' }
    else if (c === '\n' && !quoted) { row.push(cell.replace(/\r$/, '')); if (row.some(Boolean)) rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (quoted) throw new Error('CSV con comillas sin cerrar')
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row) }
  const headers = rows.shift() ?? []
  return rows.map((r) => { if (r.length !== headers.length) throw new Error('Número de columnas CSV inválido'); return Object.fromEntries(headers.map((h, i) => [h, r[i]])) })
}
export const num = (v: string | undefined): number | null => v === undefined || v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v)
export const fmt = (v: number | null | undefined, digits = 2) => v == null ? 'Sin dato' : v.toLocaleString('es-MX', { maximumFractionDigits: digits })
export function verify(hourly: Row[], daily: Row[], simulation: Row[], quality: Row[], s: Summary): string[] {
  const errors: string[] = []
  const check = (ok: boolean, label: string) => { if (!ok) errors.push(label) }
  check(hourly.length === s.records && hourly.length === 744, 'Registros horarios')
  check(daily.length === 31 && simulation.length === 48, 'Registros diarios o seguimiento')
  check(new Set(hourly.map(r => r.timestamp)).size === 744, 'Timestamps duplicados')
  hourly.forEach((r, i) => check(r.timestamp === `2024-03-${String(Math.floor(i / 24) + 1).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00:00`, `Secuencia horaria ${i}`))
  for (const [counts, rows, key] of [[s.hourly_category_counts, hourly, 'categoria_global_horaria'], [s.daily_category_counts, daily, 'categoria_global_diaria'], [s.daily_dominant_patterns, daily, 'contaminante_dominante']] as const) {
    Object.entries(counts).forEach(([c, n]) => check(rows.filter(r => r[key] === c).length === n, `${key}: ${c}`))
  }
  Object.entries(s.maxima).forEach(([key, v]) => check(Math.max(...hourly.map(r => num(r[key.replace('_raw', '')])).filter((n): n is number => n !== null)) === v, `Máximo ${key}`))
  Object.entries(s.valid_nowcast_hours).forEach(([key, n]) => check(hourly.filter(r => num(r[`${key}_NowCast`]) !== null).length === n, `NowCast ${key}`))
  Object.entries(s.daily_co_responsible_counts).forEach(([key, n]) => check(daily.filter(r => r.contaminante_dominante.split('/').includes(key)).length === n, `Corresponsabilidad ${key}`))
  simulation.forEach(r => { const h = hourly.find(h => h.timestamp === r.timestamp); check(!!h && Object.entries(r).every(([k, v]) => h[k] === v), `Seguimiento ${r.timestamp}`) })
  quality.forEach(q => { const vals = hourly.map(r => num(r[q.variable])).filter((n): n is number => n !== null); check(vals.length === Number(q.disponibles) && hourly.length - vals.length === Number(q.faltantes) && Math.round(vals.length / hourly.length * 1000) / 10 === Number(q.completitud_pct), `Completitud ${q.variable}`); check(vals.length ? Math.min(...vals) === num(q.minimo) && Math.max(...vals) === num(q.maximo) : num(q.minimo) === null && num(q.maximo) === null, `Rango ${q.variable}`) })
  for (const [key, a, b] of [['O3_ET', 'O3', 'ET'], ['PM10_PM2.5', 'PM10', 'PM2.5']]) {
    const pairs = hourly.filter(r => num(r[a]) !== null && num(r[b]) !== null).map(r => [Number(r[a]), Number(r[b])]); const n = pairs.length
    const ma = pairs.reduce((t, p) => t + p[0], 0) / n, mb = pairs.reduce((t, p) => t + p[1], 0) / n
    const cov = pairs.reduce((t, p) => t + (p[0] - ma) * (p[1] - mb), 0)
    const den = Math.sqrt(pairs.reduce((t, p) => t + (p[0] - ma) ** 2, 0) * pairs.reduce((t, p) => t + (p[1] - mb) ** 2, 0))
    check(Math.round(cov / den * 1000) / 1000 === s.pearson_correlations[key], `Correlación ${key}`)
  }
  return errors
}
