import { CONTENT } from "../data/content.js";
import { BackIcon } from "./icons.jsx";

export function Bridge({ onContinue, onBack }) {
  const D = CONTENT.bridge;
  return (
    <div className="rpg-screen rpg-bridge" data-screen-label="Section bridge">
      <div>
        <button className="rpg-back" onClick={onBack} aria-label="Go back to the previous question">
          <BackIcon />
          Back
        </button>
      </div>
      <h1 className="rpg-headline rpg-headline--bridge">{D.headline}</h1>
      <p className="rpg-body rpg-body--lg">{D.body}</p>
      <div>
        <button className="rpg-btn" onClick={onContinue}>
          {D.cta}
        </button>
      </div>
    </div>
  );
}

export default Bridge;
