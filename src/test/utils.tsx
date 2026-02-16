/**
 * Test utilities and mock functions for KIBOSS frontend tests.
 */

import React from 'react'
import { render, RenderResult, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '../app/store'
import { MockedFunction } from 'vitest'

// ============ Test Data Factories ============

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'testuser@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_email_verified: true,
  is_phone_verified: false,
  trust_score: 75.00,
  ...overrides,
})

export const createMockAsset = (overrides = {}) => ({
  id: 'asset-123',
  name: 'Test Apartment',
  description: 'A beautiful test apartment',
  asset_type: 'ROOM',
  owner: createMockUser(),
  city: 'Test City',
  state: 'Test State',
  country: 'US',
  verification_status: 'VERIFIED',
  is_active: true,
  average_rating: 4.5,
  total_reviews: 10,
  properties: {
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1000,
  },
  ...overrides,
})

export const createMockRide = (overrides = {}) => ({
  id: 'ride-123',
  driver: createMockUser(),
  status: 'SCHEDULED',
  route_name: 'Test Route',
  origin: 'New York',
  destination: 'Boston',
  departure_time: new Date(Date.now() + 86400000).toISOString(),  // Tomorrow
  total_seats: 4,
  seat_price: 25.00,
  confirmed_seats: 1,
  ...overrides,
})

export const createMockBooking = (overrides = {}) => ({
  id: 'booking-123',
  renter: createMockUser(),
  asset: createMockAsset(),
  status: 'PENDING',
  start_time: new Date(Date.now() + 86400000).toISOString(),
  end_time: new Date(Date.now() + 90000000).toISOString(),
  total_price: 220.00,
  ...overrides,
})

export const createMockNotification = (overrides = {}) => ({
  id: 'notif-123',
  notification_type: 'booking_confirmed',
  title: 'Booking Confirmed',
  message: 'Your booking has been confirmed',
  is_read: false,
  created_at: new Date().toISOString(),
  ...overrides,
})

// ============ Render Helpers ============

interface RenderWithProvidersOptions {
  initialState?: Record<string, unknown>
  route?: string
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderResult {
  const { initialState = {}, route = '/' } = options

  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  )
}

// ============ Async Test Helpers ============

export async function waitForElementToBeRemoved<T>(
  element: T,
  options?: { timeout?: number }
): Promise<void> {
  await waitFor(() => {
    expect(element).not.toBeInTheDocument()
  }, options)
}

export function waitForAsync<T>(
  callback: () => Promise<T>,
  options?: { timeout?: number }
): Promise<T> {
  return waitFor(callback, options)
}

// ============ Form Test Helpers ============

export function fillFormInputs(form: HTMLElement, data: Record<string, string>): void {
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { value } })
    }
  })
}

export function submitForm(button: HTMLElement): void {
  fireEvent.click(button)
}

// ============ API Mock Helpers ============

export function createMockApiResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    data,
    meta: meta || {
      count: 1,
      next: null,
      previous: null,
    },
  }
}

export function createMockErrorResponse(message: string, errors?: Record<string, string[]>) {
  return {
    response: {
      data: {
        message,
        errors,
      },
      status: 400,
    },
  }
}

// ============ Redux Test Helpers ============

export function getStateSlice(state: ReturnType<typeof store.getState>, sliceName: string) {
  return state[sliceName]
}

// ============ Async State Test Helpers ============

export function expectAsyncError(callback: () => Promise<void>): Promise<void> {
  return expect(callback).rejects.toThrow()
}

export function expectAsyncSuccess<T>(callback: () => Promise<T>): Promise<T> {
  return expect(callback).resolves.toBeDefined()
}
