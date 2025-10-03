/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Adicione suas variáveis de ambiente aqui
  // readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
