import { useState, type FC, type KeyboardEvent, type ChangeEvent } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Send, Upload } from "lucide-react"
import { useToast } from "../hooks/use-toast"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileUpload: (file: File) => void
  isLoading?: boolean
  placeholder?: string
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  onFileUpload,
  isLoading = false,
  placeholder = "How can Claude help you today?"
}) => {
  const [message, setMessage] = useState("")
  const { toast } = useToast()
  const maxLength = 2000 // Adjust based on Claude's actual limits

  const handleSend = () => {
    if (!message.trim()) return
    onSendMessage(message.trim())
    setMessage("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Only PDF documents and images (PNG, JPG, JPEG) are allowed",
        variant: "destructive",
      })
      return
    }

    onFileUpload(file)
    
    // Reset the file input
    const fileInput = document.getElementById('chat-file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="flex flex-col gap-2 bg-background p-4 border-t">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
          id="chat-file-upload"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => document.getElementById('chat-file-upload')?.click()}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          maxLength={maxLength}
          className="flex-1 min-h-[80px] resize-none"
        />
        <Button 
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-end text-xs text-muted-foreground">
        {message.length}/{maxLength} characters
      </div>
    </div>
  )
}
