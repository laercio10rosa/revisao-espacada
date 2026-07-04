import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateCard, watchCards } from '../data/decks'
import { reviewCard } from '../srs/sm2'

export default function Review() {
  const { deckId } = useParams()
  const { user } = useAuth()
  const [cards, setCards] = useState(null)
  const [index, setIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    if (!user) return
    return watchCards(user.uid, deckId, setCards)
  }, [user, deckId])

  const due = useMemo(() => {
    if (!cards) return []
    const now = Date.now()
    return cards.filter((c) => !c.srs || c.srs.nextReview <= now)
  }, [cards])

  const current = due[index]

  async function handleAnswer(quality) {
    const nextSrs = reviewCard(current.srs, quality)
    await updateCard(user.uid, deckId, current.id, { srs: nextSrs })
    setShowBack(false)
    setIndex((i) => i + 1)
  }

  if (cards === null) return <div className="page">Carregando...</div>

  if (due.length === 0 || index >= due.length) {
    return (
      <div className="page">
        <h1>Revisão concluída</h1>
        <p>Não há mais cartões pendentes agora. Volte mais tarde.</p>
        <Link to={`/decks/${deckId}`}>&larr; voltar ao baralho</Link>
      </div>
    )
  }

  return (
    <div className="page review-page">
      <Link to={`/decks/${deckId}`}>&larr; sair da revisão</Link>
      <p className="progress">
        {index + 1} de {due.length}
      </p>
      <div className="flashcard" onClick={() => setShowBack((v) => !v)}>
        <p>{showBack ? current.back : current.front}</p>
        {!showBack && <small>toque para ver a resposta</small>}
      </div>

      {showBack && (
        <div className="quality-buttons">
          <button onClick={() => handleAnswer(0)}>Errei</button>
          <button onClick={() => handleAnswer(3)}>Difícil</button>
          <button onClick={() => handleAnswer(4)}>Bom</button>
          <button onClick={() => handleAnswer(5)}>Fácil</button>
        </div>
      )}
    </div>
  )
}
