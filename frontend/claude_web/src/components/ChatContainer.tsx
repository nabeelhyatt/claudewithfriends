import { useState, type FC } from "react"
import { ChatInput } from "./ChatInput"
import { ChatMessages } from "./ChatMessage"
import { useToast } from "../hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ScrollArea } from "./ui/scroll-area"

interface ChatContainerProps {
  projectId: number
  files: Array<{
    id: number
    name: string
    content_type: string
  }>
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export const ChatContainer: FC<ChatContainerProps> = ({ projectId, files }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendMessage = async (content: string) => {
    if (isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          project_id: projectId,
          file_ids: files.map(f => f.id),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Claude')
      }

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from Claude. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload file')

      toast({
        title: "File uploaded",
        description: "File has been added to the project knowledge base.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4 gap-4">
      <Card className="shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Context Window</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-28">
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="text-sm flex items-center">
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs"> ({file.content_type})</span>
                </div>
              ))}
              {files.length === 0 && (
                <p className="text-sm text-muted-foreground">No files in context. Upload files to include them in the conversation.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} />
      </div>
      
      <div className="sticky bottom-0 bg-background pt-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
