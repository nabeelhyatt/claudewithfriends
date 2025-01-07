import { type FC } from "react"
import { Avatar } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Copy, Share, Download } from "lucide-react"
import { cn } from "../lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "../hooks/use-toast"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatMessageProps {
  message: ChatMessage
}

export const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          text: message.content,
        })
      } else {
        throw new Error("Share not supported")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share message",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    const blob = new Blob([message.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `message-${message.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn(
      "flex gap-3 mb-6 group",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 shrink-0">
        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
          {isUser ? 'U' : 'C'}
        </div>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Card className={cn(
          "max-w-[85%] relative",
          isUser ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <CardContent className="p-3 text-sm">
            {message.content}
          </CardContent>
        </Card>
        <div className={cn(
          "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "justify-end" : "justify-start"
        )}>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

export const ChatMessages: FC<{ messages: ChatMessage[] }> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  )
}
