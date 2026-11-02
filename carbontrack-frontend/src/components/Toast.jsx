import { useEffect, useRef } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof closeRef.current === 'function') {
        closeRef.current();
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return <div className={`toast ${type}`}>{message}</div>;
}
