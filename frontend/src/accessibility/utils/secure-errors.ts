/**
 * Secure Error Message Handling
 * No expone información técnica en screen readers o UI
 * Previene information disclosure
 */

interface SecureErrorConfig {
  userMessage: string;
  technicalDetails?: string;
  logToConsole?: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

class SecureErrorHandler {
  private static sanitizeMessage(message: string): string {
    // Remover paths de archivo, URLs, stack traces
    return message
      .replace(/\/[^\s]+\.[a-z]+/g, '[FILE]') // Paths
      .replace(/https?:\/\/[^\s]+/g, '[URL]') // URLs
      .replace(/\.[a-z]+\(\d+:\d+\)/g, '[LOCATION]') // Stack locations
      .replace(/Error:/g, 'An error occurred') // Generic error
      .substring(0, 200); // Limitar longitud
  }

  static createSecureError(
    error: Error,
    userMessage: string
  ): SecureErrorConfig {
    return {
      userMessage,
      technicalDetails: error.message,
      severity: 'error',
    };
  }

  /**
   * Mensaje seguro para mostrar a usuario
   */
  static getUserMessage(config: SecureErrorConfig): string {
    // Solo mostrar mensaje amigable al usuario
    return config.userMessage || 'Algo salió mal. Por favor intenta de nuevo.';
  }

  /**
   * Mensaje seguro para screen reader
   * No expone detalles técnicos
   */
  static getAccessibleMessage(config: SecureErrorConfig): string {
    const messageSeverity = {
      info: 'Información: ',
      warning: 'Advertencia: ',
      error: 'Error: ',
      critical: 'Error crítico: ',
    };

    return `${messageSeverity[config.severity]}${config.userMessage}`;
  }

  /**
   * Log técnico seguro (solo en desarrollo)
   */
  static logTechnical(config: SecureErrorConfig): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('Technical Details:', {
        ...config,
        sanitized: this.sanitizeMessage(config.technicalDetails || ''),
      });
    }
  }

  /**
   * Enviar a servicio de logging (con sanitización)
   */
  static async reportError(config: SecureErrorConfig): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: config.userMessage,
          severity: config.severity,
          timestamp: new Date().toISOString(),
          // NO incluir technicalDetails en producción
          ...(process.env.NODE_ENV === 'development' && {
            technical: config.technicalDetails,
          }),
        }),
      });
    } catch (e) {
      // Silenciosamente fallar, no revelar error de logging
    }
  }
}

export default SecureErrorHandler;

/**
 * Mapeo de errores a mensajes seguros
 */
export const secureErrorMessages: Record<string, string> = {
  'Network Error': 'No se pudo conectar. Verifica tu conexión a internet.',
  'Unauthorized': 'No tienes permiso para acceder a esto.',
  'Forbidden': 'No se puede acceder a este recurso.',
  'Not Found': 'El recurso no fue encontrado.',
  'Bad Request': 'Hay un problema con tu solicitud. Intenta de nuevo.',
  'Server Error': 'El servidor está experimentando problemas. Intenta más tarde.',
  'Timeout': 'La solicitud tardó demasiado. Por favor intenta de nuevo.',
  'CORS Error': 'No se puede procesar tu solicitud en este momento.',
  'Database Error': 'Hay un problema al acceder a los datos. Intenta más tarde.',
  'Validation Error': 'Por favor verifica que hayas ingresado la información correctamente.',
};

/**
 * Hook para manejar errores de forma segura
 */
export const useSecureErrorHandler = () => {
  const handleError = (error: Error, userMessage?: string) => {
    const message =
      userMessage ||
      secureErrorMessages[error.message] ||
      'Algo salió mal. Por favor intenta de nuevo.';

    const config: SecureErrorConfig = {
      userMessage: message,
      technicalDetails: error.message,
      severity: 'error',
    };

    SecureErrorHandler.logTechnical(config);
    SecureErrorHandler.reportError(config);

    return config;
  };

  return { handleError };
};
