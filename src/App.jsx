import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import questionsData from './data/questions.json'

const CATEGORIES = ['C', 'POO', 'C++', 'Java', 'Web', 'Culture Générale']
const EXAM_DURATION_S = 60 * 60 // 60 minutes, comme l'examen réel

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function App() {
  const [screen, setScreen] = useState('start') // start | exam | result
  const [numQuestions, setNumQuestions] = useState(60)
  const [selectedCats, setSelectedCats] = useState([...CATEGORIES])
  const [examQuestions, setExamQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // idx -> {attempts, status, chosen: []}
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_S)
  const timerRef = useRef(null)

  const startExam = () => {
    const pool = questionsData.filter((q) => selectedCats.includes(q.category))
    const n = Math.min(numQuestions, pool.length)
    const picked = shuffle(pool).slice(0, n)
    setExamQuestions(picked)
    setAnswers({})
    setCurrent(0)
    setTimeLeft(EXAM_DURATION_S)
    setScreen('exam')
  }

  const finishExam = useCallback(() => {
    clearInterval(timerRef.current)
    setScreen('result')
  }, [])

  useEffect(() => {
    if (screen !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          finishExam()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [screen, finishExam])

  const q = examQuestions[current]
  const qState = answers[current] || { attempts: 0, status: 'unanswered', chosen: [] }

  const handleChoice = (choiceIdx) => {
    if (qState.status === 'correct' || qState.status === 'revealed') return
    if (qState.chosen.includes(choiceIdx)) return

    const isCorrect = choiceIdx === q.correct
    const attempts = qState.attempts + 1
    const chosen = [...qState.chosen, choiceIdx]

    let status
    if (isCorrect) {
      status = 'correct'
    } else if (attempts >= 2) {
      status = 'revealed'
    } else {
      status = 'wrong-first'
    }

    setAnswers((prev) => ({
      ...prev,
      [current]: { attempts, status, chosen, lastChoice: choiceIdx },
    }))
  }

  const goTo = (idx) => {
    if (idx < 0 || idx >= examQuestions.length) return
    setCurrent(idx)
  }

  const score = useMemo(() => {
    let correct = 0
    let wrong = 0
    let unanswered = 0
    const byCat = {}
    examQuestions.forEach((qq, i) => {
      const a = answers[i]
      byCat[qq.category] = byCat[qq.category] || { correct: 0, total: 0 }
      byCat[qq.category].total += 1
      if (a && a.status === 'correct') {
        correct += 1
        byCat[qq.category].correct += 1
      } else if (a && a.status === 'revealed') {
        wrong += 1
      } else {
        unanswered += 1
      }
    })
    return { correct, wrong, unanswered, byCat, total: examQuestions.length }
  }, [answers, examQuestions])

  const toggleCat = (cat) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const maxAvailable = useMemo(
    () => questionsData.filter((q) => selectedCats.includes(q.category)).length,
    [selectedCats]
  )

  if (screen === 'start') {
    return (
      <div className="app">
        <Header />
        <main className="start-screen">
          <div className="start-card">
            <p className="eyebrow-note">Faculté des Sciences Dhar El Mahraz — Fès</p>
            <h1>Simulation du Concours Écrit</h1>
            <p className="subtitle">
              Master Qualité du Logiciel (MQL) · Préparez-vous dans les conditions
              du concours : C, POO, C++, Java, Web et connaissances techniques générales.
            </p>

            <div className="config-block">
              <label className="config-label">Nombre de questions</label>
              <div className="pill-row">
                {[20, 60, 100, maxAvailable].map((n, i) => (
                  <button
                    key={i}
                    className={`pill ${numQuestions === n ? 'pill-active' : ''}`}
                    onClick={() => setNumQuestions(n)}
                  >
                    {n === maxAvailable ? `Toutes (${maxAvailable})` : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-block">
              <label className="config-label">Matières incluses</label>
              <div className="pill-row">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`pill ${selectedCats.includes(cat) ? 'pill-active' : ''}`}
                    onClick={() => toggleCat(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="rules-box">
              <h3>Règles de la simulation</h3>
              <ul>
                <li>Vous disposez de <strong>2 tentatives</strong> par question.</li>
                <li>1<sup>re</sup> tentative correcte : réponse validée + justification.</li>
                <li>1<sup>re</sup> tentative incorrecte : indication de l'erreur, réessayez.</li>
                <li>2<sup>e</sup> tentative incorrecte : la bonne réponse est révélée avec une explication détaillée.</li>
                <li>Durée : 60 minutes, comme l'examen réel du 24/09/2026.</li>
              </ul>
            </div>

            <button
              className="btn-primary btn-start"
              disabled={selectedCats.length === 0}
              onClick={startExam}
            >
              Commencer l'examen blanc
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (screen === 'result') {
    return (
      <div className="app">
        <Header />
        <main className="result-screen">
          <div className="result-card">
            <h1>Résultats de l'examen blanc</h1>
            <div className="score-hero">
              <span className="score-number">{score.correct}</span>
              <span className="score-total">/ {score.total}</span>
            </div>
            <p className="score-percent">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}% de bonnes réponses
            </p>

            <div className="score-breakdown">
              <div className="breakdown-item breakdown-correct">
                <span className="breakdown-num">{score.correct}</span>
                <span>Correctes</span>
              </div>
              <div className="breakdown-item breakdown-wrong">
                <span className="breakdown-num">{score.wrong}</span>
                <span>Incorrectes</span>
              </div>
              <div className="breakdown-item breakdown-unanswered">
                <span className="breakdown-num">{score.unanswered}</span>
                <span>Non répondues</span>
              </div>
            </div>

            <h3 className="cat-title">Détail par matière</h3>
            <div className="cat-breakdown">
              {Object.entries(score.byCat).map(([cat, s]) => (
                <div key={cat} className="cat-row">
                  <span className="cat-name">{cat}</span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{ width: `${s.total ? (s.correct / s.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="cat-score">{s.correct}/{s.total}</span>
                </div>
              ))}
            </div>

            <div className="result-actions">
              <button className="btn-secondary" onClick={() => { setScreen('exam'); setCurrent(0); }}>
                Revoir mes réponses
              </button>
              <button className="btn-primary" onClick={() => setScreen('start')}>
                Nouvel examen
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // screen === 'exam'
  return (
    <div className="app">
      <Header compact />
      <main className="exam-screen">
        <div className="exam-topbar">
          <div className="exam-progress-text">
            Question {current + 1} / {examQuestions.length}
          </div>
          <div className={`timer ${timeLeft < 300 ? 'timer-urgent' : ''}`}>⏱ {formatTime(timeLeft)}</div>
          <button className="btn-finish" onClick={finishExam}>Terminer l'examen</button>
        </div>

        <div className="exam-body">
          <nav className="nav-grid">
            {examQuestions.map((_, i) => {
              const a = answers[i]
              let cls = 'nav-dot'
              if (a?.status === 'correct') cls += ' nav-correct'
              else if (a?.status === 'revealed') cls += ' nav-wrong'
              else if (a?.status === 'wrong-first') cls += ' nav-pending'
              if (i === current) cls += ' nav-current'
              return (
                <button key={i} className={cls} onClick={() => goTo(i)}>
                  {i + 1}
                </button>
              )
            })}
          </nav>

          <div className="question-panel">
            <div className="category-tag">{q.category}</div>
            <h2 className="question-text">{q.question}</h2>

            <div className="choices">
              {q.choices.map((choice, idx) => {
                const chosen = qState.chosen.includes(idx)
                const isCorrectChoice = idx === q.correct
                let cls = 'choice-btn'
                if (qState.status === 'correct' || qState.status === 'revealed') {
                  if (isCorrectChoice) cls += ' choice-correct'
                  else if (chosen) cls += ' choice-wrong'
                  else cls += ' choice-disabled'
                } else if (chosen) {
                  cls += ' choice-wrong'
                }
                const disabled =
                  qState.status === 'correct' ||
                  qState.status === 'revealed' ||
                  chosen

                return (
                  <button
                    key={idx}
                    className={cls}
                    disabled={disabled}
                    onClick={() => handleChoice(idx)}
                  >
                    <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="choice-text">{choice}</span>
                    {(qState.status === 'correct' || qState.status === 'revealed') && isCorrectChoice && (
                      <span className="choice-icon">✓</span>
                    )}
                    {chosen && !isCorrectChoice && <span className="choice-icon">✕</span>}
                  </button>
                )
              })}
            </div>

            {qState.status === 'wrong-first' && (
              <div className="feedback feedback-wrong">
                <div className="feedback-head">✕ Ce n'est pas la bonne réponse</div>
                <p>{q.explanations[qState.lastChoice]}</p>
                <p className="feedback-hint">Il vous reste une tentative — réessayez.</p>
              </div>
            )}

            {qState.status === 'correct' && (
              <div className="feedback feedback-correct">
                <div className="feedback-head">
                  ✓ Bonne réponse{qState.attempts > 1 ? ' (2e tentative)' : ''}
                </div>
                <p>{q.explanations[q.correct]}</p>
              </div>
            )}

            {qState.status === 'revealed' && (
              <div className="feedback feedback-revealed">
                <div className="feedback-head">
                  La bonne réponse était : {String.fromCharCode(65 + q.correct)}. {q.choices[q.correct]}
                </div>
                <p className="feedback-wrong-note">
                  Votre dernière réponse n'était pas correcte : {q.explanations[qState.lastChoice]}
                </p>
                <p className="feedback-detailed">
                  <strong>Explication détaillée : </strong>
                  {q.explanations[q.correct]} Pour bien distinguer les options,
                  gardez en tête pourquoi chaque autre choix est erroné, comme indiqué
                  ci-dessus pour les propositions déjà tentées — c'est cette logique de
                  comparaison entre les choix qui est testée au concours.
                </p>
              </div>
            )}

            <div className="nav-buttons">
              <button className="btn-secondary" disabled={current === 0} onClick={() => goTo(current - 1)}>
                ← Précédent
              </button>
              {current < examQuestions.length - 1 ? (
                <button className="btn-primary" onClick={() => goTo(current + 1)}>
                  Suivant →
                </button>
              ) : (
                <button className="btn-primary" onClick={finishExam}>
                  Voir les résultats
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Header({ compact }) {
  return (
    <header className={`site-header ${compact ? 'site-header-compact' : ''}`}>
      <div className="header-inner">
        <div className="crest">MQL</div>
        <div className="header-text">
          <span className="header-title">Université Sidi Mohamed Ben Abdellah — Fès</span>
          <span className="header-sub">Faculté des Sciences Dhar El Mahraz · Concours Master MQL 2026-2027</span>
        </div>
      </div>
    </header>
  )
}
