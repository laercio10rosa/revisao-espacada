import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Decks from './pages/Decks'
import Ciclos from './pages/Ciclos'
import DeckDetail from './pages/DeckDetail'
import Review from './pages/Review'
import SetupNeeded from './pages/SetupNeeded'
import { isFirebaseConfigured } from './firebase'
import './App.css'

function Header() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">R</span>
        <span>Revisão Espaçada</span>
      </div>
      <nav className="nav">
        <NavLink to="/" end>
          Ciclos
        </NavLink>
        <NavLink to="/baralhos">Flashcards</NavLink>
      </nav>
      <div className="user">
        <span className="user-email">{user.email}</span>
        <button className="btn ghost btn-sm" onClick={logout}>
          Sair
        </button>
      </div>
    </header>
  )
}

function App() {
  if (!isFirebaseConfigured) return <SetupNeeded />

  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Ciclos />
            </PrivateRoute>
          }
        />
        <Route
          path="/baralhos"
          element={
            <PrivateRoute>
              <Decks />
            </PrivateRoute>
          }
        />
        <Route
          path="/decks/:deckId"
          element={
            <PrivateRoute>
              <DeckDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/decks/:deckId/review"
          element={
            <PrivateRoute>
              <Review />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
