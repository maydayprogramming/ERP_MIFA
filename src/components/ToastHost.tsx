import { useERP } from '../store'

/** Hook kecil agar ToastStack dan store tetap terhubung tanpa prop drilling. */
export function useToastHost() {
  const { toasts, dismissToast } = useERP()
  return { toasts, dismiss: dismissToast }
}

export { ToastStack } from './ui'
