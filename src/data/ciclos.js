import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { INTERVALOS_PADRAO } from '../srs/ciclos'

function ciclosRef(uid) {
  return collection(db, 'users', uid, 'ciclos')
}

function configRef(uid) {
  return doc(db, 'users', uid, 'config', 'revisao')
}

export function watchCiclos(uid, callback) {
  return onSnapshot(ciclosRef(uid), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function createCiclo(uid, data) {
  return addDoc(ciclosRef(uid), { ...data, concluidas: [], createdAt: serverTimestamp() })
}

export function updateCiclo(uid, id, data) {
  return updateDoc(doc(db, 'users', uid, 'ciclos', id), data)
}

export function deleteCiclo(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'ciclos', id))
}

export function watchIntervalos(uid, callback) {
  return onSnapshot(configRef(uid), (snap) => {
    const lista = snap.exists() ? snap.data().intervalos : null
    callback(Array.isArray(lista) && lista.length ? lista : INTERVALOS_PADRAO)
  })
}

export function saveIntervalos(uid, intervalos) {
  return setDoc(configRef(uid), { intervalos }, { merge: true })
}
