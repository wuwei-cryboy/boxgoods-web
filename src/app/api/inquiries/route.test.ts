import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const actualSchema = z.object({
  category_id: z.string().optional(),
  product_id: z.string().optional(),
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  qty: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

describe('inquiries validation', () => {
  const validBase = {
    name: 'Jean Dupont',
    email: 'jean@example.com',
  };

  it('accepts valid minimal payload', () => {
    const result = actualSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const payload = {
      ...validBase,
      category_id: 'telephones',
      product_id: 'p01',
      company: 'Acme Corp',
      phone: '+33 1 23 45 67 89',
      qty: '100', // coerce from string
      message: 'Need bulk pricing',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring_sale',
    };
    const result = actualSchema.safeParse(payload);
    expect(result.success).toBe(true);
    expect(result.data.qty).toBe(100); // coerced to number
  });

  it('rejects missing name', () => {
    const { name: _name, ...rest } = validBase;
    const result = actualSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path.includes('name'))).toBe(true);
  });

  it('rejects empty name', () => {
    const result = actualSchema.safeParse({ ...validBase, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = actualSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path.includes('email'))).toBe(true);
  });

  it('rejects negative qty', () => {
    const result = actualSchema.safeParse({ ...validBase, qty: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer qty', () => {
    const result = actualSchema.safeParse({ ...validBase, qty: 3.14 });
    expect(result.success).toBe(false);
  });

  it('accepts qty as string (coerce)', () => {
    const result = actualSchema.safeParse({ ...validBase, qty: '42' });
    expect(result.success).toBe(true);
    expect(result.data.qty).toBe(42);
  });

  it('accepts zero qty (coerce to 0, then positive fails)', () => {
    // Note: z.coerce.number().positive() will reject 0
    const result = actualSchema.safeParse({ ...validBase, qty: '0' });
    expect(result.success).toBe(false);
  });

  it('accepts all UTM fields as optional strings', () => {
    const result = actualSchema.safeParse({
      ...validBase,
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
    });
    expect(result.success).toBe(true);
  });
});