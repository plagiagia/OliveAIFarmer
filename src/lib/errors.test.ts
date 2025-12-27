import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  DatabaseError,
  getErrorMessage,
} from './errors'

describe('AppError', () => {
  it('creates error with default values', () => {
    const error = new AppError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.isOperational).toBe(true)
  })

  it('creates error with custom values', () => {
    const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', false)
    expect(error.message).toBe('Custom error')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('CUSTOM_ERROR')
    expect(error.isOperational).toBe(false)
  })

  it('is instanceof Error', () => {
    const error = new AppError('Test')
    expect(error instanceof Error).toBe(true)
    expect(error instanceof AppError).toBe(true)
  })
})

describe('NotFoundError', () => {
  it('creates 404 error with default message', () => {
    const error = new NotFoundError()
    expect(error.message).toBe('Resource δεν βρέθηκε')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('creates 404 error with custom resource name', () => {
    const error = new NotFoundError('Αγρόκτημα')
    expect(error.message).toBe('Αγρόκτημα δεν βρέθηκε')
    expect(error.statusCode).toBe(404)
  })
})

describe('UnauthorizedError', () => {
  it('creates 401 error', () => {
    const error = new UnauthorizedError()
    expect(error.message).toBe('Δεν έχετε εξουσιοδότηση')
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('accepts custom message', () => {
    const error = new UnauthorizedError('Πρέπει να συνδεθείτε')
    expect(error.message).toBe('Πρέπει να συνδεθείτε')
  })
})

describe('ForbiddenError', () => {
  it('creates 403 error', () => {
    const error = new ForbiddenError()
    expect(error.message).toBe('Δεν έχετε πρόσβαση')
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })
})

describe('ValidationError', () => {
  it('creates 400 error', () => {
    const error = new ValidationError()
    expect(error.message).toBe('Μη έγκυρα δεδομένα')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('includes field errors', () => {
    const fields = { name: 'Απαιτείται όνομα', email: 'Μη έγκυρο email' }
    const error = new ValidationError('Σφάλμα επικύρωσης', fields)
    expect(error.fields).toEqual(fields)
  })
})

describe('ConflictError', () => {
  it('creates 409 error', () => {
    const error = new ConflictError()
    expect(error.message).toBe('Το στοιχείο υπάρχει ήδη')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('CONFLICT')
  })
})

describe('DatabaseError', () => {
  it('creates non-operational 500 error', () => {
    const error = new DatabaseError()
    expect(error.message).toBe('Σφάλμα βάσης δεδομένων')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('DATABASE_ERROR')
    expect(error.isOperational).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('returns string as-is', () => {
    expect(getErrorMessage('Test error')).toBe('Test error')
  })

  it('extracts message from Error object', () => {
    expect(getErrorMessage(new Error('Error message'))).toBe('Error message')
  })

  it('extracts message from AppError', () => {
    expect(getErrorMessage(new NotFoundError('User'))).toBe('User δεν βρέθηκε')
  })

  it('extracts error field from object', () => {
    expect(getErrorMessage({ error: 'API error' })).toBe('API error')
  })

  it('returns default message for unknown types', () => {
    expect(getErrorMessage(null)).toBe('Παρουσιάστηκε ένα απρόσμενο σφάλμα')
    expect(getErrorMessage(undefined)).toBe('Παρουσιάστηκε ένα απρόσμενο σφάλμα')
    expect(getErrorMessage(123)).toBe('Παρουσιάστηκε ένα απρόσμενο σφάλμα')
  })
})
