import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"

interface ProjectCardProps {
  id: number
  name: string
  description: string | null
  chatCount: number
}

export function ProjectCard({ id, name, description, chatCount }: ProjectCardProps) {
  return (
    <Card className="hover:bg-accent transition-colors">
      <Link to={`/projects/${id}`}>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <MessageSquare className="mr-1 h-4 w-4" />
            {chatCount} {chatCount === 1 ? 'chat' : 'chats'}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
