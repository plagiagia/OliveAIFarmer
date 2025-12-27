import { NextResponse } from 'next/server'

// Custom error classes for better error handling
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

// Specific error types
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} δεν βρέθηκε`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Δεν έχετε εξουσιοδότηση') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Δεν έχετε πρόσβαση') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>

  constructor(message: string = 'Μη έγκυρα δεδομένα', fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.fields = fields
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Το στοιχείο υπάρχει ήδη') {
    super(message, 409, 'CONFLICT')
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Σφάλμα βάσης δεδομένων') {
    super(message, 500, 'DATABASE_ERROR', false)
  }
}

// Error response interface
export interface ApiErrorResponse {
  error: string
  code: string
  statusCode: number
  fields?: Record<string, string>
  timestamp: string
}

// Create standardized error response
export function createErrorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle known AppErrors
  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }

    if (error instanceof ValidationError && error.fields) {
      response.fields = error.fields
    }

    // Log non-operational errors (unexpected)
    if (!error.isOperational) {
      console.error('Non-operational error:', error)
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error)
  }

  // Handle unknown errors
  console.error('Unexpected error:', error)

  const response: ApiErrorResponse = {
    error: 'Παρουσιάστηκε ένα απρόσμενο σφάλμα',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(response, { status: 500 })
}

// Type guard for Prisma errors
interface PrismaError {
  code: string
  meta?: { target?: string[] }
}

function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === 'object' && error !== null && 'code' in error
}

// Handle Prisma-specific errors
function handlePrismaError(error: PrismaError): NextResponse<ApiErrorResponse> {
  let message = 'Σφάλμα βάσης δεδομένων'
  let statusCode = 500
  let code = 'DATABASE_ERROR'

  switch (error.code) {
    case 'P2002': // Unique constraint violation
      message = 'Το στοιχείο υπάρχει ήδη'
      statusCode = 409
      code = 'DUPLICATE_ENTRY'
      break
    case 'P2025': // Record not found
      message = 'Το στοιχείο δεν βρέθηκε'
      statusCode = 404
      code = 'NOT_FOUND'
      break
    case 'P2003': // Foreign key constraint failed
      message = 'Αναφορά σε μη υπάρχον στοιχείο'
      statusCode = 400
      code = 'INVALID_REFERENCE'
      break
    case 'P2014': // Required relation violation
      message = 'Λείπουν απαιτούμενα δεδομένα σχέσης'
      statusCode = 400
      code = 'RELATION_ERROR'
      break
    default:
      console.error('Unhandled Prisma error:', error)
  }

  return NextResponse.json({
    error: message,
    code,
    statusCode,
    timestamp: new Date().toISOString()
  }, { status: statusCode })
}

// Helper to wrap async route handlers with error handling
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => createErrorResponse(error))
}

// Client-side error message extraction
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
  }

  return 'Παρουσιάστηκε ένα απρόσμενο σφάλμα'
}

// Parse API response for errors
export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.error || data.message || `Σφάλμα: ${response.status}`
  } catch {
    return `Σφάλμα: ${response.status}`
  }
}
