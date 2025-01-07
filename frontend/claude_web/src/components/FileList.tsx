import type { FC } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { FileText, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { formatBytes } from "../lib/utils"

interface File {
  id: number
  name: string
  content_type: string
  size: number
  uploaded_at: string
}

interface FileListProps {
  files: File[]
}

const truncateName = (name: string): string => {
  return name.length > 14 ? name.slice(0, 14) + "..." : name
}

export const FileList: FC<FileListProps> = ({ files }) => {
  if (files.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No files uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.id}>
          <CardHeader className="py-4">
            <CardTitle className="flex items-center text-base font-medium">
              {file.content_type.startsWith('image/') ? (
                <ImageIcon className="mr-2 h-4 w-4" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {truncateName(file.name)}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatBytes(file.size)}</span>
              <span>{format(new Date(file.uploaded_at), "yyyy-MM-dd HH:mm")}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
