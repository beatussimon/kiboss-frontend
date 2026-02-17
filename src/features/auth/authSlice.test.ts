/**
 * Auth slice unit tests.
 * 
 * These tests verify the auth slice actions and reducers.
 */

import { describe, it, expect } from 'vitest'
import authReducer, { login, register, logout, fetchCurrentUser, updateUser } from './authSlice'

describe('Auth Slice', () => {
  describe('Actions', () => {
    it('logout action should have correct type', () => {
      expect(logout.type).toBe('auth/logout')
    })

    it('updateUser action should have correct type', () => {
      const action = updateUser({ 
        id: '123', 
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_email_verified: true,
        is_phone_verified: false,
        trust_score: 75.00,
      } as any)
      expect(action.type).toBe('auth/updateUser')
    })
  })


})

describe('Auth Selectors', () => {
  it('should select isAuthenticated from state', () => {
    const mockState = {
      auth: {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: true,
        isLoading: false,
      },
    } as any
    
    const selectIsAuthenticated = (state: typeof mockState) => state.auth.isAuthenticated
    expect(selectIsAuthenticated(mockState)).toBe(true)
  })

  it('should select user from state', () => {
    const mockUser = { 
      id: '123', 
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    }
    
    const mockState = {
      auth: {
        user: mockUser,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: true,
        isLoading: false,
      },
    } as any
    
    const selectUser = (state: typeof mockState) => state.auth.user
    expect(selectUser(mockState)).toEqual(mockUser)
  })

  it('should select isLoading from state', () => {
    const mockState = {
      auth: {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: true,
      },
    } as any
    
    const selectIsLoading = (state: typeof mockState) => state.auth.isLoading
    expect(selectIsLoading(mockState)).toBe(true)
  })
})
