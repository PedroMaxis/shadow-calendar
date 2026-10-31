import { useEffect, useState } from "react";

/** Data/hora atual, atualizada a cada `intervalMs` (para a linha "agora" da grade) */
export const useNow = (intervalMs = 30_000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
};
