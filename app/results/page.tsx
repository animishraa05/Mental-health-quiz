"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AllResults {
  user: any
  vak: any
  ei: any
  repSystem: any
}

export default function AllResultsPage() {
  const [results, setResults] = useState<AllResults | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchResults = async () => {
      const userId = localStorage.getItem("quiz_user_id")
      if (!userId) {
        router.push("/")
        return
      }

      try {
        const supabase = getSupabaseClient()

        // Fetch user info
        const { data: user } = await supabase.from("users").select("*").eq("id", userId).single()

        // Fetch VAK results
        const { data: vak } = await supabase.from("vak_results").select("*").eq("user_id", userId).single()

        // Fetch EI results
        const { data: ei } = await supabase.from("ei_results").select("*").eq("user_id", userId).single()

        // Fetch Rep System results
        const { data: repSystem } = await supabase.from("rep_system_results").select("*").eq("user_id", userId).single()

        setResults({ user, vak, ei, repSystem })
      } catch (error) {
        console.error("Error fetching results:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [router])

  const handleStartOver = () => {
    const keysToRemove = [
      "quiz_user_id",
      "quiz_session_id",
      "quiz_session_token",
      "vak_results",
      "ei_results",
      "rep_system_results",
    ]
    keysToRemove.forEach((key) => localStorage.removeItem(key))
    // Also clean up any progress snapshots
    Object.keys(localStorage)
      .filter((k) => k.startsWith("vak_quiz_progress_") || k.startsWith("ei_quiz_progress_") || k.startsWith("rep_quiz_progress_"))
      .forEach((k) => localStorage.removeItem(k))
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <p className="mb-4">No results found. Please complete the quizzes first.</p>
            <Button onClick={() => router.push("/")}>Start Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-indigo-800">Complete Assessment Results</CardTitle>
            <CardDescription>Summary of all your quiz results</CardDescription>
          </CardHeader>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-semibold">Name:</span> {results.user?.name}
              </div>
              <div>
                <span className="font-semibold">Age:</span> {results.user?.age}
              </div>
              <div>
                <span className="font-semibold">Course:</span> {results.user?.course_name}
              </div>
              <div>
                <span className="font-semibold">Semester:</span> {results.user?.semester}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VAK Results */}
        {results.vak && (
          <Card>
            <CardHeader>
              <CardTitle>VAK Learning Style Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.vak.visual_score}</div>
                  <div className="text-sm font-medium">Visual</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.vak.auditory_score}</div>
                  <div className="text-sm font-medium">Auditory</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.vak.kinesthetic_score}</div>
                  <div className="text-sm font-medium">Kinesthetic</div>
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold">Dominant Style: </span>
                <span className="text-lg font-bold text-indigo-600">{results.vak.dominant_style}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* EI Results */}
        {results.ei && (
          <Card>
            <CardHeader>
              <CardTitle>Emotional Intelligence Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center p-3 bg-teal-50 rounded-lg">
                  <div className="text-lg font-bold text-teal-600">{results.ei.self_awareness_score}</div>
                  <div className="text-xs font-medium">Self Awareness</div>
                  <div className="text-xs text-gray-600">{results.ei.self_awareness_classification}</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{results.ei.managing_emotions_score}</div>
                  <div className="text-xs font-medium">Managing Emotions</div>
                  <div className="text-xs text-gray-600">{results.ei.managing_emotions_classification}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{results.ei.motivating_oneself_score}</div>
                  <div className="text-xs font-medium">Motivating Oneself</div>
                  <div className="text-xs text-gray-600">{results.ei.motivating_oneself_classification}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{results.ei.empathy_score}</div>
                  <div className="text-xs font-medium">Empathy</div>
                  <div className="text-xs text-gray-600">{results.ei.empathy_classification}</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{results.ei.social_skill_score}</div>
                  <div className="text-xs font-medium">Social Skill</div>
                  <div className="text-xs text-gray-600">{results.ei.social_skill_classification}</div>
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold">Total EI Score: </span>
                <span className="text-lg font-bold text-indigo-600">{results.ei.total_score} / 250</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rep System Results */}
        {results.repSystem && (
          <Card>
            <CardHeader>
              <CardTitle>Representational System Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.repSystem.visual_score}</div>
                  <div className="text-sm font-medium">Visual</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.repSystem.auditory_score}</div>
                  <div className="text-sm font-medium">Auditory</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.repSystem.kinesthetic_score}</div>
                  <div className="text-sm font-medium">Kinesthetic</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{results.repSystem.auditory_digital_score}</div>
                  <div className="text-sm font-medium">Auditory Digital</div>
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold">Dominant System: </span>
                <span className="text-lg font-bold text-indigo-600">{results.repSystem.dominant_system}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={handleStartOver} variant="outline" size="lg">
            Take Quiz Again
          </Button>
        </div>
      </div>
    </div>
  )
}
