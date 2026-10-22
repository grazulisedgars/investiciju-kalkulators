import {useEffect, useRef} from 'react';
import {X, ShieldCheck} from 'lucide-react';
import './CookieSettings.css';

export default function CookieSettings() {
  const dialog = useRef(null);
  useEffect(() => {
    const open = () => { if (!dialog.current.open) dialog.current.showModal(); };
    window.addEventListener('propfolio-cookie-settings', open);
    return () => window.removeEventListener('propfolio-cookie-settings', open);
  }, []);
  return <dialog ref={dialog} className="cookie-settings-dialog" aria-labelledby="cookie-settings-title" aria-describedby="cookie-settings-intro">
    <button type="button" className="cookie-settings-close" aria-label="Aizvērt sīkdatņu iestatījumus" onClick={() => dialog.current.close()}><X size={20}/></button>
    <h2 id="cookie-settings-title">Sīkdatņu iestatījumi</h2>
    <p id="cookie-settings-intro">Šobrīd PROPFOLIO izmanto tikai vietnes darbībai nepieciešamās sīkdatnes un pārlūka krātuvi.</p>
    <section><div className="cookie-settings-heading"><h3>Nepieciešamās</h3><span><ShieldCheck size={16}/>Vienmēr aktīvas</span></div>
      <p>Pieteikšanās sīkdatne uztur Tavu sesiju līdz 7 dienām. Pārlūka krātuvē saglabājam analīžu melnrakstus, lai nepazustu ievadītie dati.</p>
      <p>Pamata analīzes melnraksts ir derīgs līdz 48 stundām; padziļinātās analīzes melnraksts — līdz 24 stundām pašreizējā pārlūka sesijā.</p>
    </section>
    <section><div className="cookie-settings-heading"><h3>Analītika</h3><span className="cookie-settings-inactive">Nav aktivizēta</span></div>
      <p>Google Analytics pašlaik nav pieslēgts. Analītikas sīkdatnes netiek izmantotas. Ja ieviesīsim analītiku, pirms tās aktivizēšanas lūgsim Tavu atsevišķu piekrišanu. Varēsi arī atteikties vai vēlāk atsaukt piekrišanu.</p>
    </section>
    <a href="/privacy" target="_blank" rel="noopener noreferrer">Lasīt privātuma politiku (jaunā cilnē)</a>
    <button type="button" className="cookie-settings-done" onClick={() => dialog.current.close()}>Aizvērt</button>
  </dialog>;
}
