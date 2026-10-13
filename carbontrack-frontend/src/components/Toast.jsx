import { useEffect, useRef } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const t = setTimeout(() => closeRef.current(), 3000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return <div className={`toast ${type}`}>{message}</div>;
}
