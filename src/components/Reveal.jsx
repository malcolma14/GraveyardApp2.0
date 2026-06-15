import { useState, useEffect } from "react";

// Transition-based reveal: starts hidden, flips visible after mount.
// When animate is false it renders visible immediately (also covers reduced motion).
export function Reveal({ animate, delay, children }) {
  const [shown, setShown] = useState(!animate);
  useEffect(() => {
    if (!animate) {
      setShown(true);
      return;
    }
    // setTimeout rather than rAF: rAF is suspended in hidden/background contexts,
    // which would leave the end-state unreached.
    const id = setTimeout(() => setShown(true), 20);
    return () => clearTimeout(id);
  }, [animate]);
  return (
    <div
      className={"rpg-fade" + (shown ? " rpg-fade--in" : "")}
      style={{ "--reveal-delay": (delay || 0) + "ms" }}
    >
      {children}
    </div>
  );
}

export default Reveal;
