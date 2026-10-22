export default function CookieSettingsLink() {
  return <button type="button" className="cookie-settings-link" onClick={() => window.dispatchEvent(new Event('propfolio-cookie-settings'))}>Sīkdatņu iestatījumi</button>;
}
