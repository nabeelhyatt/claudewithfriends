/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MAX_UPLOAD_SIZE: number
  readonly VITE_MAX_CHAT_LENGTH: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
