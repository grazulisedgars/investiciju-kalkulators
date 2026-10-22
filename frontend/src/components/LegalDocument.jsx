import CookieSettingsLink from "./CookieSettingsLink";
import {useEffect} from 'react';
import {ArrowLeft, ArrowUp, ChevronDown} from 'lucide-react';
import logo from '../assets/icons/propfolio-logo-optimized.svg';
import './Terms.css';

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part, index) =>
    part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> :
      part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/) ?
        <a key={index} href={part.match(/\]\((.+)\)$/)[1]}>{part.match(/^\[([^\]]+)\]/)[1]}</a> : part
  );
}

export default function LegalDocument({documentText, title, documentId}) {
  const blocks = documentText.trim().split(/\r?\n\s*\r?\n/);
  const sections = blocks.filter(block => block.startsWith('## '));
  const sectionId = heading => `${documentId}-${heading.match(/\d+/)[0]}`;
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | PROPFOLIO`;
    const anchor = window.location.hash.slice(1);
    let frame;
    const scrollToAnchor = () => {
      if (anchor === `${documentId}-top` || (anchor.startsWith(`${documentId}-`) && /^\d+$/.test(anchor.slice(documentId.length + 1)))) {
        frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({behavior: 'instant'}));
      }
    };
    scrollToAnchor();
    window.addEventListener('load', scrollToAnchor);
    return () => {
      document.title = previousTitle;
      cancelAnimationFrame(frame);
      window.removeEventListener('load', scrollToAnchor);
    };
  }, [title, documentId]);

  return <div className="terms-page" id={`${documentId}-top`}>
    <header className="terms-header">
      <a href="/" aria-label="PROPFOLIO sākumlapa"><img src={logo} alt="PROPFOLIO" /></a>
      <a className="terms-back" href="/"><ArrowLeft size={17} />Atpakaļ</a>
    </header>
    <main className="terms-layout">
      <aside className="terms-contents">
        <details>
          <summary>Dokumenta saturs<ChevronDown size={17} /></summary>
          <nav aria-label={`${title}: sadaļas`}>
            {sections.map(heading => <a key={heading} href={`#${sectionId(heading)}`}>{heading.slice(3)}</a>)}
          </nav>
        </details>
      </aside>
      <article className="terms-document" aria-labelledby={`${documentId}-title`}>
        <span className="terms-edition">Pagaidu redakcija</span>
        {blocks.map((block, index) => {
          if (block.startsWith('# ')) return <h1 id={`${documentId}-title`} key={index}>{block.slice(2)}</h1>;
          if (block.startsWith('## ')) return <h2 id={sectionId(block)} key={index}>{block.slice(3)}</h2>;
          if (block.startsWith('### ')) return <h3 key={index}>{block.slice(4)}</h3>;
          if (block === '---') return <hr key={index} />;
          if (block.startsWith('- ')) return <ul key={index}>{block.split(/\r?\n/).map((line, item) => <li key={item}>{inline(line.slice(2))}</li>)}</ul>;
          return <p key={index}>{inline(block)}</p>;
        })}
        <a className="terms-to-top" href={`#${documentId}-top`}><ArrowUp size={16} />Uz sākumu</a>
      </article>
    </main>
    <footer className="terms-footer">PROPFOLIO · <a href="mailto:propfolio.lv@gmail.com">propfolio.lv@gmail.com</a><CookieSettingsLink /></footer>
  </div>;
}

