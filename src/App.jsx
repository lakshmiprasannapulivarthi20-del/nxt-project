import {useState} from 'react'
import {Routes, Route} from 'react-router'
import Login from './components/Login'
import Home from './components/Home'
import Assessment from './components/Assessment'
import Results from './components/Results'
import ProtectedRoute from './components/ProtectedRoute'
import ScoreAndTimeContext from './context/ScoreAndTimeContext'
import NotFound from './components/NotFound'
import './App.css'

const App = () => {
  const [score, setScore] = useState(0)
  const [timeRemains, setTimeRemains] = useState(0)

  return (
    <ScoreAndTimeContext.Provider
      value={{
        score,
        setScore,
        timeRemains,
        setTimeRemains,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/results" element={<Results />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ScoreAndTimeContext.Provider>
  )
}

export default App