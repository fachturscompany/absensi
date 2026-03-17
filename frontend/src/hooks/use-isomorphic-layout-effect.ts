import { useEffect, useLayoutEffect } from 'react';

/**
 * Hook untuk mengatasi hydration mismatch dengan menggunakan
 * useLayoutEffect di client dan useEffect di server
 */
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
