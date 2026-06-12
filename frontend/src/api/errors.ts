export function parseFastApiError(err: any): string {
  const response = err?.response
  const detail = response?.data?.detail
  const status = response?.status
  const statusText = response?.statusText
  const message = err?.message

  if (!detail) {
    if (status && statusText) {
      return `Error ${status}: ${statusText}`
    }
    if (message) {
      return message
    }
    return 'Error inesperado, intenta nuevamente'
  }

  // Error de validación Pydantic — array de objetos
  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => e.msg ?? JSON.stringify(e))
      .join(' · ')
  }

  // Error simple — string directo
  if (typeof detail === 'string') {
    return detail
  }

  return 'Error inesperado, intenta nuevamente'
}