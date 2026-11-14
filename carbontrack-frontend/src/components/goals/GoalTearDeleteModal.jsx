import React, { useState } from 'react';
import { X, AlertTriangle, Target, Calendar, Trash2 } from 'lucide-react';
import TearTicket from '../animations/TearTicket';
import './GoalTearDeleteModal.css';

/**
 * GoalTearDeleteModal
 * Displays a tearable ticket confirmation modal before calling the deletion API.
 * The deletion API is ONLY invoked after the user physically drags and tears the ticket stub.
 */
export default function GoalTearDeleteModal({
  isOpen = false,
  onClose,
  goal = null,
  onConfirmDelete, // Async function that calls api.goals.delete(goal.id)
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketTorn, setTicketTorn] = useState(false);

  if (!isOpen || !goal) return null;

  const handleTearComplete = async () => {
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await onConfirmDelete(goal.id);
      // Parent closes modal and displays success toast
    } catch (err) {
      console.error('Goal deletion error:', err);
      setErrorMessage(err?.message || 'Failed to remove goal from the server. Please retry.');
      // Restore the ticket so the user can retry or cancel
      setTicketTorn(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return;
    setErrorMessage('');
    setTicketTorn(false);
    onClose();
  };

  return (
    <div className="tear-modal-backdrop" onClick={handleCancel} role="dialog" aria-modal="true">
      <div className="tear-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="tear-modal-header">
          <div className="tear-header-icon-wrap">
            <Trash2 size={20} color="#EF4444" />
          </div>
          <div className="tear-header-text">
            <h3>Remove Sustainability Goal</h3>
            <p>Tear the ticket below to permanently remove this goal</p>
          </div>
          <button
            type="button"
            className="tear-modal-close"
            onClick={handleCancel}
            disabled={isDeleting}
            aria-label="Cancel deletion"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notice if API failed */}
        {errorMessage && (
          <div className="tear-error-notice" role="alert">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Interactive Tearable Ticket */}
        <div className="tear-ticket-wrapper">
          <TearTicket
            onTear={handleTearComplete}
            isTorn={ticketTorn}
            disabled={isDeleting}
            instruction="Tear To Delete"
            tornInstruction="Deleting..."
          >
            <div className="goal-ticket-details">
              <span className="goal-ticket-badge">
                <Target size={12} />
                <span>{goal.category || 'Overall Footprint'}</span>
              </span>

              <h4 className="goal-ticket-title" title={goal.title || goal.description}>
                {goal.title || goal.description || 'Carbon Reduction Goal'}
              </h4>

              <div className="goal-ticket-metrics">
                <div className="metric-chip">
                  <span className="metric-lbl">Target:</span>
                  <strong>{Number(goal.targetEmissionsKg || goal.targetEmissions || 0).toFixed(1)} kg CO₂e</strong>
                </div>

                {goal.startDate && goal.endDate && (
                  <div className="metric-chip date-chip">
                    <Calendar size={11} />
                    <span>{goal.startDate} – {goal.endDate}</span>
                  </div>
                )}
              </div>
            </div>
          </TearTicket>
        </div>

        {/* Status Indicator / Instructions */}
        <div className="tear-instruction-footer">
          {isDeleting ? (
            <span className="status-deleting-text">Calling deletion engine...</span>
          ) : (
            <span className="status-prompt-text">
              ↔️ Drag the red stub to the right until it separates.
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="tear-modal-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

