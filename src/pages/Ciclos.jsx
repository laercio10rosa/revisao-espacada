import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Combobox from '../components/Combobox'
import { acharDisciplina, opcoesDisciplinas, opcoesTopicos } from '../data/catalogo'
import {
  createCiclo,
  deleteCiclo,
  saveIntervalos,
  updateCiclo,
  watchCiclos,
  watchIntervalos,
} from '../data/ciclos'
import {
  INTERVALOS_PADRAO,
  cronograma,
  dataDoCiclo,
  descreverPrazo,
  diaDaSemana,
  diasEntre,
  formatarData,
  hojeISO,
  situacao,
} from '../srs/ciclos'

const ROTULO = {
  atrasada: 'Atrasada',
  hoje: 'Hoje',
  amanha: 'Amanhã',
  semana: 'Esta semana',
  futura: 'Agendada',
  concluido: 'Concluído',
}

const FILTROS = [
  { id: 'pendentes', label: 'Para revisar', match: (t) => ['atrasada', 'hoje', 'amanha'].includes(t) },
  { id: 'proximas', label: 'Próximos 7 dias', match: (t) => ['atrasada', 'hoje', 'amanha', 'semana'].includes(t) },
  { id: 'ativas', label: 'Em andamento', match: (t) => t !== 'concluido' },
  { id: 'concluidas', label: 'Concluídos', match: (t) => t === 'concluido' },
  { id: 'todas', label: 'Todos', match: () => true },
]

