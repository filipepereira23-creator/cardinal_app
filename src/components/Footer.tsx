/**
 * Slim footer. The full footer (company links, socials, back to top) was removed from the app
 * on Filipe's request (20 Nov 2026) and is saved in website_later/Footer.tsx for the website.
 * Only the two legal pages stay reachable.
 */
export function Footer() {
  return (
    <footer className="legal-line">
      <a href="#/info/privacy">Privacy Policy</a>
      <span aria-hidden="true">·</span>
      <a href="#/info/terms">Terms Of Use</a>
    </footer>
  );
}
