// Using new JSX transform
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Upload, Image } from "lucide-react"

const ChatPage: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat Title</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {/* Chat messages will be rendered here */}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex space-x-2">
          <Textarea
            placeholder="How can Claude help you today?"
            className="min-h-[100px]"
          />
        </div>
        <div className="mt-2 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Image className="h-4 w-4" />
            </Button>
          </div>
          <Button>Send</Button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
