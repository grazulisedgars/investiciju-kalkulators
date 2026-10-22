import LegalDocument from './LegalDocument';
import documentText from '../content/privacy.lv.md?raw';

export default function Privacy() {
  return <LegalDocument documentText={documentText} title="Privātuma politika" documentId="privacy" />;
}
