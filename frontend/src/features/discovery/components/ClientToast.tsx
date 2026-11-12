interface ClientToastProps {
  message: string | null
}

export function ClientToast({ message }: ClientToastProps) {
  return (
    <div
      className={`client-toast ${message ? 'is-visible' : ''}`}
      id="toast"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
