import React, { useEffect, useState } from 'react';

export default function AnimatedNumber({ value, format }: { value: number | string; format?: (v: number) => string }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const dur = 900;
    const start = performance.now();
    const from = display;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased * 100) / 100);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (format) return <>{format(display)}</>;
  return <>{display}</>;
}
