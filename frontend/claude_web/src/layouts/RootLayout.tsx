import { useState, useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useToast } from "../hooks/use-toast"

interface Project {
  id: number
  name: string
  description: string | null
}

interface RootLayoutProps {}

export const RootLayout: React.FC<RootLayoutProps> = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`)
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    // Fetch projects on mount and when returning to dashboard
    if (location.pathname === '/' || !projects.length) {
      fetchProjects()
    }
  }, [location.pathname])

  useEffect(() => {
    const projectMatch = location.pathname.match(/\/projects\/(\d+)/)
    if (projectMatch) {
      const projectId = parseInt(projectMatch[1])
      const project = projects.find(p => p.id === projectId)
      setCurrentProject(project || null)
    } else {
      setCurrentProject(null)
    }
  }, [location.pathname, projects])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold">Claude AI</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {currentProject ? currentProject.name : "All Projects"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  )
}
