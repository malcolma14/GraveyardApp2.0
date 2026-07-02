// Projection calculator: chart, drawers, input controls, and the calculator screen.
// Ported from app/calculator.jsx. ProjectionPanel is reused by the result screen.

import { useState, useEffect, useMemo, useRef } from "react";
import { CONTENT } from "../data/content.js";
import { FMT } from "../data/fmt.js";
import { PROVINCES } from "../data/provinces.js";
import { project } from "../data/projection.js";
import { BackIcon } from "./icons.jsx";

/* "Educational illustration" badge — persistent on calculator + result screens */
export function EduBadge() {
  return <span className="rpg-edu-badge">{CONTENT.calculator.badge}</span>;
}

/* Projection chart -------------------------------------------------------------
   SVG line chart, today's dollars, current age → 95. Blues only, flat fills,
   no gradients. Depletion is shown neutrally, never in red. */
export function ProjectionChart({ projection, inputs, height, compactLabels }) {
  const W = 480;
  const H = height || 260;
  const m = { top: 30, right: 14, bottom: 30, left: 14 };
  const pts = projection.points;
  const ageMin = pts[0].age;
  const ageMax = 95;
  const wMax = Math.max(1, ...pts.map((p) => p.w)) * 1.12;

  const x = (age) =>
    m.left + ((age - ageMin) / Math.max(1, ageMax - ageMin)) * (W - m.left - m.right);
  const y = (w) => H - m.bottom - (w / wMax) * (H - m.top - m.bottom);

  const line = pts
    .map((p, i) => (i === 0 ? "M" : "L") + x(p.age).toFixed(1) + " " + y(p.w).toFixed(1))
    .join(" ");
  const area =
    line + " L" + x(ageMax).toFixed(1) + " " + (H - m.bottom) + " L" + x(ageMin).toFixed(1) + " " + (H - m.bottom) + " Z";

  const retX = x(Math.min(Math.max(inputs.retireAge, ageMin), ageMax));
  const end = pts[pts.length - 1];
  const depleted = projection.depletionAge !== null;
  const markerAge = depleted ? projection.depletionAge : 95;
  const marker = pts.find((p) => p.age === markerAge) || end;

  const endLabel = depleted
    ? compactLabels
      ? "fully used, " + markerAge
      : "fully used by age " + markerAge
    : FMT.compact(projection.estate);

  const peakW = Math.max(...pts.map((p) => p.w));

  return (
    <svg
      viewBox={"0 0 " + W + " " + H}
      role="img"
      aria-label={
        depleted
          ? "Projection of wealth in today's dollars from age " + ageMin + ", fully used by age " + markerAge
          : "Projection of wealth in today's dollars from age " + ageMin + " to 95, ending at " + FMT.money(projection.estate)
      }
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <line x1={m.left} y1={H - m.bottom} x2={W - m.right} y2={H - m.bottom} stroke="var(--sgb-ink-200)" strokeWidth="1.5" />
      <line
        x1={m.left}
        y1={y(peakW)}
        x2={W - m.right}
        y2={y(peakW)}
        stroke="var(--sgb-ink-200)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <text x={m.left} y={y(peakW) - 6} fontSize="11" fontWeight="600" fill="var(--sgb-ink-500)" fontFamily="inherit">
        {FMT.compact(peakW)}
      </text>

      <path d={area} fill="var(--sgb-light-blue)" opacity="0.28" />
      <path d={line} fill="none" stroke="var(--sgb-mid-blue)" strokeWidth="2.5" strokeLinejoin="round" />

      {inputs.retireAge > ageMin && inputs.retireAge < ageMax ? (
        <g>
          <line
            x1={retX}
            y1={m.top - 6}
            x2={retX}
            y2={H - m.bottom}
            stroke="var(--sgb-slate)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            opacity="0.7"
          />
          <text
            x={retX}
            y={m.top - 12}
            fontSize="11"
            fontWeight="700"
            fill="var(--sgb-ink-500)"
            fontFamily="inherit"
            textAnchor="middle"
            letterSpacing="0.06em"
          >
            {compactLabels ? inputs.retireAge : "STOP WORKING " + inputs.retireAge}
          </text>
        </g>
      ) : null}

      <circle
        cx={x(marker.age)}
        cy={y(marker.w)}
        r="5"
        fill={depleted ? "var(--sgb-white)" : "var(--sgb-dark-blue)"}
        stroke="var(--sgb-dark-blue)"
        strokeWidth="2"
      />
      <text
        x={Math.min(x(marker.age), W - m.right) - 9}
        y={y(marker.w) - 10}
        fontSize="13"
        fontWeight="700"
        fill="var(--sgb-dark-blue)"
        fontFamily="inherit"
        textAnchor="end"
      >
        {endLabel}
      </text>

      <text x={m.left} y={H - 10} fontSize="11" fontWeight="600" fill="var(--sgb-ink-500)" fontFamily="inherit">
        Age {ageMin}
      </text>
      <text x={W - m.right} y={H - 10} fontSize="11" fontWeight="600" fill="var(--sgb-ink-500)" fontFamily="inherit" textAnchor="end">
        95
      </text>
    </svg>
  );
}

