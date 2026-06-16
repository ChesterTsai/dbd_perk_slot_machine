/// <reference types="vite/client" />

// Injected by the OBS Studio browser source, used for autostart in the views
interface Window {
  obsstudio?: {
    pluginVersion: string
    linuxbrowser?: boolean
    onActiveChange?: (visible: boolean) => void
    onVisibilityChange?: (visible: boolean) => void
  }
}
