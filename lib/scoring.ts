// Scoring utilities for all quiz types

export interface VAKScores {
  V: number
  A: number
  K: number
}

export interface EIScores {
  SA: number
  ME: number
  MO: number
  E: number
  SS: number
}

export interface RepSystemScores {
  V: number
  A: number
  K: number
  Ad: number
}

// VAK Learning Style Scoring
export function calculateVAKScores(answers: Record<number, string>): VAKScores {
  const scores: VAKScores = { V: 0, A: 0, K: 0 }

  Object.values(answers).forEach((answer) => {
    if (answer in scores) {
      scores[answer as keyof VAKScores]++
    }
  })

  return scores
}

export function getVAKDominantStyle(scores: VAKScores): string {
  const styleNames: Record<keyof VAKScores, string> = { V: "Visual", A: "Auditory", K: "Kinesthetic" }
  const maxScore = Math.max(scores.V, scores.A, scores.K)
  const dominant = (Object.keys(scores) as Array<keyof VAKScores>).filter(
    (key) => scores[key] === maxScore
  )
  return dominant.map((key) => styleNames[key]).join(" / ")
}

// Emotional Intelligence Scoring
export function calculateEIScores(answers: Record<number, number>, categories: any[]): EIScores & { total: number } {
  const scores: EIScores = { SA: 0, ME: 0, MO: 0, E: 0, SS: 0 }

  categories.forEach((category) => {
    category.items.forEach((itemNumber: number) => {
      const statementIndex = itemNumber - 1
      const rating = answers[statementIndex] || 0
      scores[category.key as keyof EIScores] += rating
    })
  })

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0)

  return { ...scores, total }
}

export function classifyEIScore(score: number): string {
  if (score >= 35) return "Strength"
  if (score >= 18) return "Needs attention"
  return "Development priority"
}

// Representational System Scoring
export function calculateRepSystemScores(
  rankings: Record<number, Record<number, number>>,
  questions: any[],
): RepSystemScores {
  const scores: RepSystemScores = { V: 0, A: 0, K: 0, Ad: 0 }

  Object.entries(rankings).forEach(([questionIndex, questionRankings]) => {
    const question = questions[Number.parseInt(questionIndex)]

    Object.entries(questionRankings).forEach(([optionIndex, ranking]) => {
      const option = question.options[Number.parseInt(optionIndex)]
      // Higher ranking (1 = most descriptive) gets more points
      const points = 5 - ranking // 1->4, 2->3, 3->2, 4->1
      scores[option.value as keyof RepSystemScores] += points
    })
  })

  return scores
}

export function getRepSystemDominant(scores: RepSystemScores): string {
  const systemNames = {
    V: "Visual",
    A: "Auditory",
    K: "Kinesthetic",
    Ad: "Auditory Digital",
  }

  const dominantKey = Object.entries(scores).reduce((a, b) =>
    scores[a[0] as keyof RepSystemScores] > scores[b[0] as keyof RepSystemScores] ? a : b,
  )[0] as keyof RepSystemScores

  return systemNames[dominantKey]
}

// Validation functions
export function validateVAKAnswers(answers: Record<number, string>, totalQuestions: number): boolean {
  return (
    Object.keys(answers).length === totalQuestions &&
    Object.values(answers).every((answer) => ["V", "A", "K"].includes(answer))
  )
}

export function validateEIAnswers(answers: Record<number, number>, totalStatements: number): boolean {
  return (
    Object.keys(answers).length === totalStatements &&
    Object.values(answers).every((rating) => rating >= 1 && rating <= 5)
  )
}

export function validateRepSystemRankings(
  rankings: Record<number, Record<number, number>>,
  totalQuestions: number,
): boolean {
  if (Object.keys(rankings).length !== totalQuestions) return false

  return Object.values(rankings).every((questionRankings) => {
    const usedRankings = Object.values(questionRankings)
    return (
      usedRankings.length === 4 &&
      usedRankings.includes(1) &&
      usedRankings.includes(2) &&
      usedRankings.includes(3) &&
      usedRankings.includes(4)
    )
  })
}
