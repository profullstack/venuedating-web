import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { themeStore } from '../../../src/lib/stores/theme.js';

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset to default theme
    themeStore.setTheme('dark');
  });

  describe('Initial State', () => {
    it('should have correct initial state structure', () => {
      const state = get(themeStore);
      
      expect(state).toHaveProperty('mode');
      expect(state).toHaveProperty('colors');
      expect(typeof state.colors).toBe('object');
    });

    it('should have dark theme as default', () => {
      const state = get(themeStore);
      expect(state.mode).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      themeStore.setTheme('dark');
      const state = get(themeStore);
      
      expect(state.mode).toBe('dark');
      expect(state.colors.background).toBe('#1a1a1a');
      expect(state.colors.text).toBe('#ffffff');
    });

    it('should set theme to light', () => {
      themeStore.setTheme('light');
      const state = get(themeStore);
      
      expect(state.mode).toBe('light');
      expect(state.colors.background).toBe('#ffffff');
      expect(state.colors.text).toBe('#1a1a1a');
    });

    it('should handle invalid theme mode gracefully', () => {
      const originalState = get(themeStore);
      themeStore.setTheme('invalid-theme');
      const newState = get(themeStore);
      
      // State should remain unchanged for invalid theme
      expect(newState).toEqual(originalState);
    });
  });

  describe('toggle', () => {
    it('should toggle from dark to light', () => {
      themeStore.setTheme('dark');
      themeStore.toggle();
      const state = get(themeStore);
      
      expect(state.mode).toBe('light');
    });

    it('should toggle from light to dark', () => {
      themeStore.setTheme('light');
      themeStore.toggle();
      const state = get(themeStore);
      
      expect(state.mode).toBe('dark');
    });
  });

  describe('Store Methods', () => {
    it('should have required methods', () => {
      expect(typeof themeStore.init).toBe('function');
      expect(typeof themeStore.setTheme).toBe('function');
      expect(typeof themeStore.toggle).toBe('function');
      expect(typeof themeStore.applyCSSVariables).toBe('function');
      expect(typeof themeStore.getMode).toBe('function');
      expect(typeof themeStore.isDark).toBe('function');
    });
  });

  describe('Color Properties', () => {
    it('should have all required color properties', () => {
      const state = get(themeStore);
      const requiredColors = [
        'primary',
        'secondary',
        'background',
        'surface',
        'text',
        'textSecondary',
        'border',
        'success',
        'warning',
        'error'
      ];

      requiredColors.forEach(color => {
        expect(state.colors).toHaveProperty(color);
        expect(typeof state.colors[color]).toBe('string');
        expect(state.colors[color]).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
      });
    });
  });
});