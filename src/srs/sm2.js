// Algoritmo SM-2 (SuperMemo 2), o mesmo usado como base pelo Anki.
// quality: 0-5, onde >=3 é considerado acerto e <3 é erro (reinicia o intervalo).

export function createCardState() {
  return {
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReview: Date.now(),
  }
}

export function reviewCard(state, quality) {
  const prev = state ?? createCardState()
  let { repetitions, easeFactor, interval } = prev

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000

  return { repetitions, easeFactor, interval, nextReview }
}
