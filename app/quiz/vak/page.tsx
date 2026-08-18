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
import { VAK_QUESTIONS } from "@/components/vak-questions"
import { calculateVAKScores, getVAKDominantStyle, validateVAKAnswers } from "@/lib/scoring"
import { updateOverallCompletion } from "@/lib/completion"

export default function VAKQuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
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
      const savedProgress = localStorage.getItem(`vak_quiz_progress_${storedSessionId}`)
      if (savedProgress) {
        const { questionIndex, answers: savedAnswers } = JSON.parse(savedProgress)
        setCurrentQuestion(questionIndex)
        setAnswers(savedAnswers)
      }
    }
  }, [router])

  // Effect to save progress
  useEffect(() => {
    if (userId && sessionId) {
      const progressToSave = JSON.stringify({
        questionIndex: currentQuestion,
        answers: answers,
      })
      localStorage.setItem(`vak_quiz_progress_${sessionId}`, progressToSave)
    }
  }, [currentQuestion, answers, userId, sessionId])

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < VAK_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!userId || !sessionId) return // Check both userId and sessionId

    if (!validateVAKAnswers(answers, VAK_QUESTIONS.length)) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = getSupabaseClient()

      // Save responses
      const responses = Object.entries(answers).map(([questionIndex, selectedValue]) => {
        const question = VAK_QUESTIONS[Number.parseInt(questionIndex)]
        const selectedOption = question.options.find((opt) => opt.value === selectedValue)

        return {
          user_id: userId,
          session_id: sessionId, // Added session_id
          question_number: Number.parseInt(questionIndex) + 1,
          question_text: question.text,
          selected_option: selectedValue,
          option_text: selectedOption?.label || "",
          selected_value: selectedValue,
          learning_style: selectedValue === 'V' ? 'Visual' : selectedValue === 'A' ? 'Auditory' : 'Kinesthetic', // Added learning_style
        }
      })

      const { error: responseError } = await supabase.from("vak_responses").insert(responses)

      if (responseError) throw responseError

      const scores = calculateVAKScores(answers)
      const dominantStyle = getVAKDominantStyle(scores)

      // Save results
      const { error: resultError } = await supabase.from("vak_results").insert({
        user_id: userId,
        session_id: sessionId, // Added session_id
        visual_score: scores.V,
        auditory_score: scores.A,
        kinesthetic_score: scores.K,
        dominant_style: dominantStyle,
      })

      if (resultError) throw resultError

      // Update completion status
      const { error: completionError } = await supabase
        .from("quiz_sessions") // Changed to quiz_sessions
        .update({ vak_completed: true })
        .eq("user_id", userId)
        .eq("id", sessionId) // Ensure specific session is updated

      if (completionError) throw completionError

      // Update overall completion status
      await updateOverallCompletion(userId, sessionId)

      // Store results for display
      localStorage.setItem(
        "vak_results",
        JSON.stringify({
          visual_score: scores.V,
          auditory_score: scores.A,
          kinesthetic_score: scores.K,
          dominant_style: dominantStyle,
        }),
      )

      router.push("/quiz/vak/results")
      localStorage.removeItem(`vak_quiz_progress_${sessionId}`)
    } catch (error) {
      console.error("Error submitting VAK quiz:", error)
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

  const progress = ((currentQuestion + 1) / VAK_QUESTIONS.length) * 100
  const currentQuestionData = VAK_QUESTIONS[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-8">
          <CardTitle className="text-3xl font-bold text-center text-emerald-900">VAK Learning Style Assessment</CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Question {currentQuestion + 1} of {VAK_QUESTIONS.length}
          </CardDescription>
          <div className="pt-4">
            <Progress value={progress} className="w-full h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 leading-relaxed">{currentQuestionData.text}</h3>
            <RadioGroup value={answers[currentQuestion] || ""} onValueChange={handleAnswerChange} className="space-y-4">
              {currentQuestionData.options.map((option, index) => {
                const isSelected = answers[currentQuestion] === option.value;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected 
                        ? "border-emerald-500 bg-emerald-50/50 shadow-sm" 
                        : "border-transparent bg-gray-50/80 hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={`option-${index}`} className={isSelected ? "text-emerald-600" : ""} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base text-gray-700 leading-relaxed py-1">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!answers[currentQuestion] || isSubmitting}>
              {currentQuestion === VAK_QUESTIONS.length - 1 ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
