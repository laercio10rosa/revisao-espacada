import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createDeck, deleteDeck, watchDecks } from '../data/decks'

export default function Decks() {
  const { user } = useAuth()
  const [decks, setDecks] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    if (!user) return
    return watchDecks(user.uid, setDecks)
  }, [user])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    await createDeck(user.uid, name.trim())
    setName('')
  }

  return (
    <div className="page">
      <h1>Meus flashcards</h1>
      <form className="inline-form" onSubmit={handleCreate}>
        <input
          placeholder="Nome do novo grupo de flashcards"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Criar</button>
      </form>

      <ul className="deck-list">
        {decks.map((deck) => (
          <li key={deck.id} className="deck-item">
            <Link to={`/decks/${deck.id}`}>{deck.name}</Link>
            <button className="link danger" onClick={() => deleteDeck(user.uid, deck.id)}>
              excluir
            </button>
          </li>
        ))}
        {decks.length === 0 && <p>Nenhum flashcard ainda. Crie o primeiro acima.</p>}
      </ul>
    </div>
  )
}
