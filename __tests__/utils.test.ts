import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('lib/utils - cn', () => {
  it('should merge single classes correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn('base-class', isTrue && 'active', isFalse && 'inactive')).toBe('base-class active');
  });

  it('should override conflicting tailwind classes with tailwind-merge', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle undefined, null, and empty inputs gracefully', () => {
    expect(cn('class-1', undefined, null, false, '')).toBe('class-1');
  });
});