/* Figures under the chart -------------------------------------------------------- */
export function ProjectionFigures({ projection, big }) {
  const C = CONTENT.calculator.chart;
  if (projection.depletionAge !== null) {
    return (
      <div className="rpg-proj-figures">
        <p className={"rpg-proj-depleted" + (big ? " rpg-proj-depleted--big" : "")}>
          {C.depletedLabel(projection.depletionAge)}
        </p>
        <p className="rpg-support">{C.depletedNote}</p>
      </div>
    );
  }
  return (
    <div className="rpg-proj-figures">
      <div className="rpg-proj-row">
        <span className="rpg-proj-label">{C.estateLabel + (big ? " at 95" : "")}</span>
        <span className={"rpg-proj-value" + (big ? " rpg-proj-value--big" : "")}>
          {FMT.moneyRough(projection.estate)}
        </span>
      </div>
      <div className="rpg-proj-row">
        <span className="rpg-proj-label">{C.craLabel}</span>
        <span className="rpg-proj-value rpg-proj-value--cra">{FMT.moneyRough(projection.cra)}</span>
      </div>
      <p className="rpg-proj-caption">{C.craCaption}</p>
    </div>
  );
}

/* Inline mini-controls used inside the assumptions drawer ------------------------- */
function DrawerStepper({ value, min, max, step, format, onChange, label }) {
  function clamp(n) {
    return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
  }
  return (
    <span className="rpg-drawer-stepper">
      <button
        type="button"
        className="rpg-drawer-stepbtn"
        aria-label={"Decrease " + label}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
      >
        &#8722;
      </button>
      <span className="rpg-drawer-stepval">{format(value)}</span>
      <button
        type="button"
        className="rpg-drawer-stepbtn"
        aria-label={"Increase " + label}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
      >
        +
      </button>
    </span>
  );
}

/* Assumptions drawer ----------------------------------------------------------------
   Items are built from the live projection so the arithmetic is always honest.
   When onSet is provided (calculator screen), fee and gain share are editable. */
