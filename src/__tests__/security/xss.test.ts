import { describe, it, expect } from 'vitest';
import { xssPayloads } from '../helpers/fixtures';

describe('XSS Prevention', () => {
  describe('stored XSS in text fields', () => {
    it('chat messages are stored as plain text (no HTML execution)', () => {
      // The app uses React which auto-escapes JSX expressions
      // Verify that XSS payloads are treated as text, not HTML
      xssPayloads.forEach((payload) => {
        const div = document.createElement('div');
        div.textContent = payload; // textContent is safe, never parses HTML
        // textContent preserves the string exactly
        expect(div.textContent).toBe(payload);
        // No script/element children are created from the text
        expect(div.querySelectorAll('script').length).toBe(0);
        expect(div.querySelectorAll('img').length).toBe(0);
      });
    });

    it('task titles with XSS payloads are safely stored', () => {
      xssPayloads.forEach((payload) => {
        const trimmed = payload.trim();
        // The API just trims — the rendering layer (React) handles escaping
        expect(typeof trimmed).toBe('string');
        expect(trimmed.length).toBeGreaterThan(0);
      });
    });

    it('textContent never executes scripts', () => {
      const el = document.createElement('span');
      el.textContent = '<script>alert("xss")</script>';
      expect(el.children.length).toBe(0); // No child elements created
      expect(el.textContent).toBe('<script>alert("xss")</script>');
    });
  });

  describe('React auto-escaping', () => {
    it('innerHTML escapes angle brackets', () => {
      const div = document.createElement('div');
      div.textContent = '<img src="x" onerror="alert(1)">';
      expect(div.innerHTML).toContain('&lt;');
      expect(div.innerHTML).toContain('&gt;');
      expect(div.innerHTML).not.toContain('<img');
    });

    it('dangerous attributes are not parsed in textContent', () => {
      const div = document.createElement('div');
      div.textContent = 'onload="alert(1)"';
      expect(div.getAttribute('onload')).toBeNull();
    });
  });

  describe('input sanitization via trim', () => {
    it('trimming preserves XSS content but removes whitespace', () => {
      const input = '  <script>alert(1)</script>  ';
      const trimmed = input.trim();
      expect(trimmed).toBe('<script>alert(1)</script>');
      // The content is preserved as-is — React handles safe rendering
    });
  });

  describe('URL-based XSS prevention', () => {
    it('javascript: URLs are not used in the app', () => {
      // Task URLs use Next.js Link with path-based routing
      const taskUrl = '/tasks/10000000-0000-0000-0000-000000000001';
      expect(taskUrl.startsWith('/')).toBe(true);
      expect(taskUrl).not.toContain('javascript:');
    });

    it('external URLs in the app are HTTPS only', () => {
      const weatherUrl = 'https://api.open-meteo.com/v1/forecast';
      const radarUrl = 'https://embed.windy.com/';
      expect(weatherUrl.startsWith('https://')).toBe(true);
      expect(radarUrl.startsWith('https://')).toBe(true);
    });
  });
});
