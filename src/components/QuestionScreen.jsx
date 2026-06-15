import { useState, useEffect, useRef } from "react";
import { CheckIcon, BackIcon } from "./icons.jsx";

function ProgressHeader({ number, total, onBack, canBack }) {
  return (
    <div className="rpg-progress">
      <div className="rpg-progress-row">
        <button
          className={"rpg-back" + (canBack ? "" : " rpg-back--hidden")}
          onClick={onBack}
          aria-label="Go back to the previous question"
        >
          <BackIcon />
          Back
        </button>
        <span className="rpg-progress-count">
          Question {number} of {total}
        </span>
      </div>
      <div
        className="rpg-progress-track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={number}
        aria-label={"Question " + number + " of " + total}
      >
        <div className="rpg-progress-fill" style={{ width: ((number - 1) / total) * 100 + "%" }} />
      </div>
    </div>
  );
}

export function QuestionScreen({ q, number, total, selected, onAnswer, onBack, advanceDelay }) {
  const [picked, setPicked] = useState(selected != null ? selected : null);
  const timer = useRef(null);
  const fired = useRef(false); // guard against a double-tap firing onAnswer twice

  useEffect(() => {
    setPicked(selected != null ? selected : null);
    fired.current = false;
    return () => clearTimeout(timer.current);
  }, [q.id]);

  function pick(idx) {
    if (fired.current) return;
    clearTimeout(timer.current);
    setPicked(idx);
    timer.current = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      onAnswer(idx);
    }, advanceDelay);
  }

  return (
    <div className="rpg-screen" data-screen-label={"Question " + number}>
      <ProgressHeader number={number} total={total} onBack={onBack} canBack={true} />
      <h1 className="rpg-headline rpg-headline--question">{q.question}</h1>
      {q.context ? (
        <p className="rpg-support" style={{ marginTop: "12px" }}>
          Context only. Not part of your result.
        </p>
      ) : null}
      <div className="rpg-answers" role="group" aria-label="Answers">
        {q.answers.map((a, i) => (
          <button
            key={i}
            className={"rpg-answer" + (picked === i ? " rpg-answer--selected" : "")}
            onClick={() => pick(i)}
            aria-pressed={picked === i}
          >
            <span>{a.label}</span>
            <CheckIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionScreen;
