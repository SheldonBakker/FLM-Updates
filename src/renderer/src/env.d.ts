/* eslint-disable prettier/prettier */
/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.png' {
  const content: string
  export default content
}
