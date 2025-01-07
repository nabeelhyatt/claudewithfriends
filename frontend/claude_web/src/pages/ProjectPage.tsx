import { useState, useEffect } from "react"
import { useParams, Link, Routes, Route } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { FileUpload } from "../components/FileUpload"
import { FileList } from "../components/FileList"
import { ChatHistory } from "../components/ChatHistory"
import { ChatContainer } from "../components/ChatContainer"
import { useToast } from "../hooks/use-toast"

interface Project {
  id: number
  name: string
  description: string | null
  files: Array<{
    id: number
    name: string
    content_type: string
    size: number
    uploaded_at: string
  }>
}

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchProject = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  if (isLoading) {
    return <div className="text-center">Loading project...</div>
  }

  if (!project) {
    return <div className="text-center">Project not found</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Ensure we only copy the project base URL without any chat routes
                const baseUrl = window.location.origin + `/projects/${projectId}`
                navigator.clipboard.writeText(baseUrl)
                toast({ title: "Link Copied", description: "Project URL copied to clipboard. Share this link to collaborate!" })
              }}
            >
              + Collaborate
            </Button>
            <Link to={`/projects/${project.id}/chats/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Routes>
                <Route path="/chats/:chatId" element={<ChatContainer projectId={parseInt(projectId!)} files={project.files} />} />
              </Routes>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Knowledge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FileUpload projectId={parseInt(projectId!)} onFileUploaded={fetchProject} />
                    <FileList files={project.files} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chat History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChatHistory projectId={parseInt(projectId!)} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectPage
