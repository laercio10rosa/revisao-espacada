import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { createCardState } from '../srs/sm2'

function decksRef(uid) {
  return collection(db, 'users', uid, 'decks')
}

function cardsRef(uid, deckId) {
  return collection(db, 'users', uid, 'decks', deckId, 'cards')
}

export function watchDecks(uid, callback) {
  const q = query(decksRef(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function createDeck(uid, name) {
  return addDoc(decksRef(uid), { name, createdAt: serverTimestamp() })
}

export function deleteDeck(uid, deckId) {
  return deleteDoc(doc(db, 'users', uid, 'decks', deckId))
}

export function watchCards(uid, deckId, callback) {
  const q = query(cardsRef(uid, deckId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function createCard(uid, deckId, front, back) {
  return addDoc(cardsRef(uid, deckId), {
    front,
    back,
    createdAt: serverTimestamp(),
    srs: createCardState(),
  })
}

export function updateCard(uid, deckId, cardId, data) {
  return updateDoc(doc(db, 'users', uid, 'decks', deckId, 'cards', cardId), data)
}

export function deleteCard(uid, deckId, cardId) {
  return deleteDoc(doc(db, 'users', uid, 'decks', deckId, 'cards', cardId))
}
