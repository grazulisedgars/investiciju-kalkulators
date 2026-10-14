import { Mail } from "lucide-react";
import logo from "../assets/propfolio-logo-white.svg";
import "./AccountFooter.css";

// Kopīgs footer visiem autorizētajiem īpašuma skatiem.
export default function AccountFooter({ onLogout, onProfile, onPassword }) {
    return <footer className="account-footer"><div className="account-footer-inner">
        <div className="account-footer-brand"><img src={logo} alt="PROPFOLIO" /><p>Gudrāki lēmumi. Labāki ieguldījumi.</p></div>
        <nav aria-label="Produkta saites"><h3>Produkts</h3><a href="/#how-it-works">Kā tas darbojas</a><button type="button" disabled title="Cenu sadaļa vēl tiek gatavota">Cenas</button><a href="/#faq">FAQ</a></nav>
        <nav aria-label="Konta saites"><h3>Konts</h3><button type="button" onClick={onProfile}>Mans profils</button><button type="button" onClick={onPassword}>Mainīt paroli</button><button type="button" onClick={onLogout}>Iziet</button></nav>
        <nav aria-label="Juridiskā informācija"><h3>Juridiski</h3><a href="/privacy">Privātuma politika</a><a href="/terms">Lietošanas noteikumi</a></nav>
        <div className="account-footer-contact"><h3>Sazinies</h3><a href="mailto:propfolio.lv@gmail.com"><Mail size={16} aria-hidden="true" />propfolio.lv@gmail.com</a><a className="account-footer-linkedin" href="https://www.linkedin.com/company/propfolio-lv/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="PROPFOLIO LinkedIn profils"><svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96C2 21.32 2.69 22 3.55 22h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.46 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.29 10.85H15.8v-4.64c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.77 1.2-1.77 2.44v4.72H9.54V9.2h2.83v1.3h.04c.39-.74 1.36-1.53 2.8-1.53 3 0 3.54 1.98 3.54 4.55v5.23Z" /></svg></a></div>
        <small className="account-footer-copyright">© {new Date().getFullYear()} PROPFOLIO. Visas tiesības aizsargātas.</small>
    </div></footer>;
}
