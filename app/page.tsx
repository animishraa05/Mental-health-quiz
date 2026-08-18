"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { COURSES } from "@/components/course-data"

export default function DemographicsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    city: "",
    courseId: "",
    semester: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({}) // New state for validation errors
  const router = useRouter()

  const selectedCourse = COURSES.find((course) => course.id === formData.courseId)
  const maxSemesters = selectedCourse?.semesters || 10

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Age validation
    const age = Number.parseInt(formData.age)
    if (Number.isNaN(age) || age < 16 || age > 100) {
      errors.age = "Age must be a number between 16 and 100."
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required."
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      errors.email = "Invalid email format."
    }

    // Add other required field validations here if necessary
    if (!formData.gender) errors.gender = "Gender is required."
    if (!formData.city) errors.city = "City is required."
    if (!formData.courseId) errors.courseId = "Course is required."
    if (!formData.semester) errors.semester = "Semester is required."

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    try {
      const supabase = getSupabaseClient()

      const courseName = selectedCourse?.name || ""

      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Insert user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          name: formData.name,
          email: formData.email,
          age: Number.parseInt(formData.age),
          gender: formData.gender,
          city: formData.city,
          course_id: formData.courseId,
          course_name: courseName,
          semester: Number.parseInt(formData.semester),
        })
        .select()
        .single()

      if (userError) throw userError

      const { data: sessionData, error: sessionError } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: userData.id,
          session_token: sessionToken,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Store session info in localStorage
      localStorage.setItem("quiz_user_id", userData.id)
      localStorage.setItem("quiz_session_id", sessionData.id)
      localStorage.setItem("quiz_session_token", sessionToken)

      toast({
        title: "Registration successful!",
        description: "You can now proceed to the quiz.",
      })

      router.push("/quiz/vak")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl rounded-2xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-900">Welcome to the Mental Health Quiz</CardTitle>
          <CardDescription className="text-lg text-gray-600">Please fill in your details to begin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
                {validationErrors.name && <p className="text-red-500 text-sm">{validationErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
                {validationErrors.email && <p className="text-red-500 text-sm">{validationErrors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  required
                  min="16"
                  max="100"
                  value={formData.age}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^[0-9]+$/.test(value)) {
                      setFormData((prev) => ({ ...prev, age: value }))
                      setValidationErrors((prev) => { const next = { ...prev }; delete next.age; return next }) // Clear error on valid input
                    }
                  }}
                  placeholder="Enter your age"
                />
                {validationErrors.age && <p className="text-red-500 text-sm">{validationErrors.age}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.gender && <p className="text-red-500 text-sm">{validationErrors.gender}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Enter your city"
              />
              {validationErrors.city && <p className="text-red-500 text-sm">{validationErrors.city}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, courseId: value, semester: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your course" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSES.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.courseId && <p className="text-red-500 text-sm">{validationErrors.courseId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, semester: value }))}
                  disabled={!formData.courseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.courseId ? "Select semester" : "Select course first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.semester && <p className="text-red-500 text-sm">{validationErrors.semester}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Start Quiz"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
