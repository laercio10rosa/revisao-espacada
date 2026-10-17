// Banco de disciplinas pré-cadastradas (ementas da planilha "Plano de estudo CLDF").
// Formato compacto: { id, nome, grupo, topicos: [[numero, titulo, [[numero, titulo], ...]], ...] }
import DISCIPLINAS from './disciplinas.json'
import { normalizar } from '../utils/texto'

export { DISCIPLINAS }

const porNome = new Map(DISCIPLINAS.map((d) => [normalizar(d.nome), d]))

export function acharDisciplina(nome) {
  return porNome.get(normalizar(nome)) ?? null
}

/** Opções do campo Matéria: matérias próprias do usuário + catálogo agrupado por área. */
export function opcoesDisciplinas(materiasDoUsuario) {
  const proprias = materiasDoUsuario
    .filter((m) => !acharDisciplina(m))
    .map((m) => ({ value: m, group: 'Minhas matérias' }))
  const catalogo = DISCIPLINAS.map((d) => ({ value: d.nome, group: d.grupo }))
  return [...proprias, ...catalogo]
}

/** Opções do campo Tópico para uma disciplina do catálogo (tópicos e subtópicos). */
export function opcoesTopicos(disciplina) {
  if (!disciplina) return []
  const lista = []
  for (const [n, titulo, subs] of disciplina.topicos) {
    lista.push({ value: `${n}. ${titulo}` })
    for (const [sn, st] of subs) lista.push({ value: `${sn} ${st}`, indent: 1 })
  }
  return lista
}
