import { useState, ChangeEvent } from "react"
import type { FC } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Upload } from "lucide-react"
import { useToast } from "../hooks/use-toast"

interface FileUploadProps {
  projectId: number
  onFileUploaded: () => void
}

export const FileUpload: FC<FileUploadProps> = ({ projectId, onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && 
        file.type !== 'application/pdf' && 
        file.type !== 'text/plain') {
      toast({
        title: "Invalid file type",
        description: "Only PDF documents, images (PNG, JPG, JPEG), and text files are allowed",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      })

      onFileUploaded()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="file"
        accept="image/*,.pdf,.txt,text/plain"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="file-upload"
      />
      <Button
        variant="outline"
        disabled={isUploading}
        onClick={() => document.getElementById('file-upload')?.click()}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Uploading..." : "Add Content"}
      </Button>
    </div>
  )
}
