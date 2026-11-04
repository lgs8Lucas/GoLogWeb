/**
 * Utility to reliably extract human-friendly error messages from backend responses.
 * Handles Spring Validation errors (Array of strings), ConflictResponse ({ errors: ... }),
 * NotFoundResponse, standard Spring Boot error bodies, and Axios network/timeout errors.
 */
export const extractErrorMessage = (error, defaultMessage = 'Ocorreu um erro ao processar a operação.') => {
  if (!error) return defaultMessage;

  // Se o backend retornou resposta estruturada
  if (error.response && error.response.data) {
    const data = error.response.data;

    // Caso 1: Spring Bean Validation - List<String> no body do 400
    if (Array.isArray(data) && data.length > 0) {
      return data.join(' • ');
    }

    // Caso 2: Resposta como String direta
    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    // Caso 3: Objeto JSON
    if (typeof data === 'object') {
      if (data.errors) {
        if (Array.isArray(data.errors)) return data.errors.join(' • ');
        return String(data.errors);
      }
      if (data.message) return data.message;
      if (data.erro) return data.erro;
      if (data.error && typeof data.error === 'string') return data.error;
    }
  }

  // Erros de conexão de rede ou indisponibilidade do backend
  if (error.code === 'ERR_NETWORK') {
    return 'Não foi possível conectar ao servidor backend (porta 8081). Verifique se o container ou serviço está ativo.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'A requisição excedeu o tempo limite. Tente novamente em instantes.';
  }

  if (error.message && error.message !== '[object Object]') {
    return error.message;
  }

  return defaultMessage;
};
