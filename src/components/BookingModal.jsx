import { useEffect, useRef } from "react";

// Adam Malcolm's Microsoft Bookings page, embedded in an accessible modal.
const BOOKING_URL =
  "https://outlook.office.com/book/AdamMalcolmConsultantIGWealthManagementOnlineBooking@igmfinancial.net/?ismsaljsauthenabled";

export function BookingModal({ open, onClose }) {
  const closeRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    if (closeRef.current) closeRef.current.focus();

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="rpg-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rpg-modal" role="dialog" aria-modal="true" aria-labelledby="rpg-booking-title">
        <div className="rpg-modal-head">
          <h2 className="rpg-modal-title" id="rpg-booking-title">
            Book a conversation
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="rpg-modal-close"
            onClick={onClose}
            aria-label="Close booking window"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="rpg-modal-body">
          <iframe
            className="rpg-modal-iframe"
            src={BOOKING_URL}
            title="Book a conversation with Adam Malcolm — Microsoft Bookings"
            scrolling="yes"
          />
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
