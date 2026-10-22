import CookieSettings from "./components/CookieSettings";
import {lazy} from 'react';
import Terms from './components/Terms.jsx';
import Privacy from './components/Privacy.jsx';

const App = lazy(() => import('./App.jsx'));

export default function EntryPage() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const page = path === '/terms' ? <Terms /> : path === '/privacy' ? <Privacy /> : <App />;
  return <>{page}<CookieSettings /></>;
}
