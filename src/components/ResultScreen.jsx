import { useState } from "react";
import { CONTENT } from "../data/content.js";
import { FMT } from "../data/fmt.js";
import { Reveal } from "./Reveal.jsx";
import { Gauge } from "./Gauge.jsx";
import { ProjectionPanel } from "./CalculatorScreen.jsx";
import { EmailGate } from "./EmailGate.jsx";
import { BookingModal } from "./BookingModal.jsx";

export function ResultScreen({ profileKey, scores, projection, inputs, animate, onRestart }) {
  const R = CONTENT.results[profileKey];
  const [unlocked, setUnlocked] = useState(false);
  const [sendOk, setSendOk] = useState(true);
  const [copied, setCopied] = useState(false);
  const [booking, setBooking] = useState(false);

  const investableAssets = (inputs.rrsp || 0) + (inputs.tfsa || 0) + (inputs.nonreg || 0);

  function handleUnlock(ok) {
    setSendOk(ok);
    setUnlocked(true);
  }

  function fallbackCopy(url) {
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyLink() {
    const url = window.location.href.split("#")[0];
    // Only claim "Link copied" when a copy actually happened.
    const done = (ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => done(true),
        () => done(fallbackCopy(url))
      );
    } else {
      done(fallbackCopy(url));
    }
  }

  const showLead =
    profileKey === "A" && projection && projection.depletionAge === null && R.leadSentence;

  return (
    <div className="rpg-screen rpg-result" data-screen-label={"Result: " + R.name}>
      {/* Teaser — always shown, free. The recognition (gauge + profile name). */}
      <div className="rpg-result-reveal">
        <Reveal animate={animate} delay={0}>
          <p className="rpg-eyebrow">Where you stand</p>
        </Reveal>
        <Reveal animate={animate} delay={200}>
          <Gauge intent={scores.intentionality / 100} surplus={scores.surplusFrac} animate={animate} />
        </Reveal>
        <Reveal animate={animate} delay={1500}>
          <h1 className="rpg-headline rpg-headline--result">{R.name}</h1>
        </Reveal>
      </div>

      {!unlocked ? (
        <Reveal animate={animate} delay={1900}>
          <p className="rpg-result-hook">{CONTENT.resultGateHook}</p>
          <EmailGate
            profile={profileKey}
            profileName={R.name}
            investableAssets={investableAssets}
            onUnlock={handleUnlock}
          />
        </Reveal>
      ) : (
        <>
          {projection ? (
            <Reveal animate={animate} delay={0}>
              <div className="rpg-result-projection">
                <p className="rpg-eyebrow" style={{ marginBottom: "12px" }}>
                  Your projection, today's dollars
                </p>
                <ProjectionPanel projection={projection} inputs={inputs} big={true} />
              </div>
            </Reveal>
          ) : null}

          <Reveal animate={animate} delay={150}>
            <div className="rpg-result-para">
              {showLead ? (
                <p className="rpg-body rpg-body--lg rpg-result-lead">
                  {R.leadSentence(FMT.moneyRough(projection.estate), FMT.moneyRough(projection.cra))}
                </p>
              ) : null}
              <p className="rpg-body rpg-body--lg">{R.paragraph}</p>
              <p className="rpg-body rpg-body--lg rpg-result-closing">{R.closing}</p>
            </div>
          </Reveal>

          <Reveal animate={animate} delay={300}>
            <div className="rpg-opportunity">
              <p className="rpg-eyebrow">Your biggest opportunity</p>
              <p className="rpg-body">{R.opportunity}</p>
            </div>
          </Reveal>

          <Reveal animate={animate} delay={400}>
            <div className="rpg-card rpg-thanks">
              <h2 className="rpg-headline" style={{ fontSize: "26px", fontWeight: 300 }}>
                {CONTENT.thankYou.heading}
              </h2>
              <p className="rpg-body">{CONTENT.thankYou.body}</p>
              {!sendOk ? <p className="rpg-guide-delayed">{CONTENT.guideDelayedNote}</p> : null}
            </div>

            <div className="rpg-result-actions">
              <p className="rpg-body rpg-result-tiein">{CONTENT.resultTieIn}</p>
              <button className="rpg-link" onClick={() => setBooking(true)}>
                Book a conversation, no agenda required.
              </button>
              <button className="rpg-link" onClick={copyLink}>
                {copied ? "Link copied" : "Share this assessment (copy link)"}
              </button>
              <button className="rpg-link rpg-restart" onClick={onRestart}>
                Start over
              </button>
            </div>
          </Reveal>
        </>
      )}

      <BookingModal open={booking} onClose={() => setBooking(false)} />
    </div>
  );
}

export default ResultScreen;
