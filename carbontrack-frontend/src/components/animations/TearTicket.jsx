import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Scissors, AlertTriangle } from 'lucide-react';
import './TearTicket.css';

/**
 * TearTicket component based on React Bits:
 * https://reactbits.dev/micro/tear-ticket
 *
 * Provides an interactive physical ticket that users can drag and tear along
 * a perforated line. Triggers `onTear` only after the tear completes.
 */
export default function TearTicket({
  children,
  stubContent,
  onTear,
  tearThreshold = 75,
  isTorn: controlledIsTorn,
  disabled = false,
  className = '',
  instruction = 'Drag stub right to tear',
  tornInstruction = 'Ticket torn!',
}) {
  const [torn, setTorn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const stubRef = useRef(null);

  // Sync with controlled prop if provided
  useEffect(() => {
    if (controlledIsTorn !== undefined) {
      setTorn(controlledIsTorn);
      if (!controlledIsTorn) {
        dragX.set(0);
        dragY.set(0);
      }
    }
  }, [controlledIsTorn, dragX, dragY]);

  // Derived transforms for tearing sensation
  const stubRotate = useTransform(dragX, [0, tearThreshold], [0, 8]);
  const perforationOpacity = useTransform(dragX, [0, tearThreshold], [1, 0.2]);

  const handleDragEnd = async (_event, info) => {
    setIsDragging(false);
    if (disabled || torn) return;

    // Check if dragged past threshold (either X distance or velocity)
    if (info.offset.x > tearThreshold || info.velocity.x > 300) {
      // Execute the tear physics animation
      setTorn(true);

      // Animate stub falling and fading away
      await Promise.all([
        animate(dragX, info.offset.x + 120, { duration: 0.45, ease: 'easeIn' }),
        animate(dragY, 180, { duration: 0.45, ease: 'easeIn' }),
      ]);

      // Fire completion callback only after tear animation finishes
      if (onTear) {
        onTear();
      }
    } else {
      // Snap back if released before threshold
      animate(dragX, 0, { type: 'spring', stiffness: 450, damping: 28 });
      animate(dragY, 0, { type: 'spring', stiffness: 450, damping: 28 });
    }
  };

  return (
    <div className={`tear-ticket-container ${torn ? 'ticket-torn' : ''} ${className}`}>
      {/* Main Ticket Body (Left) */}
      <div className="tear-ticket-body">
        {/* Notches for vintage ticket perforations */}
        <div className="ticket-notch notch-top" />
        <div className="ticket-notch notch-bottom" />
        <div className="ticket-main-content">
          {children}
        </div>
      </div>

      {/* Perforation Separation Line */}
      <motion.div
        className="tear-ticket-perforation"
        style={{ opacity: perforationOpacity }}
      >
        <span className="perforation-dashed-line" />
        <span className="perforation-icon">
          <Scissors size={14} />
        </span>
      </motion.div>

      {/* Tearable Stub (Right) - Draggable */}
      <motion.div
        ref={stubRef}
        className={`tear-ticket-stub ${torn ? 'stub-torn' : ''} ${isDragging ? 'stub-dragging' : ''}`}
        style={{
          x: dragX,
          y: dragY,
          rotate: stubRotate,
        }}
        drag={!disabled && !torn ? 'x' : false}
        dragConstraints={{ left: 0, right: tearThreshold + 40 }}
        dragElastic={0.12}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileHover={!torn && !disabled ? { scale: 1.02 } : {}}
      >
        <div className="ticket-stub-notch notch-top" />
        <div className="ticket-stub-notch notch-bottom" />
        <div className="ticket-stub-content">
          {stubContent || (
            <div className="stub-default-content">
              <span className="stub-action-text">{torn ? tornInstruction : instruction}</span>
              <span className="stub-drag-cue">👉 ✂️</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