export default function Ciclos() {
  const { user } = useAuth()
  const [itens, setItens] = useState(null)
  const [intervalos, setIntervalos] = useState(INTERVALOS_PADRAO)
  const [filtro, setFiltro] = useState('ativas')
  const [materiaFiltro, setMateriaFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState(null)
  const [aberto, setAberto] = useState(null)
  const [mostrarIntervalos, setMostrarIntervalos] = useState(false)

  useEffect(() => {
    if (!user) return
    const a = watchCiclos(user.uid, setItens)
    const b = watchIntervalos(user.uid, setIntervalos)
    return () => {
      a()
      b()
    }
  }, [user])

  const hoje = hojeISO()

  const enriquecidos = useMemo(
    () => (itens ?? []).map((item) => ({ ...item, sit: situacao(item, intervalos, hoje) })),
    [itens, intervalos, hoje]
  )

  const materias = useMemo(
    () => [...new Set(enriquecidos.map((i) => i.materia))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [enriquecidos]
  )

  const contagem = useMemo(() => {
    const c = { atrasada: 0, hoje: 0, amanha: 0, semana: 0, futura: 0, concluido: 0 }
    enriquecidos.forEach((i) => c[i.sit.tipo]++)
    return c
  }, [enriquecidos])

  const visiveis = useMemo(() => {
    const f = FILTROS.find((x) => x.id === filtro)
    const termo = busca.trim().toLowerCase()
    return enriquecidos
      .filter((i) => f.match(i.sit.tipo))
      .filter((i) => !materiaFiltro || i.materia === materiaFiltro)
      .filter(
        (i) =>
          !termo ||
          i.materia.toLowerCase().includes(termo) ||
          (i.topico ?? '').toLowerCase().includes(termo)
      )
      .sort((a, b) => {
        if (!a.sit.data) return 1
        if (!b.sit.data) return -1
        return a.sit.data.localeCompare(b.sit.data) || a.materia.localeCompare(b.materia, 'pt-BR')
      })
  }, [enriquecidos, filtro, materiaFiltro, busca])

  async function concluir(item) {
    const registro = { ciclo: item.ciclo, data: dataDoCiclo(item.dataBase, item.ciclo, intervalos), feitaEm: hoje }
    await updateCiclo(user.uid, item.id, {
      ciclo: item.ciclo + 1,
      concluidas: [...(item.concluidas ?? []), registro],
    })
  }

  async function desfazer(item) {
    if (item.ciclo <= 1) return
    await updateCiclo(user.uid, item.id, {
      ciclo: item.ciclo - 1,
      concluidas: (item.concluidas ?? []).filter((c) => c.ciclo !== item.ciclo - 1),
    })
  }

  async function excluir(item) {
    const nome = [item.materia, item.topico].filter(Boolean).join(' — ')
    if (window.confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) {
      await deleteCiclo(user.uid, item.id)
    }
  }

  return (
    <div className="page page-wide">
      <div className="page-head">
        <div>
          <h1>Revisões por ciclo</h1>
          <p className="muted">
            Cadastre o que estudou, informe a data base e o sistema calcula quando voltar a cada matéria.
          </p>
        </div>
        <button className="btn ghost" onClick={() => setMostrarIntervalos((v) => !v)}>
          {mostrarIntervalos ? 'Fechar intervalos' : 'Intervalos dos ciclos'}
        </button>
      </div>

      {mostrarIntervalos && (
        <PainelIntervalos
          intervalos={intervalos}
          onSalvar={(lista) => saveIntervalos(user.uid, lista).then(() => setMostrarIntervalos(false))}
        />
      )}

      <div className="stats">
        <Stat tipo="atrasada" valor={contagem.atrasada} label="Atrasadas" onClick={() => setFiltro('pendentes')} />
        <Stat tipo="hoje" valor={contagem.hoje} label="Para hoje" onClick={() => setFiltro('pendentes')} />
        <Stat tipo="amanha" valor={contagem.amanha} label="Amanhã" onClick={() => setFiltro('pendentes')} />
        <Stat tipo="semana" valor={contagem.semana} label="Próximos 7 dias" onClick={() => setFiltro('proximas')} />
        <Stat tipo="concluido" valor={contagem.concluido} label="Concluídos" onClick={() => setFiltro('concluidas')} />
      </div>

      <FormEstudo
        key="novo"
        intervalos={intervalos}
        materias={materias}
        onSalvar={(dados) => createCiclo(user.uid, dados)}
      />

      <section className="card">
        <div className="toolbar">
          <div className="segmented" role="tablist">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filtro === f.id}
                className={filtro === f.id ? 'active' : ''}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select value={materiaFiltro} onChange={(e) => setMateriaFiltro(e.target.value)}>
              <option value="">Todas as matérias</option>
              {materias.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Buscar matéria ou tópico"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {itens === null ? (
          <p className="empty">Carregando…</p>
        ) : visiveis.length === 0 ? (
          <p className="empty">
            {itens.length === 0
              ? 'Nenhum estudo cadastrado ainda. Adicione o primeiro no formulário acima.'
              : 'Nada para mostrar com esse filtro.'}
          </p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Matéria</th>
                <th>Tópico</th>
                <th>Ciclo</th>
                <th>Data base</th>
                <th>Próxima revisão</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {visiveis.map((item) => (
                <Linha
                  key={item.id}
                  item={item}
                  intervalos={intervalos}
                  aberto={aberto === item.id}
                  onToggle={() => setAberto((a) => (a === item.id ? null : item.id))}
                  onConcluir={() => concluir(item)}
                  onDesfazer={() => desfazer(item)}
                  onEditar={() => setEditando(item)}
                  onExcluir={() => excluir(item)}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editando && (
        <div className="modal-backdrop" onClick={() => setEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <FormEstudo
              key={editando.id}
              titulo="Editar estudo"
              inicial={editando}
              intervalos={intervalos}
              materias={materias}
              onCancelar={() => setEditando(null)}
              onSalvar={async (dados) => {
                await updateCiclo(user.uid, editando.id, dados)
                setEditando(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ tipo, valor, label, onClick }) {
  return (
    <button className={`stat stat-${tipo}`} onClick={onClick}>
      <span className="stat-valor">{valor}</span>
      <span className="stat-label">{label}</span>
    </button>
  )
}

function Linha({ item, intervalos, aberto, onToggle, onConcluir, onDesfazer, onEditar, onExcluir }) {
  const { sit } = item
  const total = intervalos.length
  const concluido = sit.tipo === 'concluido'

  return (
    <>
      <tr className={`linha linha-${sit.tipo}`}>
        <td data-label="Matéria">
          <button className="materia" onClick={onToggle} aria-expanded={aberto}>
            <span className={`caret ${aberto ? 'open' : ''}`}>›</span>
            {item.materia}
          </button>
        </td>
        <td data-label="Tópico" title={item.topico}>{item.topico || <span className="muted">—</span>}</td>
        <td data-label="Ciclo">
          <div className="ciclo">
            <span className="ciclo-num">{concluido ? `${total}/${total}` : `${item.ciclo}/${total}`}</span>
            <span className="dots" aria-hidden>
              {intervalos.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i + 1 < item.ciclo ? 'done' : i + 1 === item.ciclo ? 'current' : ''}`}
                />
              ))}
            </span>
          </div>
        </td>
        <td data-label="Data base">{formatarData(item.dataBase)}</td>
        <td data-label="Próxima revisão">
          {concluido ? (
            <span className="badge badge-concluido">Ciclo completo</span>
          ) : (
            <div className="prox">
              <span className="prox-data">
                <span className="dow">{diaDaSemana(sit.data)}</span> {formatarData(sit.data)}
              </span>
              <span className={`badge badge-${sit.tipo}`}>
                {sit.tipo === 'futura' || sit.tipo === 'semana' ? descreverPrazo(sit.dias) : ROTULO[sit.tipo]}
                {sit.tipo === 'atrasada' && ` · ${-sit.dias}d`}
              </span>
            </div>
          )}
        </td>
        <td className="acoes">
          {!concluido && (
            <button className="btn btn-sm primary" onClick={onConcluir} title="Marcar revisão como feita">
              ✓ Revisei
            </button>
          )}
          <button className="icon-btn" onClick={onDesfazer} disabled={item.ciclo <= 1} title="Desfazer última revisão">
            ↶
          </button>
          <button className="icon-btn" onClick={onEditar} title="Editar">
            ✎
          </button>
          <button className="icon-btn danger" onClick={onExcluir} title="Excluir">
            ✕
          </button>
        </td>
      </tr>
      {aberto && (
        <tr className="linha-detalhe">
          <td colSpan={6}>
            <Cronograma item={item} intervalos={intervalos} />
          </td>
        </tr>
      )}
    </>
  )
}

function Cronograma({ item, intervalos }) {
  const hoje = hojeISO()
  const feitas = new Map((item.concluidas ?? []).map((c) => [c.ciclo, c]))
  return (
    <div className="cronograma">
      <p className="muted small">Cronograma completo a partir da data base {formatarData(item.dataBase)}</p>
      <ol className="timeline">
        {cronograma(item.dataBase, intervalos).map((c) => {
          const feita = c.ciclo < item.ciclo
          const atual = c.ciclo === item.ciclo
          const atrasada = atual && diasEntre(hoje, c.data) < 0
          return (
            <li key={c.ciclo} className={feita ? 'feita' : atual ? (atrasada ? 'atual atrasada' : 'atual') : ''}>
              <span className="tl-ciclo">{c.ciclo}ª</span>
              <span className="tl-data">{formatarData(c.data)}</span>
              <span className="tl-dias">+{c.dias}d</span>
              {feita && feitas.get(c.ciclo)?.feitaEm && (
                <span className="tl-feita">feita {formatarData(feitas.get(c.ciclo).feitaEm)}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function FormEstudo({ titulo = 'Novo estudo', inicial, intervalos, materias, onSalvar, onCancelar }) {
  const [materia, setMateria] = useState(inicial?.materia ?? '')
  const [topico, setTopico] = useState(inicial?.topico ?? '')
  const [ciclo, setCiclo] = useState(inicial?.ciclo ?? 1)
  const [data, setData] = useState(inicial?.dataBase ?? hojeISO())
  const [salvando, setSalvando] = useState(false)

  const disciplina = acharDisciplina(materia)
  const opcoesMateria = useMemo(() => opcoesDisciplinas(materias), [materias])
  const opcoesTopico = useMemo(() => opcoesTopicos(disciplina), [disciplina])

  function trocarMateria(nova) {
    const novaDisc = acharDisciplina(nova)
    // se o tópico veio da ementa da matéria anterior, limpa
    if (disciplina && novaDisc !== disciplina && opcoesTopico.some((o) => o.value === topico)) {
      setTopico('')
    }
    setMateria(nova)
  }

  const cicloValido = Math.min(Math.max(1, Number(ciclo)), intervalos.length + 1)
  const dataBase = data

  async function handleSubmit(e) {
    e.preventDefault()
    if (!materia.trim() || !data) return
    setSalvando(true)
    try {
      await onSalvar({ materia: materia.trim(), topico: topico.trim(), dataBase, ciclo: cicloValido })
      if (!inicial) {
        setTopico('')
        setCiclo(1)
        setData(hojeISO())
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className={inicial ? 'form-estudo' : 'card form-estudo'} onSubmit={handleSubmit}>
      <h2>{titulo}</h2>
      <div className="grid-form">
        <label>
          <span>Matéria</span>
          <Combobox
            placeholder="Escolha a matéria"
            value={materia}
            onChange={trocarMateria}
            options={opcoesMateria}
            required
          />
        </label>
        <label>
          <span>Tópico / capítulos</span>
          <Combobox
            placeholder={disciplina ? 'Escolha o tópico ou digite (ex.: 21-25)' : 'Ex.: 21-25'}
            value={topico}
            onChange={setTopico}
            options={opcoesTopico}
            emptyText={disciplina ? 'Nada encontrado — o texto digitado será usado.' : 'Sem ementa cadastrada para esta matéria — digite livremente.'}
          />
        </label>
        <label>
          <span>Ciclo atual</span>
          <select value={cicloValido} onChange={(e) => setCiclo(Number(e.target.value))}>
            {intervalos.map((dias, i) => (
              <option key={i} value={i + 1}>
                {i + 1}ª revisão (+{dias} {dias === 1 ? 'dia' : 'dias'})
              </option>
            ))}
            {inicial && <option value={intervalos.length + 1}>Ciclo completo</option>}
          </select>
        </label>
        <label>
          <span>Data base (dia do estudo)</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        <div className="form-actions grid-acoes">
          {onCancelar && (
            <button type="button" className="btn ghost" onClick={onCancelar}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn primary" disabled={salvando}>
            {inicial ? 'Salvar' : '+ Adicionar'}
          </button>
        </div>
      </div>
    </form>
  )
}

function PainelIntervalos({ intervalos, onSalvar }) {
  const [lista, setLista] = useState(intervalos)
  const valida = lista.every((n) => Number.isInteger(n) && n > 0)

  return (
    <section className="card intervalos">
      <h2>Intervalos dos ciclos</h2>
      <p className="muted small">
        Dias contados a partir da data base. Vale para todos os estudos — alterar aqui recalcula as datas.
      </p>
      <div className="intervalos-grid">
        {lista.map((dias, i) => (
          <label key={i}>
            <span>{i + 1}ª</span>
            <input
              type="number"
              min="1"
              value={dias}
              onChange={(e) => setLista((l) => l.map((v, j) => (j === i ? Number(e.target.value) : v)))}
            />
          </label>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn ghost" onClick={() => setLista((l) => l.slice(0, -1))} disabled={lista.length <= 1}>
          − ciclo
        </button>
        <button className="btn ghost" onClick={() => setLista((l) => [...l, (l.at(-1) ?? 30) * 2])}>
          + ciclo
        </button>
        <button className="btn ghost" onClick={() => setLista(INTERVALOS_PADRAO)}>
          Restaurar padrão
        </button>
        <button className="btn primary" disabled={!valida} onClick={() => onSalvar(lista)}>
          Salvar intervalos
        </button>
      </div>
    </section>
  )
}
