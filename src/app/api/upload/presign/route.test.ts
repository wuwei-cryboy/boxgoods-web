import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recreate the presign schema (from the actual route)
const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\//, 'Must be an image type'),
  bucket: z.enum(['product-images', 'inquiry-attachments']),
  maxSize: z.coerce.number().int().positive().max(10 * 1024 * 1024), // max 10MB
});

describe('upload presign validation', () => {
  it('accepts valid payload', () => {
    const result = presignSchema.safeParse({
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      bucket: 'product-images',
      maxSize: '5242880', // 5MB
    });
    expect(result.success).toBe(true);
    expect(result.data.maxSize).toBe(5242880); // coerced to number
  });

  it('rejects missing filename', () => {
    const result = presignSchema.safeParse({
      contentType: 'image/jpeg',
      bucket: 'product-images',
      maxSize: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-image contentType', () => {
    const result = presignSchema.safeParse({
      filename: 'test.pdf',
      contentType: 'application/pdf',
      bucket: 'product-images',
      maxSize: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('accepts image/* content types', () => {
    const types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const type of types) {
      const result = presignSchema.safeParse({
        filename: 'test',
        contentType: type,
        bucket: 'product-images',
        maxSize: 1000,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid bucket', () => {
    const result = presignSchema.safeParse({
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      bucket: 'invalid-bucket',
      maxSize: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects maxSize over 10MB', () => {
    const result = presignSchema.safeParse({
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      bucket: 'product-images',
      maxSize: 20 * 1024 * 1024, // 20MB
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive maxSize', () => {
    const result = presignSchema.safeParse({
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      bucket: 'product-images',
      maxSize: 0,
    });
    expect(result.success).toBe(false);
  });

  it('coerces maxSize from string', () => {
    const result = presignSchema.safeParse({
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      bucket: 'product-images',
      maxSize: '1048576', // 1MB as string
    });
    expect(result.success).toBe(true);
    expect(result.data.maxSize).toBe(1048576);
  });
});