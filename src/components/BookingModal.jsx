import { useEffect, useRef, useState } from "react";

// Adam Malcolm's Microsoft Bookings page, embedded in an accessible modal.
const BOOKING_URL =
  "https://outlook.office.com/book/AdamMalcolmConsultantIGWealthManagementOnlineBooking@igmfinancial.net/?ismsaljsauthenabled";

export function BookingModal({ open, onClose }) {
  const closeRef = useRef(null);
  const modalRef = useRef(null);
  const prevFocus = useRef(null);
  // The parent passes an inline onClose; a ref keeps the effect keyed on `open`
  // only, so parent re-renders don't tear it down and yank focus mid-interaction.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    prevFocus.current = document.activeElement;
    if (closeRef.current) closeRef.current.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      // Keep Tab cycling inside the dialog — the covered page is still in the tab order.
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = modalRef.current.contains(active);
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="rpg-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="rpg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpg-booking-title"
      >
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
          {!loaded ? (
            <div className="rpg-modal-loading" role="status">
              <span className="rpg-modal-spinner" aria-hidden="true" />
              Loading the booking page…
            </div>
          ) : null}
          <iframe
            className="rpg-modal-iframe"
            src={BOOKING_URL}
            title="Book a conversation with Adam Malcolm — Microsoft Bookings"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
