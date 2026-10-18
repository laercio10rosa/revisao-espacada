import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createCard, deleteCard, watchCards } from '../data/decks'

export default function DeckDetail() {
  const { deckId } = useParams()
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  useEffect(() => {
    if (!user) return
    return watchCards(user.uid, deckId, setCards)
  }, [user, deckId])

  async function handleCreate(e) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    await createCard(user.uid, deckId, front.trim(), back.trim())
    setFront('')
    setBack('')
  }

  return (
    <div className="page">
      <Link to="/baralhos">&larr; voltar aos flashcards</Link>
      <h1>Cartões</h1>

      <form className="card-form" onSubmit={handleCreate}>
        <input
          placeholder="Frente (pergunta)"
          value={front}
          onChange={(e) => setFront(e.target.value)}
        />
        <input
          placeholder="Verso (resposta)"
          value={back}
          onChange={(e) => setBack(e.target.value)}
        />
        <button type="submit">Adicionar cartão</button>
      </form>

      <ul className="card-list">
        {cards.map((card) => (
          <li key={card.id} className="card-item">
            <div>
              <strong>{card.front}</strong>
              <span> — {card.back}</span>
            </div>
            <button
              className="link danger"
              onClick={() => deleteCard(user.uid, deckId, card.id)}
            >
              excluir
            </button>
          </li>
        ))}
        {cards.length === 0 && <p>Nenhum cartão ainda. Adicione o primeiro acima.</p>}
      </ul>

      {cards.length > 0 && (
        <Link className="review-btn" to={`/decks/${deckId}/review`}>
          Iniciar revisão
        </Link>
      )}
    </div>
  )
}
