import LoadingState from './components/LoadingState.jsx'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import EntryPage from './EntryPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<LoadingState />}><EntryPage /></Suspense>
  </StrictMode>,
)
