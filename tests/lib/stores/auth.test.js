import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from '../../../src/lib/stores/auth.js';

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear any error state
    authStore.clearError();
    authStore.setLoading(false);
  });

  describe('Initial State', () => {
    it('should have correct initial state structure', () => {
      const state = get(authStore);
      
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('session');
      expect(state).toHaveProperty('loading');
      expect(state).toHaveProperty('error');
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      authStore.setLoading(true);
      const state = get(authStore);
      
      expect(state.loading).toBe(true);
    });

    it('should clear loading state', () => {
      authStore.setLoading(true);
      authStore.setLoading(false);
      const state = get(authStore);
      
      expect(state.loading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // First we need to simulate an error state
      // Since we can't directly set error, we'll just test that clearError exists
      expect(typeof authStore.clearError).toBe('function');
      
      // Call clearError to ensure it doesn't throw
      authStore.clearError();
      const state = get(authStore);
      
      expect(state.error).toBeNull();
    });
  });

  describe('Store Methods', () => {
    it('should have required methods', () => {
      expect(typeof authStore.init).toBe('function');
      expect(typeof authStore.signInWithPhone).toBe('function');
      expect(typeof authStore.verifyOtp).toBe('function');
      expect(typeof authStore.signOut).toBe('function');
      expect(typeof authStore.clearError).toBe('function');
      expect(typeof authStore.setLoading).toBe('function');
    });
  });

  describe('Async Methods Return Promises', () => {
    it('should return promises for async methods', () => {
      // Test that async methods return promises (without actually calling external services)
      const initResult = authStore.init();
      expect(initResult).toBeInstanceOf(Promise);
    });
  });
});