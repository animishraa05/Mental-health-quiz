"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { checkAdminAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Download, Users, BookOpen, Brain, Eye, Filter, Search, FileSpreadsheet } from "lucide-react"
import { COURSES } from "@/components/course-data"
import { generateCSVFromViewData, downloadCSV } from "@/lib/export-utils"

// This interface should reflect the columns of the `comprehensive_quiz_export` view
interface UserData {
  user_id: string
  user_name: string
  user_email: string
  user_age: number
  user_gender: string
  user_city: string
  user_course_name: string
  user_semester: number
  user_registration_date: string
  vak_completed: boolean
  ei_completed: boolean
  rep_system_completed: boolean
  all_completed: boolean
  session_completion_date: string | null
  [key: string]: any // Allow other properties from the view
}

interface Stats {
  totalUsers: number
  completedUsers: number
  vakCompleted: number
  eiCompleted: number
  repSystemCompleted: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    completedUsers: 0,
    vakCompleted: 0,
    eiCompleted: 0,
    repSystemCompleted: 0,
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [completionFilter, setCompletionFilter] = useState("all")

  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { isAdmin } = await checkAdminAuth()
      if (!isAdmin) {
        router.push("/login")
        return
      }
      fetchData()
    }
    init()
  }, [router])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, courseFilter, semesterFilter, completionFilter])

  const fetchData = async () => {
    try {
      const supabase = getSupabaseClient()

      // Fetch all data from the new comprehensive view
      const { data: usersData, error: usersError } = await supabase
        .from("comprehensive_quiz_export")
        .select("*")
        .order("user_registration_date", { ascending: false })

      if (usersError) throw usersError

      setUsers(usersData as UserData[])

      // Calculate stats from the fetched data
      const typedData = usersData as UserData[]
      const totalUsers = typedData.length
      const completedUsers = typedData.filter((u: UserData) => u.all_completed).length
      const vakCompleted = typedData.filter((u: UserData) => u.vak_completed).length
      const eiCompleted = typedData.filter((u: UserData) => u.ei_completed).length
      const repSystemCompleted = typedData.filter((u: UserData) => u.rep_system_completed).length

      setStats({
        totalUsers,
        completedUsers,
        vakCompleted,
        eiCompleted,
        repSystemCompleted,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admin data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          (user.user_name || "").toLowerCase().includes(term) ||
          (user.user_email || "").toLowerCase().includes(term) ||
          (user.user_course_name || "").toLowerCase().includes(term)
      )
    }

    if (courseFilter !== "all") {
      // Assuming course name is used for filtering now
      const course = COURSES.find((c) => c.id === courseFilter)
      if (course) {
        filtered = filtered.filter((user) => user.user_course_name === course.name)
      }
    }

    if (semesterFilter !== "all") {
      filtered = filtered.filter((user) => String(user.user_semester) === semesterFilter)
    }

    if (completionFilter !== "all") {
      switch (completionFilter) {
        case "completed":
          filtered = filtered.filter((user) => user.all_completed)
          break
        case "incomplete":
          filtered = filtered.filter((user) => !user.all_completed)
          break
        case "vak-only":
          filtered = filtered.filter((user) => user.vak_completed && !user.ei_completed && !user.rep_system_completed)
          break
        case "partial":
          filtered = filtered.filter(
            (user) => (user.vak_completed || user.ei_completed || user.rep_system_completed) && !user.all_completed
          )
          break
      }
    }

    setFilteredUsers(filtered)
  }

  const exportData = async (exportType: string) => {
    setExporting(true)
    try {
      // Use the already filtered data for the export
      const dataToExport = filteredUsers

      if (dataToExport.length === 0) {
        toast({ title: "No Data to Export", description: "Current filters resulted in no data." })
        return
      }

      const csvContent = generateCSVFromViewData(dataToExport, exportType)
      const dateStr = new Date().toISOString().split("T")[0]
      const filename = `${exportType}_export_${dateStr}.csv`

      downloadCSV(csvContent, filename)
      toast({ title: "Export Successful", description: `Exported ${dataToExport.length} records.` })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const getUniqueCourses = () => {
    const uniqueCourseNames = [...new Set(users.map((user) => user.user_course_name).filter(Boolean))].sort()
    return uniqueCourseNames.map((courseName) => {
      const course = COURSES.find((c) => c.name === courseName)
      return { id: course?.id || courseName, name: courseName }
    })
  }

  const getUniqueValues = (field: keyof UserData) => {
    return [...new Set(users.map((user) => user[field]))].sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-8 w-8" />
              Mental Health Quiz Admin Dashboard
            </CardTitle>
            <CardDescription>Monitor quiz participation and export results by course and semester</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed All</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedUsers}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">VAK Quiz</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.vakCompleted}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">EI Quiz</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.eiCompleted}</p>
                </div>
                <Brain className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rep System</p>
                  <p className="text-2xl font-bold text-teal-600">{stats.repSystemCompleted}</p>
                </div>
                <Filter className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Data Export Options
            </CardTitle>
            <CardDescription>
              Export quiz data in various formats. Current filters will be applied to exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="vak">VAK Details</TabsTrigger>
                <TabsTrigger value="ei">EI Details</TabsTrigger>
                <TabsTrigger value="rep">Rep System</TabsTrigger>
                <TabsTrigger value="comprehensive">Complete</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">Export user summary with completion status and demographics.</p>
                <Button
                  onClick={() => exportData("summary")}
                  disabled={exporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : `Export Summary (${filteredUsers.length} users)`}
                </Button>
              </TabsContent>
              <TabsContent value="vak" className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">Export detailed VAK quiz responses and results.</p>
                <Button
                  onClick={() => exportData("vak")}
                  disabled={exporting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : `Export VAK Data (${filteredUsers.length} users)`}
                </Button>
              </TabsContent>
              <TabsContent value="ei" className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">Export detailed Emotional Intelligence responses and scores.</p>
                <Button
                  onClick={() => exportData("ei")}
                  disabled={exporting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : `Export EI Data (${filteredUsers.length} users)`}
                </Button>
              </TabsContent>
              <TabsContent value="rep" className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">Export Representational System test rankings and preferences.</p>
                <Button
                  onClick={() => exportData("rep")}
                  disabled={exporting}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : `Export Rep System (${filteredUsers.length} users)`}
                </Button>
              </TabsContent>
              <TabsContent value="comprehensive" className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">Export all available data in a single comprehensive file.</p>
                <Button
                  onClick={() => exportData("comprehensive")}
                  disabled={exporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : `Export Complete Dataset (${filteredUsers.length} users)`}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Users
            </CardTitle>
            <CardDescription>Filter the user list below. Filters also apply to data exports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {getUniqueCourses().map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {getUniqueValues("user_semester").map((semester) =>
                    semester !== null ? (
                      <SelectItem key={String(semester)} value={String(semester)}>
                        Semester {semester}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
              <Select value={completionFilter} onValueChange={setCompletionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by completion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="completed">Completed All</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="partial">Partially Completed</SelectItem>
                  <SelectItem value="vak-only">VAK Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Name</th>
                    <th className="text-left p-2 font-semibold">Email</th>
                    <th className="text-left p-2 font-semibold">Course</th>
                    <th className="text-left p-2 font-semibold">Semester</th>
                    <th className="text-left p-2 font-semibold">Age</th>
                    <th className="text-left p-2 font-semibold">Gender</th>
                    <th className="text-left p-2 font-semibold">City</th>
                    <th className="text-left p-2 font-semibold">Quiz Status</th>
                    <th className="text-left p-2 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{user.user_name}</td>
                      <td className="p-2 text-sm text-gray-600">{user.user_email}</td>
                      <td className="p-2">{user.user_course_name}</td>
                      <td className="p-2">{user.user_semester}</td>
                      <td className="p-2">{user.user_age}</td>
                      <td className="p-2">{user.user_gender}</td>
                      <td className="p-2">{user.user_city}</td>
                      <td className="p-2">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={user.vak_completed ? "default" : "secondary"} className="text-xs">
                            VAK
                          </Badge>
                          <Badge variant={user.ei_completed ? "default" : "secondary"} className="text-xs">
                            EI
                          </Badge>
                          <Badge variant={user.rep_system_completed ? "default" : "secondary"} className="text-xs">
                            Rep
                          </Badge>
                          {user.all_completed && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Complete
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {user.user_registration_date ? new Date(user.user_registration_date).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}