import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows requests within limit', () => {
      const result = rateLimit('test-ip', { limit: 5, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('tracks count correctly', () => {
      rateLimit('test-ip-2', { limit: 5, windowMs: 60_000 });
      rateLimit('test-ip-2', { limit: 5, windowMs: 60_000 });
      const result = rateLimit('test-ip-2', { limit: 5, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('blocks when limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        rateLimit('test-ip-3', { limit: 5, windowMs: 60_000 });
      }
      const result = rateLimit('test-ip-3', { limit: 5, windowMs: 60_000 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('resets after window expires', () => {
      // Use up the limit
      for (let i = 0; i < 3; i++) {
        rateLimit('test-ip-4', { limit: 3, windowMs: 1000 });
      }
      expect(rateLimit('test-ip-4', { limit: 3, windowMs: 1000 }).allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(1500);

      // Should be allowed again
      expect(rateLimit('test-ip-4', { limit: 3, windowMs: 1000 }).allowed).toBe(true);
    });

    it('separates limits by identifier', () => {
      for (let i = 0; i < 5; i++) {
        rateLimit('ip-a', { limit: 5, windowMs: 60_000 });
      }
      // ip-a exhausted, but ip-b should work
      expect(rateLimit('ip-a', { limit: 5, windowMs: 60_000 }).allowed).toBe(false);
      expect(rateLimit('ip-b', { limit: 5, windowMs: 60_000 }).allowed).toBe(true);
    });
  });

  describe('getClientIp', () => {
    it('extracts first IP from x-forwarded-for', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });
      expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('uses x-real-ip when x-forwarded-for absent', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '9.9.9.9' },
      });
      expect(getClientIp(req)).toBe('9.9.9.9');
    });

    it('returns unknown when no headers', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('unknown');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': '10.0.0.2',
        },
      });
      expect(getClientIp(req)).toBe('10.0.0.1');
    });
  });
});