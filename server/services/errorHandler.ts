/**
 * Servizio centralizzato per la gestione degli errori
 * Standardizza i messaggi di errore e il logging
 */

import { Response } from "express";
import { ZodError } from "zod";

// Tipi di errore conosciuti
export enum ErrorType {
  VALIDATION = "validation_error",
  AUTHENTICATION = "authentication_error",
  AUTHORIZATION = "authorization_error",
  NOT_FOUND = "not_found",
  BAD_REQUEST = "bad_request",
  CONFLICT = "conflict",
  EXTERNAL_API = "external_api_error",
  RATE_LIMIT = "rate_limit",
  SERVER_ERROR = "server_error"
}

// Interfaccia per gli errori standardizzati
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  source?: string;
  stack?: string;
}

/**
 * Crea un errore standardizzato
 */
export function createError(
  type: ErrorType,
  message: string,
  details?: any,
  code?: string,
  source?: string
): AppError {
  return {
    type,
    message,
    code,
    details,
    source,
    stack: new Error().stack
  };
}

/**
 * Gestisce errori di validazione Zod
 */
export function handleZodError(error: ZodError): AppError {
  // Trasforma l'errore Zod in un formato più leggibile
  const formattedErrors = error.format();
  
  return createError(
    ErrorType.VALIDATION,
    "Validation error in request data",
    formattedErrors,
    "INVALID_INPUT",
    "zod"
  );
}

/**
 * Gestisce errori delle API esterne
 */
export function handleExternalApiError(error: any, serviceName: string): AppError {
  // Estrai le informazioni utili dall'errore dell'API esterna
  const statusCode = error.response?.status;
  const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
  
  let code: string;
  let message: string;
  
  // Standardizza i messaggi in base allo status code
  switch (statusCode) {
    case 400:
      code = "BAD_REQUEST";
      message = `Bad request to ${serviceName} API`;
      break;
    case 401:
    case 403:
      code = "AUTH_ERROR";
      message = `Authentication error with ${serviceName} API`;
      break;
    case 404:
      code = "NOT_FOUND";
      message = `Resource not found in ${serviceName} API`;
      break;
    case 429:
      code = "RATE_LIMITED";
      message = `Rate limit exceeded for ${serviceName} API`;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      code = "SERVER_ERROR";
      message = `${serviceName} API is experiencing issues`;
      break;
    default:
      code = "UNKNOWN_ERROR";
      message = `Error communicating with ${serviceName} API`;
  }
  
  return createError(
    ErrorType.EXTERNAL_API,
    message,
    { originalError: errorMessage },
    code,
    serviceName
  );
}

/**
 * Gestisce errori OpenAI API
 */
export function handleOpenAIError(error: any): AppError {
  // Errori specifici di OpenAI
  const errorMessage = error.response?.data?.error?.message || error.message;
  
  // Standardizza messaggi utente per errori comuni OpenAI
  let userMessage = "Errore durante la generazione AI";
  let code = "OPENAI_ERROR";
  
  if (errorMessage.includes("Rate limit")) {
    userMessage = "Limite di utilizzo API raggiunto. Riprova tra qualche minuto.";
    code = "RATE_LIMIT";
  } else if (errorMessage.includes("tokens")) {
    userMessage = "Il contenuto è troppo lungo. Prova a ridurre la lunghezza del testo.";
    code = "CONTENT_TOO_LONG";
  } else if (errorMessage.includes("content policy")) {
    userMessage = "Il contenuto non rispetta le linee guida. Prova a modificare il testo.";
    code = "CONTENT_POLICY";
  }
  
  return createError(
    ErrorType.EXTERNAL_API,
    userMessage,
    { originalError: errorMessage },
    code,
    "openai"
  );
}

/**
 * Gestisce errori YouTube API
 */
export function handleYouTubeError(error: any): AppError {
  // Errori specifici di YouTube
  const errorMessage = error.response?.data?.error?.message || error.message;
  
  // Standardizza messaggi utente per errori comuni YouTube
  let userMessage = "Errore durante la comunicazione con YouTube";
  let code = "YOUTUBE_ERROR";
  
  if (errorMessage.includes("quota")) {
    userMessage = "Quota YouTube superata. Riprova domani.";
    code = "QUOTA_EXCEEDED";
  } else if (errorMessage.includes("authentication") || errorMessage.includes("credentials")) {
    userMessage = "Errore di autenticazione con YouTube. Riconnetti il tuo account.";
    code = "AUTH_ERROR";
  } else if (errorMessage.includes("notFound") || errorMessage.includes("not found")) {
    userMessage = "Video o risorsa YouTube non trovata.";
    code = "NOT_FOUND";
  }
  
  return createError(
    ErrorType.EXTERNAL_API,
    userMessage,
    { originalError: errorMessage },
    code,
    "youtube"
  );
}

/**
 * Invia una risposta di errore standardizzata al client
 */
export function sendErrorResponse(res: Response, error: AppError): void {
  // Mappa i tipi di errore agli status code HTTP
  const statusCodes: Record<ErrorType, number> = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.BAD_REQUEST]: 400,
    [ErrorType.CONFLICT]: 409,
    [ErrorType.EXTERNAL_API]: 502,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.SERVER_ERROR]: 500
  };
  
  // Log dell'errore per debug
  console.error(`[ERROR] ${error.type}: ${error.message}`, {
    code: error.code,
    source: error.source,
    details: error.details,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
  
  // Invia risposta al client
  res.status(statusCodes[error.type] || 500).json({
    error: {
      type: error.type,
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === "development" ? error.details : undefined
    }
  });
}

/**
 * Middleware per la gestione centralizzata degli errori
 */
export function errorHandlerMiddleware(err: any, req: any, res: Response, next: any): void {
  // Gestisci errori di diversi tipi
  let appError: AppError;
  
  if (err instanceof ZodError) {
    appError = handleZodError(err);
  } else if (err.isAxiosError) {
    // Determina il servizio in base all'URL
    const url = err.config?.url || "";
    let serviceName = "external";
    
    if (url.includes("openai.com")) {
      serviceName = "openai";
      appError = handleOpenAIError(err);
    } else if (url.includes("youtube.com") || url.includes("googleapis.com")) {
      serviceName = "youtube";
      appError = handleYouTubeError(err);
    } else {
      appError = handleExternalApiError(err, serviceName);
    }
  } else if (err.type && Object.values(ErrorType).includes(err.type)) {
    // Se è già un AppError
    appError = err as AppError;
  } else {
    // Error generico
    appError = createError(
      ErrorType.SERVER_ERROR,
      err.message || "Si è verificato un errore imprevisto",
      { originalError: err.toString() },
      "UNEXPECTED_ERROR"
    );
  }
  
  sendErrorResponse(res, appError);
}