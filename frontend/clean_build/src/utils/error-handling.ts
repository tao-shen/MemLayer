// Error handling utilities

export class AppError extends Error {
  public code?: string;
  public statusCode?: number;

  constructor(
    message: string,
    code?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '发生未知错误';
}

export function handleApiError(error: any): AppError {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.error?.message || error.response.data?.error || '服务器错误';
    const code = error.response.data?.error?.code || 'SERVER_ERROR';
    const statusCode = error.response.status;
    
    return new AppError(message, code, statusCode);
  } else if (error.request) {
    // Request made but no response
    return new AppError('无法连接到服务器', 'NETWORK_ERROR', 0);
  } else {
    // Something else happened
    return new AppError(error.message || '请求失败', 'REQUEST_ERROR');
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}