function AssumptionsDrawer({ projection, onSet, open: openProp, onOpenChange, containerRef }) {
  const CAL = CONTENT.calculator;
  const A = CAL.assumptions;
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp !== undefined ? openProp : openInternal;
  const setOpen = (v) => (openProp !== undefined ? onOpenChange && onOpenChange(v) : setOpenInternal(v));
  const p = projection;
  const realPct = (p.realReturn * 100).toFixed(1);

  return (
    <div className="rpg-assumptions" ref={containerRef}>
      <button className="rpg-link rpg-assumptions-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {A.title}
      </button>
      {open ? (
        <div className="rpg-assumptions-body">
          <p className="rpg-support">{A.intro}</p>
          <dl className="rpg-assumptions-list">
            <div className="rpg-assumptions-item">
              <dt>
                Returns (yours: {p.styleName}, {realPct}% real)
              </dt>
              <dd>
                {p.styleName} mixes {p.styleMix}. Gross {FMT.pct1(p.gross)} nominal, minus your{" "}
                {FMT.pct1(p.fee)} fee, minus {FMT.pct1(p.inflation)} inflation &#8776; {realPct}% real.
                Nominal returns from the FP Canada 2026 Projection Assumption Guidelines.
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Fee</dt>
              <dd>
                {onSet ? (
                  <span className="rpg-drawer-editrow">
                    <DrawerStepper
                      value={p.fee}
                      min={CAL.feeRange.min}
                      max={CAL.feeRange.max}
                      step={CAL.feeRange.step}
                      format={(v) => FMT.pct1(v) + "/yr"}
                      label="fee"
                      onChange={(v) => onSet("feePct", v)}
                    />
                    <span>PAG allows 0.5% to 2.5%. Default 1.0%.</span>
                  </span>
                ) : (
                  FMT.pct1(p.fee) + " per year, subtracted from gross returns. PAG range 0.5% to 2.5%."
                )}
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Inflation</dt>
              <dd>{FMT.pct1(p.inflation)} (FP Canada 2026 PAG). Everything you see is in today's dollars.</dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Horizon</dt>
              <dd>
                Projection runs to age 95. The PAG recommends a horizon where the probability of
                outliving capital is at most 25% (CPM2014 mortality with improvement scale); age 95
                sits within that guidance at typical user ages.
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Savings and spending</dt>
              <dd>
                Applied proportionally across your three account balances. A simplification: real
                contribution and withdrawal ordering is a planning decision in itself.
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Tax on RRSP/RRIF withdrawals (average {Math.round(p.retireTax)}%)</dt>
              <dd>
                {onSet ? (
                  <span className="rpg-drawer-editrow">
                    <DrawerStepper
                      value={p.retireTax}
                      min={CAL.retireTaxRange.min}
                      max={CAL.retireTaxRange.max}
                      step={CAL.retireTaxRange.step}
                      format={(v) => v + "%"}
                      label="retirement tax rate"
                      onChange={(v) => onSet("retireTax", v)}
                    ></DrawerStepper>
                    <span>
                      Average rate applied to the RRSP/RRIF portion of each withdrawal so your
                      spending is after-tax. Default 25%.
                    </span>
                  </span>
                ) : (
                  "Average " +
                  Math.round(p.retireTax) +
                  "% applied to the RRSP/RRIF portion of each withdrawal so your spending is after-tax."
                )}{" "}
                TFSA and non-registered withdrawals are treated as tax-free in life (non-registered
                gains are still estimated at death). Estimated income tax on withdrawals over
                retirement: {FMT.moneyRough(p.drawdownTax)}.
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Tax at death ({p.province.name})</dt>
              <dd>
                RRSP/RRIF balance taxed as income at the top combined rate ({FMT.pct2(p.province.ord)}).
                TFSA passes tax-free. Non-registered: unrealized gains taxed at the top capital gains rate
                ({FMT.pct2(p.province.cap)}). Rates from the EY provincial tax cards, January 2026. This is
                an upper-bound illustration: your actual rate depends on income in the year of death, and it
                assumes no surviving spouse rollover, which can defer most of this tax.
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Unrealized gain share</dt>
              <dd>
                {onSet ? (
                  <span className="rpg-drawer-editrow">
                    <DrawerStepper
                      value={Math.round(p.gainShare * 100)}
                      min={0}
                      max={100}
                      step={5}
                      format={(v) => v + "%"}
                      label="unrealized gain share"
                      onChange={(v) => onSet("gainShare", v)}
                    />
                    <span>
                      Share of your non-registered balance assumed to be unrealized gain at death. An
                      estimate; default 50%.
                    </span>
                  </span>
                ) : (
                  Math.round(p.gainShare * 100) +
                  "% of the non-registered balance assumed to be unrealized gain at death. An estimate."
                )}
              </dd>
            </div>
            <div className="rpg-assumptions-item">
              <dt>Probate ({p.province.code})</dt>
              <dd>
                {p.province.probateNote.charAt(0).toUpperCase() + p.province.probateNote.slice(1)}, applied
                to the projected estate{p.estate > 0 ? ": " + FMT.money(p.breakdown.probate) : ""}. Simplified
                large-estate schedule, December 2025. An upper bound: we apply it to the full portfolio,
                but registered accounts and TFSAs with named beneficiaries often pass outside the estate
                and avoid probate.
              </dd>
            </div>
            {p.estate > 0 ? (
              <div className="rpg-assumptions-item">
                <dt>Where the estimate comes from</dt>
                <dd>
                  RRSP/RRIF tax {FMT.moneyRough(p.breakdown.rrspTax)} + capital gains tax{" "}
                  {FMT.moneyRough(p.breakdown.capTax)} + probate {FMT.money(p.breakdown.probate)}.
                </dd>
              </div>
            ) : null}
            <div className="rpg-assumptions-item">
              <dt>Sources</dt>
              <dd>
                FP Canada 2026 Projection Assumption Guidelines; EY provincial tax cards (January 15, 2026);
                IG Tax and Estate Library, Estates: Probate (December 2025).
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

/* "What this tool leaves out" drawer -------------------------------------------------- */
function LeavesOutDrawer() {
  const L = CONTENT.calculator.leavesOut;
  const [open, setOpen] = useState(false);
  return (
    <div className="rpg-assumptions rpg-leavesout">
      <button className="rpg-link rpg-assumptions-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {L.title}
      </button>
      {open ? (
        <div className="rpg-assumptions-body">
          <p className="rpg-support">{L.intro}</p>
          <ul className="rpg-leavesout-list">
            {L.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="rpg-leavesout-closing">{L.closing}</p>
        </div>
      ) : null}
    </div>
  );
}

/* The chart panel: badge + chart + figures + disclaimer + drawers, used everywhere ------- */
export function ProjectionPanel({
  projection,
  inputs,
  big,
  height,
  compactLabels,
  onSet,
  assumptionsOpen,
  onAssumptionsOpenChange,
  assumptionsRef
}) {
  const C = CONTENT.calculator.chart;
  return (
    <div className="rpg-proj-panel">
      <div className="rpg-proj-badge-row">
        <EduBadge />
      </div>
      <ProjectionChart projection={projection} inputs={inputs} height={height} compactLabels={compactLabels} />
      <ProjectionFigures projection={projection} big={big} />
      <p className="rpg-proj-disclaimer">{C.disclaimer}</p>
      <AssumptionsDrawer
        projection={projection}
        onSet={onSet}
        open={assumptionsOpen}
        onOpenChange={onAssumptionsOpenChange}
        containerRef={assumptionsRef}
      />
      <LeavesOutDrawer />
    </div>
  );
}

/* Input controls ------------------------------------------------------------------------ */
function Stepper({ value, min, max, step, onChange, format, parse, labelId, label, suffix }) {
  const [text, setText] = useState(format(value));
  useEffect(() => {
    setText(format(value));
  }, [value]);

  function clamp(n) {
    return Math.min(max, Math.max(min, n));
  }
  function commit(raw) {
    const n = parse(raw);
    if (isNaN(n)) {
      setText(format(value));
      return;
    }
    const v = clamp(n);
    onChange(v);
    setText(format(v));
  }
  // Step from the latest typed text, not the value prop — "type 60, click +"
  // must yield 61, not stale-prop + 1.
  function stepBy(dir) {
    const n = parse(text);
    const base = isNaN(n) ? value : clamp(n);
    const v = clamp(base + dir * step);
    onChange(v);
    setText(format(v));
  }

  return (
    <div className="rpg-stepper">
      <button
        type="button"
        className="rpg-stepper-btn"
        aria-label={"Decrease " + label}
        onClick={() => stepBy(-1)}
        disabled={value <= min}
      >
        &#8722;
      </button>
      <div className="rpg-stepper-mid">
        <input
          className="rpg-input rpg-stepper-input"
          inputMode="numeric"
          aria-labelledby={labelId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.target.value);
          }}
        />
        {suffix ? <span className="rpg-stepper-suffix">{suffix}</span> : null}
      </div>
      <button
        type="button"
        className="rpg-stepper-btn"
        aria-label={"Increase " + label}
        onClick={() => stepBy(1)}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

function CalcField({ def, value, onChange, onShowAssumptions }) {
  const CAL = CONTENT.calculator;
  const labelId = "rpg-calc-" + def.id;

  let control = null;
  if (def.kind === "number") {
    control = (
      <Stepper
        value={value}
        min={def.min}
        max={def.max}
        step={def.step}
        onChange={onChange}
        format={(n) => String(n)}
        parse={(s) => parseInt(String(s).replace(/[^\d]/g, ""), 10)}
        labelId={labelId}
        label={def.label}
        suffix={def.suffix}
      />
    );
  } else if (def.kind === "currency") {
    control = (
      <Stepper
        value={value}
        min={def.min}
        max={def.max}
        step={def.step}
        onChange={onChange}
        format={(n) => "$" + n.toLocaleString("en-CA")}
        parse={(s) => parseInt(String(s).replace(/[^\d]/g, ""), 10)}
        labelId={labelId}
        label={def.label}
        suffix={def.suffix}
      />
    );
  } else if (def.kind === "province") {
    control = (
      <div className="rpg-select-wrap">
        <select
          className="rpg-input rpg-select"
          aria-labelledby={labelId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        <svg className="rpg-select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="var(--sgb-slate)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  } else if (def.kind === "style") {
    control = (
      <>
        <div className="rpg-style-cards" role="group" aria-labelledby={labelId}>
          {CAL.styles.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"rpg-style-card" + (value === s.id ? " rpg-style-card--selected" : "")}
              aria-pressed={value === s.id}
              onClick={() => onChange(s.id)}
            >
              <span className="rpg-style-card-name">{s.name}</span>
              <span className="rpg-style-card-blurb">{s.blurb}</span>
              <span className="rpg-style-card-rate">~{s.gross.toFixed(1)}%/yr*</span>
            </button>
          ))}
        </div>
        <p className="rpg-support rpg-calc-helper">
          *Gross return, before fees and inflation. Both are applied in the projection —{" "}
          <button type="button" className="rpg-link" onClick={onShowAssumptions}>
            see the full methodology
          </button>
          .
        </p>
      </>
    );
  }

  return (
    <div className="rpg-calc-field">
      <label className="rpg-calc-label" id={labelId}>
        {def.label}
      </label>
      {control}
      {def.helper ? <p className="rpg-support rpg-calc-helper">{def.helper}</p> : null}
    </div>
  );
}

/* Calculator screen -----------------------------------------------------------------------
   Desktop (≥960px): input column + persistent chart right rail (rail scrolls
   independently if taller than the viewport).
   Mobile: one input per step, sticky collapsed chart strip on top, expandable. */
export function CalculatorScreen({ inputs, onInputs, onDone, onBack, isDesktop }) {
  const CAL = CONTENT.calculator;
  const projection = useMemo(() => project(inputs), [inputs]);
  const [mobileStep, setMobileStep] = useState(0);
  const [chartOpen, setChartOpen] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [scrollSignal, setScrollSignal] = useState(0);
  const assumptionsRef = useRef(null);
  const total = CAL.inputs.length;

  function set(id, v) {
    onInputs(Object.assign({}, inputs, { [id]: v }));
  }

  // Open the Assumptions drawer (and, on mobile, the chart strip) from the
  // style-card footnote link, then bring the drawer into view.
  function showAssumptions() {
    setChartOpen(true);
    setAssumptionsOpen(true);
    setScrollSignal((n) => n + 1);
  }

  // Keep the active input in view when stepping on mobile.
  useEffect(() => {
    if (!isDesktop) window.scrollTo(0, 0);
  }, [mobileStep, isDesktop]);

  // Scroll the Assumptions drawer into view after showAssumptions() opens it.
  useEffect(() => {
    if (!scrollSignal) return;
    const id = window.requestAnimationFrame(() => {
      if (assumptionsRef.current) {
        assumptionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [scrollSignal]);

  if (isDesktop) {
    return (
      <div className="rpg-screen rpg-calc" data-screen-label="Calculator">
        <div className="rpg-calc-grid">
          <div className="rpg-calc-inputs">
            <div className="rpg-progress-row" style={{ marginBottom: "8px" }}>
              <button className="rpg-back" onClick={onBack} aria-label="Go back">
                <BackIcon />
                Back
              </button>
              <span className="rpg-progress-count">{CAL.sectionLabel}</span>
            </div>
            <h1 className="rpg-headline rpg-headline--question">Your projection, live</h1>
            <p className="rpg-support" style={{ marginTop: "8px" }}>
              Adjust anything. The chart keeps up.
            </p>
            <div className="rpg-calc-fieldlist">
              {CAL.inputs.map((def) => (
                <CalcField
                  key={def.id}
                  def={def}
                  value={inputs[def.id]}
                  onChange={(v) => set(def.id, v)}
                  onShowAssumptions={showAssumptions}
                />
              ))}
            </div>
            <div style={{ marginTop: "28px" }}>
              <button className="rpg-btn" onClick={onDone}>
                {CAL.cta}
              </button>
            </div>
          </div>
          <div className="rpg-calc-rail">
            <div className="rpg-calc-railsticky">
              <p className="rpg-eyebrow" style={{ marginBottom: "12px" }}>
                Wealth, today's dollars
              </p>
              <ProjectionPanel
                projection={projection}
                inputs={inputs}
                onSet={set}
                assumptionsOpen={assumptionsOpen}
                onAssumptionsOpenChange={setAssumptionsOpen}
                assumptionsRef={assumptionsRef}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile: stepper
  const def = CAL.inputs[mobileStep];
  return (
    <div className="rpg-screen rpg-calc" data-screen-label="Calculator">
      <div className={"rpg-chartstrip" + (chartOpen ? " rpg-chartstrip--open" : "")}>
        <button className="rpg-chartstrip-head" onClick={() => setChartOpen(!chartOpen)} aria-expanded={chartOpen}>
          <span className="rpg-eyebrow">Your projection</span>
          <span className="rpg-chartstrip-fig">
            {projection.depletionAge !== null
              ? "Fully used by " + projection.depletionAge
              : FMT.compact(projection.estate) + " at 95"}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
              transform: chartOpen ? "rotate(180deg)" : "none",
              transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="var(--sgb-mid-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {chartOpen ? (
          <div className="rpg-chartstrip-body">
            <ProjectionPanel
              projection={projection}
              inputs={inputs}
              height={210}
              compactLabels={true}
              onSet={set}
              assumptionsOpen={assumptionsOpen}
              onAssumptionsOpenChange={setAssumptionsOpen}
              assumptionsRef={assumptionsRef}
            />
          </div>
        ) : (
          <div className="rpg-chartstrip-mini" aria-hidden="true">
            <div className="rpg-proj-badge-row rpg-proj-badge-row--strip">
              <EduBadge />
            </div>
            <ProjectionChart projection={projection} inputs={inputs} height={120} compactLabels={true} />
          </div>
        )}
      </div>

      <div className="rpg-progress" style={{ marginTop: "20px" }}>
        <div className="rpg-progress-row">
          <button
            className="rpg-back"
            onClick={() => (mobileStep === 0 ? onBack() : setMobileStep(mobileStep - 1))}
            aria-label="Go back"
          >
            <BackIcon />
            Back
          </button>
          <span className="rpg-progress-count">
            Input {mobileStep + 1} of {total}
          </span>
        </div>
        <div
          className="rpg-progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax={total}
          aria-valuenow={mobileStep + 1}
        >
          <div className="rpg-progress-fill" style={{ width: (mobileStep / total) * 100 + "%" }} />
        </div>
      </div>

      <div className="rpg-calc-mobilefield">
        <CalcField
          def={def}
          value={inputs[def.id]}
          onChange={(v) => set(def.id, v)}
          onShowAssumptions={showAssumptions}
        />
      </div>

      <div style={{ marginTop: "28px" }}>
        {mobileStep < total - 1 ? (
          <button className="rpg-btn" onClick={() => setMobileStep(mobileStep + 1)}>
            Next
          </button>
        ) : (
          <button className="rpg-btn" onClick={onDone}>
            {CAL.cta}
          </button>
        )}
      </div>
    </div>
  );
}

export default CalculatorScreen;
