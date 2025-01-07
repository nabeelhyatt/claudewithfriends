import { useState, useEffect, type FC } from "react"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { ScrollArea } from "./ui/scroll-area"
import { Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: number
  role: string
  content: string
  created_at: string
}

interface Chat {
  id: number
  title: string
  preview: string
  created_at: string
  updated_at: string
  messages: Message[]
}

interface ChatHistoryProps {
  projectId: number
}

export const ChatHistory: FC<ChatHistoryProps> = ({ projectId }) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  const fetchChats = async (search?: string) => {
    try {
      const queryParams = new URLSearchParams()
      if (search) queryParams.append("search", search)
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/chats?${queryParams}`
      )
      if (!response.ok) throw new Error("Failed to fetch chats")
      
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error("Error fetching chats:", error)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchChats()
  }, [projectId])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    fetchChats(value)
  }

  // Navigate to chat
  const handleChatClick = (chatId: number) => {
    navigate(`/projects/${projectId}/chats/${chatId}`)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleChatClick(chat.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{chat.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {chat.preview}
                </p>
              </CardContent>
            </Card>
          ))}

          {chats.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No chats found. Start a new conversation!
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
