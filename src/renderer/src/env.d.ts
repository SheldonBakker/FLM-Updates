/* eslint-disable prettier/prettier */
/// <reference types="vite/client" />

declare module '*.png' {
  const content: string
  export default content
}
