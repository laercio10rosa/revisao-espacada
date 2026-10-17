// Revisão espaçada por ciclos fixos (mesma lógica da planilha):
// data da revisão = data base + intervalo do ciclo
// Ex.: ciclo 3 com data base 02/10 → 02/10 + 16 dias = 18/10.

export const INTERVALOS_PADRAO = [1, 7, 16, 35, 60, 90, 180, 360]

const DIA_MS = 24 * 60 * 60 * 1000

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDias(iso, dias) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + dias)
  return toISO(d)
}

export function hojeISO() {
  return toISO(new Date())
}

export function diasEntre(deISO, ateISO) {
  return Math.round((parseISO(ateISO) - parseISO(deISO)) / DIA_MS)
}

/** Data da revisão de um ciclo (1-based) — equivale ao DATE(...)+IFS(...) da planilha. */
export function dataDoCiclo(dataBase, ciclo, intervalos) {
  const dias = intervalos[ciclo - 1]
  if (dias == null) return null
  return addDias(dataBase, dias)
}

/** Regressão: a partir da data conhecida da revisão, descobre a data base. */
export function dataBaseDeRevisao(dataRevisao, ciclo, intervalos) {
  return addDias(dataRevisao, -(intervalos[ciclo - 1] ?? 0))
}

export function cronograma(dataBase, intervalos) {
  return intervalos.map((dias, i) => ({ ciclo: i + 1, dias, data: addDias(dataBase, dias) }))
}

/**
 * Situação de um estudo:
 *  concluido → passou por todos os ciclos
 *  atrasada  → data já passou
 *  hoje / amanha → igual à regra laranja da planilha (<= HOJE()+1)
 *  semana → nos próximos 7 dias
 *  futura
 */
export function situacao(item, intervalos, hoje = hojeISO()) {
  if (item.ciclo > intervalos.length) return { tipo: 'concluido', data: null, dias: null }
  const data = dataDoCiclo(item.dataBase, item.ciclo, intervalos)
  const dias = diasEntre(hoje, data)
  let tipo = 'futura'
  if (dias < 0) tipo = 'atrasada'
  else if (dias === 0) tipo = 'hoje'
  else if (dias === 1) tipo = 'amanha'
  else if (dias <= 7) tipo = 'semana'
  return { tipo, data, dias }
}

const fmtCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })

export function formatarData(iso) {
  if (!iso) return '—'
  return fmtCurta.format(parseISO(iso))
}

export function diaDaSemana(iso) {
  if (!iso) return ''
  return fmtSemana.format(parseISO(iso)).replace('.', '')
}

export function descreverPrazo(dias) {
  if (dias == null) return ''
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  if (dias < 0) return `atrasada ${-dias} dias`
  return `em ${dias} dias`
}
