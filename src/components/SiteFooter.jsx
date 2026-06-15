import { CONTENT } from "../data/content.js";

export function SiteFooter() {
  const F = CONTENT.footer;
  return (
    <footer className="rpg-footer">
      <div className="rpg-footer-inner">
        <img className="rpg-footer-logo" src="/ig-logo.jpg" alt="IG Wealth Management" />
        <p>{F.preparedBy}</p>
        <p>{F.disclaimer}</p>
        <p>{F.privacy}</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
