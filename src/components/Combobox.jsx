import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { normalizar } from '../utils/texto'

/**
 * Campo de texto com lista suspensa (setinha) e busca.
 * options: [{ value, label?, group?, indent? }]
 * Aceita texto livre: o valor digitado vale mesmo sem escolher da lista.
 */
export default function Combobox({ value, onChange, options, placeholder, required, emptyText }) {
  const [aberto, setAberto] = useState(false)
  const [filtrar, setFiltrar] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const listaRef = useRef(null)
  const inputRef = useRef(null)
  const id = useId()

  const visiveis = useMemo(() => {
    const termo = normalizar(value)
    if (!filtrar || !termo) return options
    const partes = termo.split(/\s+/)
    return options.filter((o) => {
      const alvo = normalizar(`${o.label ?? o.value} ${o.group ?? ''}`)
      return partes.every((p) => alvo.includes(p))
    })
  }, [options, value, filtrar])

  useEffect(() => {
    if (!aberto || !listaRef.current) return
    const el = listaRef.current.querySelector(`[data-idx="${ativo}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [ativo, aberto])

  function escolher(o) {
    onChange(o.value)
    setAberto(false)
    setFiltrar(false)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!aberto) {
        setAberto(true)
        setAtivo(0)
      } else setAtivo((i) => Math.min(i + 1, visiveis.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && aberto && visiveis[ativo]) {
      e.preventDefault()
      escolher(visiveis[ativo])
    } else if (e.key === 'Escape' && aberto) {
      e.preventDefault()
      e.stopPropagation()
      setAberto(false)
    }
  }

  let grupoAnterior = null

  return (
    <div className="combo">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setFiltrar(true)
          setAberto(true)
          setAtivo(0)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setAberto(false)}
      />
      <button
        type="button"
        className="combo-toggle"
        tabIndex={-1}
        aria-label="Mostrar lista"
        onMouseDown={(e) => {
          e.preventDefault()
          setFiltrar(false)
          setAtivo(0)
          setAberto((v) => !v)
          inputRef.current?.focus()
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {aberto && (
        <ul className="combo-lista" id={`${id}-lista`} role="listbox" ref={listaRef}>
          {visiveis.length === 0 && <li className="combo-vazio">{emptyText ?? 'Nada encontrado — o texto digitado será usado.'}</li>}
          {visiveis.map((o, i) => {
            const cabecalho = o.group && o.group !== grupoAnterior ? o.group : null
            grupoAnterior = o.group
            return (
              <li key={`${o.group ?? ''}|${o.value}|${i}`} role="presentation">
                {cabecalho && <div className="combo-grupo">{cabecalho}</div>}
                <div
                  role="option"
                  data-idx={i}
                  aria-selected={i === ativo}
                  className={`combo-opcao ${i === ativo ? 'ativo' : ''} ${o.indent ? 'sub' : ''} ${
                    o.value === value ? 'atual' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    escolher(o)
                  }}
                  onMouseEnter={() => setAtivo(i)}
                >
                  {o.label ?? o.value}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
