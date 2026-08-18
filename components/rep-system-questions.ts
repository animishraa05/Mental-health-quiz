// Representational System Preference Test Questions based on the provided image
export const REP_SYSTEM_QUESTIONS = [
  {
    id: 1,
    text: "I make important decisions based on:",
    options: [
      { text: "the right gut level feelings", value: "K" },
      { text: "which way sounds the best and resonates for you", value: "A" },
      { text: "what looks best to me after clearly seeing the issues", value: "V" },
      { text: "precise review and study of the issues", value: "Ad" },
    ],
  },
  {
    id: 2,
    text: "During an argument, I am most likely to be influenced by:",
    options: [
      { text: "the loudness or softness of the other person's tone of voice", value: "A" },
      { text: "whether or not I can see the other person's point of view", value: "V" },
      { text: "the logic of the other person's argument", value: "Ad" },
      { text: "whether or not I am in touch with the other person's feelings", value: "K" },
    ],
  },
  {
    id: 3,
    text: "I mostly like to be aware of the following in conversation:",
    options: [
      { text: "the way people hold themselves and interesting facial expressions", value: "V" },
      { text: "the beautiful feelings they and I share", value: "K" },
      { text: "the words I and they choose and whether it all makes good sense", value: "Ad" },
      { text: "the sounds and intonations that come from the lovely tone of voice", value: "A" },
    ],
  },
  {
    id: 4,
    text: "If I had the choice of these in order, first I would like to:",
    options: [
      { text: "find the ideal volume and tuning on a stereo system", value: "A" },
      { text: "select the most intellectually relevant point in an interesting subject", value: "Ad" },
      { text: "select the most comfortable furniture", value: "K" },
      {
        text: "look around and take in the décor, pictures and how the room looks before doing anything else",
        value: "V",
      },
    ],
  },
  {
    id: 5,
    text: "Which describes your room that you live in:",
    options: [
      { text: "The hi-fi is very prominent and you have an excellent collection", value: "A" },
      { text: "It's a practical layout and things are situated in an excellent location", value: "Ad" },
      { text: "The feel of the place is the most important to you", value: "K" },
      { text: "The colours you choose and the way a room looks are most important", value: "V" },
    ],
  },
]

// Scoring system for Representational System Test
export const REP_SYSTEM_SCORING = {
  // Step 1: Copy answers and assign values
  getAnswerKey: () => ({
    1: { 1: "K", 2: "A", 3: "V", 4: "Ad" },
    2: { 1: "A", 2: "V", 3: "Ad", 4: "K" },
    3: { 1: "V", 2: "K", 3: "Ad", 4: "A" },
    4: { 1: "A", 2: "Ad", 3: "K", 4: "V" },
    5: { 1: "A", 2: "Ad", 3: "K", 4: "V" },
  }),

  // Step 2: Calculate totals for each system
  calculateScores: (responses: { questionId: number; ranking: number; optionIndex: number }[]) => {
    const scores: Record<string, number> = { V: 0, A: 0, K: 0, Ad: 0 }
    const answerKey: Record<number, Record<number, string>> = REP_SYSTEM_SCORING.getAnswerKey()

    responses.forEach((response) => {
      const systemType: string = answerKey[response.questionId][response.optionIndex + 1]
      // Higher ranking (4 = most preferred) gets more points
      scores[systemType] += 5 - response.ranking
    })

    return scores
  },

  // Step 3: Determine dominant system
  getDominantSystem: (scores: { V: number; A: number; K: number; Ad: number }) => {
    const maxScore = Math.max(scores.V, scores.A, scores.K, scores.Ad)
    if (scores.V === maxScore) return "Visual"
    if (scores.A === maxScore) return "Auditory"
    if (scores.K === maxScore) return "Kinesthetic"
    return "Auditory Digital"
  },
}
