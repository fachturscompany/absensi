import { useEffect, useState } from 'react';

/**
 * Hook untuk memastikan komponen sudah di-mount di client
 * Berguna untuk mengatasi hydration mismatch
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
