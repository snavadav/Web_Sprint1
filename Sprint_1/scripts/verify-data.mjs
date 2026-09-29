import { readFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { files, parseCSV, verify, num } from '../src/data.ts'

assert.equal(num(''), null)
assert.equal(num('0.0'), 0)
assert.deepEqual(parseCSV('\uFEFFa,b\r\n"a,b","un ""texto"""\r\n'), [{ a: 'a,b', b: 'un "texto"' }])
const blobs = await Promise.all(files.map(f => readFile(new URL(`../public/datos/${f}`, import.meta.url))))
const [hourly, daily, simulation, quality] = blobs.slice(0, 4).map(b => parseCSV(b.toString('utf8')))
const summary = JSON.parse(blobs[4].toString('utf8').replace(/^\uFEFF/, ''))
assert.deepEqual(verify(hourly, daily, simulation, quality, summary), [], 'Discrepancias en las fuentes')
// Independent daily check: counts, rounded means, maxima and temperatures.
for (const d of daily) {
  const hours = hourly.filter(r => r.timestamp.startsWith(d.fecha))
  assert.equal(hours.length, 24)
  for (const key of ['PM10', 'PM2.5', 'O3']) {
    const values = hours.map(r => num(r[key])).filter(v => v !== null)
    assert.equal(values.length, Number(d[`horas_${key}`]))
    if (key === 'O3') assert.equal(Math.max(...values), Number(d.O3_maximo_1h))
    else assert.equal(Math.round(values.reduce((a, b) => a + b, 0) / values.length), Number(d[`${key}_promedio_24h`]))
  }
  const temperatures = hours.map(r => Number(r.ET))
  assert.equal(Math.min(...temperatures), Number(d.temperatura_min_C))
  assert.equal(Math.max(...temperatures), Number(d.temperatura_max_C))
  assert.ok(Math.abs(temperatures.reduce((a, b) => a + b, 0) / 24 - Number(d.temperatura_media_C)) <= 0.005001)
}
const source = new URL('../../Paquete_dashboard_AGU_Marzo_2024/Paquete_dashboard_AGU_Marzo_2024/datos/', import.meta.url)
let originalAvailable = true
try { await access(source) } catch { originalAvailable = false }
if (originalAvailable) {
  for (let i = 0; i < files.length; i++) {
    const original = await readFile(new URL(files[i], source))
    assert.equal(createHash('sha256').update(blobs[i]).digest('hex'), createHash('sha256').update(original).digest('hex'), `${files[i]} fue modificado`)
  }
  console.log('SHA-256: los cinco archivos publicados son idénticos a los originales.')
} else console.log('Paquete original no presente: se verificó la consistencia interna de public/datos.')
console.log('OK: 744 horas, 31 días y 48 horas de seguimiento; conteos, máximos, calidad, correlaciones, promedios diarios y temperaturas coinciden.')
