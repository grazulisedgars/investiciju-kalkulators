import LegalDocument from './LegalDocument';
import documentText from '../content/terms.lv.md?raw';

export default function Terms() {
  return <LegalDocument documentText={documentText} title="Lietošanas noteikumi" documentId="terms" />;
}
