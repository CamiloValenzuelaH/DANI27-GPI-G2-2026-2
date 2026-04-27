export function parseFastApiError(err: any): string {
  const detail = err?.response?.data?.detail

  if (!detail) {
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