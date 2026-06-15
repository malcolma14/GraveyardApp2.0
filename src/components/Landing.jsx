import { CONTENT } from "../data/content.js";

export function Landing({ onStart }) {
  const D = CONTENT.landing;
  return (
    <div className="rpg-screen rpg-landing" data-screen-label="Landing">
      <p className="rpg-eyebrow">A three-minute self-assessment</p>
      <h1 className="rpg-headline rpg-headline--hero">{D.headline}</h1>
      <p className="rpg-body rpg-body--lg">{D.subhead}</p>
      <div className="rpg-landing-cta">
        <button className="rpg-btn" onClick={onStart}>
          {D.cta}
        </button>
        <p className="rpg-support">{D.supporting}</p>
      </div>
      <p className="rpg-attribution">{D.attribution}</p>
    </div>
  );
}

export default Landing;
