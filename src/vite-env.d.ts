/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VAULT_ADDRESS?: string
  readonly VITE_TOKEN_ADDRESS?: string
  readonly VAULT_ADDRESS?: string
  readonly TOKEN_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
