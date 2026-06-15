// App shell + flow state machine.
// Flow: landing → 8 mindset questions → bridge → projection calculator → result.
// (The design-tool "tweaks panel" and result-preview wiring were removed for production.)

import { useState, useEffect, useMemo } from "react";
import { CONTENT } from "./data/content.js";
import { project } from "./data/projection.js";
import { score } from "./data/scoring.js";
import { Landing } from "./components/Landing.jsx";
import { QuestionScreen } from "./components/QuestionScreen.jsx";
import { Bridge } from "./components/Bridge.jsx";
import { CalculatorScreen } from "./components/CalculatorScreen.jsx";
import { ResultScreen } from "./components/ResultScreen.jsx";
import { SiteFooter } from "./components/SiteFooter.jsx";

const STORAGE_KEY = "rpg-progress-v3";
const ADVANCE_DELAY = 350; // ms — tap-to-advance delay on mindset questions
const SHOW_WATERMARK = true; // subtle IG rhombus motif

const MINDSET = CONTENT.mindset;
const TOTAL_Q = MINDSET.length; // 8

// step encoding: -1 landing, 0..7 mindset question, 100 bridge, 150 calculator, 200 result
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p.step !== "number" || typeof p.answers !== "object") return null;
    return p;
  } catch (e) {
    return null;
  }
}

function useIsDesktop() {
  const [is, setIs] = useState(() => window.matchMedia("(min-width: 960px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const fn = (e) => setIs(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return is;
}

export function App() {
  const saved = useMemo(loadProgress, []);
  const [step, setStep] = useState(saved ? saved.step : -1);
  const [answers, setAnswers] = useState(saved ? saved.answers : {});
  const [inputs, setInputs] = useState(
    saved && saved.inputs && typeof saved.inputs.rrsp === "number"
      ? Object.assign({}, CONTENT.calculator.defaults, saved.inputs)
      : Object.assign({}, CONTENT.calculator.defaults)
  );
  const isDesktop = useIsDesktop();

  const prefersReduced = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const motionOn = !prefersReduced;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers, inputs }));
    } catch (e) {
      /* private mode — ignore */
    }
  }, [step, answers, inputs]);

  function answerQuestion(qIndex, answerIdx) {
    const q = MINDSET[qIndex];
    setAnswers((prev) => Object.assign({}, prev, { [q.id]: answerIdx }));
    if (qIndex === TOTAL_Q - 1) setStep(100);
    else setStep(qIndex + 1);
  }

  function restart() {
    setAnswers({});
    setInputs(Object.assign({}, CONTENT.calculator.defaults));
    setStep(-1);
    window.scrollTo(0, 0);
  }

  const projection = useMemo(() => project(inputs), [inputs]);
  const scores = score(answers, projection);
  const showResult = step === 200;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  let screen = null;
  if (showResult) {
    screen = (
      <ResultScreen
        key={"result-" + scores.profile}
        profileKey={scores.profile}
        scores={scores}
        projection={projection}
        inputs={inputs}
        animate={motionOn}
        onRestart={restart}
      />
    );
  } else if (step === -1) {
    screen = <Landing onStart={() => setStep(0)} />;
  } else if (step === 100) {
    screen = <Bridge onContinue={() => setStep(150)} onBack={() => setStep(TOTAL_Q - 1)} />;
  } else if (step === 150) {
    screen = (
      <CalculatorScreen
        inputs={inputs}
        onInputs={setInputs}
        onDone={() => setStep(200)}
        onBack={() => setStep(100)}
        isDesktop={isDesktop}
      />
    );
  } else {
    const q = MINDSET[step];
    screen = (
      <QuestionScreen
        key={q.id}
        q={q}
        number={step + 1}
        total={TOTAL_Q}
        selected={answers[q.id]}
        onAnswer={(idx) => answerQuestion(step, idx)}
        onBack={() => (step === 0 ? setStep(-1) : setStep(step - 1))}
        advanceDelay={ADVANCE_DELAY}
      />
    );
  }

  const wide = step === 150 && !showResult && isDesktop;

  return (
    <div className="rpg-app">
      {SHOW_WATERMARK ? (
        <>
          <div className="rpg-rhombus rpg-rhombus--a" />
          <div className="rpg-rhombus rpg-rhombus--b" />
        </>
      ) : null}

      <main className={"rpg-main" + (wide ? " rpg-main--wide" : "")}>{screen}</main>
      <SiteFooter />
    </div>
  );
}

export default App;
