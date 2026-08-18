"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { STATEMENTS, CATEGORIES } from "@/components/ei-questions"
import { calculateEIScores, classifyEIScore, validateEIAnswers } from "@/lib/scoring"
import { updateOverallCompletion } from "@/lib/completion"

export default function EIQuizPage() {
  const [currentStatement, setCurrentStatement] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null) // Added sessionId state
  const router = useRouter()

  useEffect(() => {
    const storedUserId = localStorage.getItem("quiz_user_id")
    const storedSessionId = localStorage.getItem("quiz_session_id") // Get sessionId from localStorage

    if (!storedUserId || !storedSessionId) { // Check both
      router.push("/")
      return
    }
    setUserId(storedUserId)
    setSessionId(storedSessionId) // Set sessionId state

    // Load saved progress
    if (storedSessionId) {
      const savedProgress = localStorage.getItem(`ei_quiz_progress_${storedSessionId}`)
      if (savedProgress) {
        const { statementIndex, answers: savedAnswers } = JSON.parse(savedProgress)
        setCurrentStatement(statementIndex)
        setAnswers(savedAnswers)
      }
    }
  }, [router])

  // Effect to save progress
  useEffect(() => {
    if (userId && sessionId) {
      const progressToSave = JSON.stringify({
        statementIndex: currentStatement,
        answers: answers,
      })
      localStorage.setItem(`ei_quiz_progress_${sessionId}`, progressToSave)
    }
  }, [currentStatement, answers, userId, sessionId])

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentStatement]: Number.parseInt(value),
    }))
  }

  const handleNext = () => {
    if (currentStatement < STATEMENTS.length - 1) {
      setCurrentStatement((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStatement > 0) {
      setCurrentStatement((prev) => prev - 1)
    }
  }

  const getCategoryForStatement = (statementIndex: number) => {
    const statementNumber = statementIndex + 1
    return CATEGORIES.find((cat) => cat.items.includes(statementNumber))?.key || "SA"
  }

  const handleSubmit = async () => {
    if (!userId || !sessionId) return // Check both userId and sessionId

    if (!validateEIAnswers(answers, STATEMENTS.length)) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all statements before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = getSupabaseClient()

      // Save responses
      const responses = Object.entries(answers).map(([statementIndex, rating]) => ({
        user_id: userId,
        session_id: sessionId,
        question_number: Number.parseInt(statementIndex) + 1,
        question_text: STATEMENTS[Number.parseInt(statementIndex)], // Changed from statement_text
        response_value: rating,
        category: CATEGORIES.find((cat) => cat.items.includes(Number.parseInt(statementIndex) + 1))?.label || "Self-awareness", // Changed to use full label
      }))

      const { error: responseError } = await supabase.from("ei_responses").insert(responses)

      if (responseError) throw responseError

      const scoreResults = calculateEIScores(answers, CATEGORIES)

      const categoryScores = CATEGORIES.reduce(
        (acc, category) => {
          const score = scoreResults[category.key as keyof typeof scoreResults]
          acc[category.key] = {
            score: score,
            classification: classifyEIScore(score),
          }
          return acc
        },
        {} as Record<string, { score: number; classification: string }>,
      )

      // Save results
      const { error: resultError } = await supabase.from("ei_results").insert({
        user_id: userId,
        session_id: sessionId, // Added session_id
        self_awareness_score: scoreResults.SA,
        self_awareness_classification: classifyEIScore(scoreResults.SA),
        managing_emotions_score: scoreResults.ME,
        managing_emotions_classification: classifyEIScore(scoreResults.ME),
        motivating_oneself_score: scoreResults.MO,
        motivating_oneself_classification: classifyEIScore(scoreResults.MO),
        empathy_score: scoreResults.E,
        empathy_classification: classifyEIScore(scoreResults.E),
        social_skill_score: scoreResults.SS,
        social_skill_classification: classifyEIScore(scoreResults.SS),
        total_score: scoreResults.total,
      })

      if (resultError) throw resultError

      // Update completion status
      const { error: completionError } = await supabase
        .from("quiz_sessions")
        .update({ ei_completed: true })
        .eq("user_id", userId)
        .eq("id", sessionId) // Ensure specific session is updated

      if (completionError) throw completionError

      // Update overall completion status
      await updateOverallCompletion(userId, sessionId)

      // Store results for display
      localStorage.setItem(
        "ei_results",
        JSON.stringify({
          ...categoryScores,
          total_score: scoreResults.total,
        }),
      )

      router.push("/quiz/ei/results")
      localStorage.removeItem(`ei_quiz_progress_${sessionId}`)
    } catch (error) {
      console.error("Error submitting EI quiz:", error)
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!userId) return null

  const progress = ((currentStatement + 1) / STATEMENTS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-violet-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-8">
          <CardTitle className="text-3xl font-bold text-center text-purple-900">Emotional Intelligence Assessment</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Statement {currentStatement + 1} of {STATEMENTS.length}
          </CardDescription>
          <div className="pt-4">
            <Progress value={progress} className="w-full h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-10">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-gray-800 leading-relaxed px-4">{STATEMENTS[currentStatement]}</h3>
              <p className="text-base text-gray-500">
                Rate how well this statement describes you
              </p>
            </div>
            
            <RadioGroup
              value={answers[currentStatement]?.toString() || ""}
              onValueChange={handleAnswerChange}
              className="flex justify-center gap-3 sm:gap-6 pt-4"
            >
              {[1, 2, 3, 4, 5].map((rating) => {
                const isSelected = answers[currentStatement]?.toString() === rating.toString();
                return (
                  <div key={rating} className="flex flex-col items-center space-y-3 group cursor-pointer" onClick={() => handleAnswerChange(rating.toString())}>
                    <div className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 transition-all duration-300 ${
                      isSelected 
                        ? "border-purple-500 bg-purple-50 shadow-md scale-110" 
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white group-hover:scale-105"
                    }`}>
                      <span className={`text-xl font-medium transition-colors ${isSelected ? "text-purple-700" : "text-gray-600"}`}>
                        {rating}
                      </span>
                      {/* Hidden actual radio input for accessibility/form state */}
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} className="absolute opacity-0 w-full h-full cursor-pointer" />
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
            
            <div className="flex justify-between text-sm font-medium text-gray-400 px-6 sm:px-12 pt-2">
              <span>Not at all</span>
              <span>Very much</span>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStatement === 0}>
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!answers[currentStatement] || isSubmitting}>
              {currentStatement === STATEMENTS.length - 1 ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
