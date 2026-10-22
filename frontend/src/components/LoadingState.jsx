import './LoadingState.css';

export default function LoadingState() {
  return <div className="propfolio-loading" role="status" aria-live="polite" aria-atomic="true">
    <div className="propfolio-loading-content">
      <div className="propfolio-loading-scene" aria-hidden="true">
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="82" r="64" className="loading-halo"/>
          <g className="loading-crane" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M151 132V20M143 132h16M151 20l-52 15h78l-26-15ZM151 35l-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12 13M151 35v97"/>
            <path d="M107 35v31" className="loading-cable"/>
            <path d="M103 66q4 7 8 0" className="loading-hook"/>
          </g>
          <path d="M42 134h119" stroke="#c6dfd2" strokeWidth="3" strokeLinecap="round"/>
          <g className="loading-house" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path pathLength="1" d="M54 132h75" className="loading-build loading-foundation"/>
            <path pathLength="1" d="M62 129V88M121 129V88" className="loading-build loading-walls"/>
            <path pathLength="1" d="m51 89 40-33 41 33" className="loading-build loading-roof"/>
            <path pathLength="1" d="M84 130v-25h17v25M71 92h9v9h-9zM106 92h9v9h-9z" className="loading-build loading-details"/>
          </g>
          <rect x="98" y="71" width="18" height="10" rx="2" className="loading-brick"/>
          <circle cx="43" cy="114" r="3" fill="#d9eae1"/>
          <path d="M153 75h8M157 71v8" stroke="#9ac5b0" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="propfolio-loading-title">Būvējam skaidrību</p>
      <p className="propfolio-loading-caption">Ielādējam PROPFOLIO<span className="loading-dots" aria-hidden="true"><i/><i/><i/></span></p>
    </div>
  </div>;
}
