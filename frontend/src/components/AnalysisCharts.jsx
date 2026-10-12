import { useEffect, useRef, useState } from "react";

const money = value => value.toLocaleString("lv-LV", { maximumFractionDigits: 0 }) + " €";

export function CashFlowChart({ results, annualBars = false, receivedRent = null, progressLabel = "Saņemtā īre", rentedMonths = null }) {
    const ref = useRef(null);
    const [width, setWidth] = useState(360);
    const [progressPinned, setProgressPinned] = useState(false);
    const [paybackPinned, setPaybackPinned] = useState(false);
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    const height = 265, left = 60, right = 32, top = 20, bottom = 35;
    const years = 10;
    const points = results.timeline ? results.timeline.filter(item => item.year <= 10).map(item => ({ year: item.year, value: item.cumulative, cash: item.cash, gross: item.gross })) : Array.from({ length: 11 }, (_, year) => ({ year, value: -results.investment + results.net_annual * year }));
    const curvePoints = results.monthly_timeline ? results.monthly_timeline.filter(item => item.year <= 10).map(item => ({ year: item.year, value: item.cumulative })) : points;
    const values = [...curvePoints.map(p => p.value), ...points.map(p => p.cash ?? 0), 0, ...(annualBars ? [results.net_annual, results.gross_annual] : [])];
    // Vienmērīgas ass iedaļas un precīza nulles līnija.
    const range = Math.max(...values) - Math.min(...values);
    const magnitude = 10 ** Math.floor(Math.log10(Math.max(range / 5, 1)));
    const tick = Math.ceil(range / 5 / magnitude) * magnitude;
    const lo = Math.floor(Math.min(...values) / tick) * tick, hi = Math.ceil(Math.max(...values) / tick) * tick, padding = 0;
    const ticks = Array.from({ length: Math.round((hi-lo)/tick)+1 }, (_, i) => lo+i*tick);
    const plotStart = left + 14, plotEnd = width-right-14;
    const x = year => plotStart + year / years * (plotEnd-plotStart);
    const y = value => top + (hi+padding-value)/(hi-lo+2*padding)*(height-top-bottom);
    const tickYears = width < 350 ? [0, 5, 10] : [0, 2, 4, 6, 8, 10];
    const line = curvePoints.map((p, i) => `${i ? "L" : "M"}${x(p.year)},${y(p.value)}`).join(" ");
    let progressYear = receivedRent !== null && results.net_annual > 0 ? receivedRent / results.net_annual : null;
    const initial = results.chart_initial ?? results.investment;
    const progressValue = receivedRent === null ? null : -initial + receivedRent;
    if (results.timeline && receivedRent !== null) {
        progressYear = receivedRent === 0 ? 0 : null;
        for (let i = 1; i < curvePoints.length && progressYear === null; i++) {
            const previous = curvePoints[i-1], next = curvePoints[i];
            if (next.value !== previous.value && progressValue >= Math.min(previous.value,next.value) && progressValue <= Math.max(previous.value,next.value)) progressYear = previous.year + (progressValue-previous.value)/(next.value-previous.value);
        }
    }
    const showProgress = progressYear !== null && progressYear >= 0 && progressYear <= years;

    const bubbleWidth = Math.min(174, width-left-right);
    const paybackBubbleWidth = Math.min(240, width-left-right);
    const bubbleX = showProgress ? Math.max(left, Math.min(width-right-bubbleWidth, x(progressYear)-bubbleWidth/2)) : 0;
    const bubbleY = showProgress ? Math.max(top, Math.min(height-bottom-52, y(progressValue)-62)) : 0;
    return <div className="advanced-chart-container" ref={ref}>
        {annualBars && <div className="analysis-chart-legend"><span><i className="legend-investment" />Ieguldītā nauda</span><span><i className="legend-net" />Atlikums pēc maksājumiem</span><span><i className="legend-gross" />Īre pirms izdevumiem</span><span><i className="legend-cumulative" />Ieguldījuma atgūšana</span></div>}
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={annualBars ? "Gada neto naudas plūsma un kumulatīvais atlikums desmit gados" : "Ieguldījuma atgūšanas atlikums desmit gados"}>
            {ticks.map(v => <g key={v}><line className="analysis-grid" x1={left} x2={width-right} y1={y(v)} y2={y(v)} /><text x={left-8} y={y(v)+4} textAnchor="end">{v === 0 ? '0' : `${(v/1000).toLocaleString("lv-LV", { maximumFractionDigits: 1 })}k`}</text></g>)}
            <line className="analysis-zero" x1={left} x2={width-right} y1={y(0)} y2={y(0)} />
            {annualBars && points.map(p => {
                const net = p.cash ?? (p.year === 0 ? -results.investment : results.net_annual);
                const gross = p.year === 0 ? -(results.chart_initial ?? results.investment) : p.gross ?? results.gross_annual;
                const barWidth = Math.min(12, (width-left-right)/32);
                if (p.year === 0) return <rect key={p.year} className="analysis-bar-investment" x={x(0)-barWidth} y={Math.min(y(0),y(net))} width={barWidth*2} height={Math.abs(y(0)-y(net))}><title>Ieguldītā nauda: {money(-net)}</title></rect>;
                return <g key={p.year}><rect className="analysis-bar-gross" x={x(p.year)} y={Math.min(y(0),y(gross))} width={barWidth} height={Math.abs(y(0)-y(gross))}><title>{p.year === 0 ? "Sākums: ieguldītā summa" : `${p.year}. gads: īre pirms izdevumiem`}: {money(gross)}</title></rect><rect className="analysis-bar" x={x(p.year)-barWidth} y={Math.min(y(0),y(net))} width={barWidth} height={Math.abs(y(0)-y(net))}><title>{p.year === 0 ? "Sākums: ieguldītā summa" : `${p.year}. gads: atlikums pēc maksājumiem`}: {money(net)}</title></rect></g>;
            })}
            <path className="analysis-line" d={line} />
            {points.map(p => <circle key={p.year} className="analysis-dot" cx={x(p.year)} cy={y(p.value)} r="3"><title>{p.year}. gads: atlikums {money(p.value)}</title></circle>)}
            {results.payback !== null && results.payback <= 10 && <g className={`analysis-payback-marker ${paybackPinned ? "is-pinned" : ""}`}>
                <circle className="analysis-dot" cx={x(results.payback)} cy={y(0)} r="5" />
                <text className="analysis-label" x={x(results.payback)} y={y(0)-14} textAnchor="middle">{results.payback.toLocaleString("lv-LV", { maximumFractionDigits: 1 })} gadi</text>
                <circle cx={x(results.payback)} cy={y(0)} r="8" fill="transparent" role="button" tabIndex={0} aria-label={`${results.loan_amount !== undefined ? "Paša kapitāls" : "Ieguldītais kapitāls"} tiks atgūts pēc ${results.payback.toLocaleString("lv-LV", { maximumFractionDigits: 1 })} gadiem pie ievadītajiem pieņēmumiem.`} aria-pressed={paybackPinned} onClick={() => setPaybackPinned(value => !value)} onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); setPaybackPinned(value => !value); } else if (event.key === "Escape") setPaybackPinned(false); }} />
                <g className="analysis-payback-tooltip" pointerEvents="none" transform={`translate(${Math.max(left, Math.min(width-right-paybackBubbleWidth, x(results.payback)-paybackBubbleWidth/2))},${Math.max(top, y(0)-105)})`}>
                    <foreignObject width={paybackBubbleWidth} height="100"><div xmlns="http://www.w3.org/1999/xhtml" className="analysis-payback-box"><strong>Ieguldītā kapitāla atmaksa</strong><span>Pie ievadītajiem pieņēmumiem pēc {results.payback.toLocaleString("lv-LV", { maximumFractionDigits: 1 })} gadiem atgūsi ieguldīto summu.</span></div></foreignObject>
                </g>
            </g>}
            {showProgress && <g className={`analysis-rent-marker ${progressPinned ? "is-pinned" : ""}`}>
                <circle cx={x(progressYear)} cy={y(progressValue)} r="12" fill="#d18a18" opacity=".2" />
                <circle cx={x(progressYear)} cy={y(progressValue)} r="6" fill="#d18a18" stroke="white" strokeWidth="2" />
                <circle className="analysis-rent-hit" cx={x(progressYear)} cy={y(progressValue)} r="20" fill="transparent" role="button" tabIndex={0} aria-label={`Pašreizējais progress. ${progressLabel} ${money(receivedRent)}; atlikums ${money(progressValue)}, pirms nodokļiem un izdevumiem.`} aria-pressed={progressPinned} onClick={() => setProgressPinned(value => !value)} onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); setProgressPinned(value => !value); } else if (event.key === "Escape") setProgressPinned(false); }} />
                <g className="analysis-rent-tooltip" pointerEvents="none"><line className="analysis-grid" strokeDasharray="3 4" x1={x(progressYear)} x2={x(progressYear)} y1={y(progressValue)} y2={height-bottom} /><rect className="analysis-rent-bubble" x={bubbleX} y={bubbleY} width={bubbleWidth} height="44" rx="7" /><text x={bubbleX+10} y={bubbleY+17}>Šobrīd · {money(receivedRent)}</text><text x={bubbleX+10} y={bubbleY+33}>{progressValue >= 0 ? "Virs ieguldījuma " : "Atlikums "}{money(progressValue)}</text></g>
            </g>}
            {tickYears.map(year => <text key={year} x={x(year)} y={height-22} textAnchor={year === 0 ? "start" : year === 10 ? "end" : "middle"}>{year}</text>)}
            <text x={width-right} y={height-3} textAnchor="end">Gadi</text>
        </svg>
        {Number(rentedMonths) === 0 && rentedMonths !== null && <p className="advanced-scenario-note">Izīrēti 0 mēneši nozīmē, ka īres nav arī pēc renovācijas. Negatīvie stabiņi rāda maksājumus, kurus sedz tu. Lai pēc renovācijas sāktos ienākumi, norādi izīrētos mēnešus pēc renovācijas.</p>}
        <details className="analysis-chart-help"><summary>Kā lasīt šo grafiku?</summary><ol className="analysis-chart-explanation">
            <li><strong>Ieguldītā nauda.</strong> Summa, ko esi ieguldījis un vēl neesi atguvis. Tāpēc grafiks sākas mīnusā.</li>
            {annualBars && <li><strong>Īre pirms izdevumiem</strong> — gada īres ienākumi, pirms tiek atskaitīts nodoklis un izdevumi. Grafikā tie ir gaiši zaļie stabiņi.</li>}
            {annualBars && <li><strong>Atlikums pēc maksājumiem</strong> — īres ienākumi mīnus nodoklis{results.loan_amount !== undefined ? ", īpašnieka izdevumi un kredītmaksājumi" : " un īpašnieka izdevumi"}. Ja stabiņš ir zem 0 €, šī summa jāsedz tev. Grafikā tie ir zaļie stabiņi.</li>}
            <li><strong>Līnija</strong> — prognoze, kā pamazām atgūsti ieguldīto naudu. Kad tā sasniedz 0 €, sākotnējais ieguldījums ir atgūts.</li>
            <li><strong>Lielais zaļais punkts</strong> — prognozētais ieguldījuma atgūšanas brīdis.{results.loan_amount !== undefined && " Tas nenozīmē, ka kredīts ir pilnībā atmaksāts."}{results.payback === null ? " Pie šiem pieņēmumiem ieguldījums neatmaksājas, tāpēc punkta nav." : results.payback > 10 ? " Šajā scenārijā tas ir pēc vairāk nekā 10 gadiem, tāpēc punkts ir ārpus grafika." : ""}</li>
            <li><strong>Dzeltenais punkts</strong> — progress pēc dienasgrāmatā ievadītās saņemtās īres{results.loan_amount !== undefined ? " un kredītmaksājumiem. No saņemtās īres atņem visus reģistrētos kredītmaksājumus." : "."} Nodoklis un pārējie īpašnieka izdevumi vēl nav atskaitīti. Punkta vieta rāda sasniegto summu, nevis pagājušo laiku.{receivedRent !== null && !showProgress && " Pašreizējā summa ir ārpus attēlotās līknes, tāpēc punkts grafikā nav redzams."}</li>
        </ol></details>
    </div>;
}

export function InvestmentSplit({ inputs, results }) {
    const segments = [["Pirkuma cena", inputs.purchase_price], ["Remonts", results.renovation], ["Iegādes izdevumi", results.acquisition]];
    const a = segments[0][1]/results.investment*100, b = a+segments[1][1]/results.investment*100;
    return <div className="analysis-split">
        <div className="analysis-donut" style={{ background: `conic-gradient(#126a4e 0% ${a}%, #66ae91 ${a}% ${b}%, #c1dacd ${b}% 100%)` }} role="img" aria-label={segments.map(([label, amount]) => `${label}: ${money(amount)}`).join(", ")}><div><strong>{money(results.investment)}</strong><small>Kopējais ieguldījums</small></div></div>
        <div>{segments.map(([label, amount], i) => <div className="analysis-split-row" key={label}><span><i className={`split-color-${i}`} />{label}</span><strong>{(amount/results.investment*100).toLocaleString("lv-LV", { maximumFractionDigits: 1 })}%</strong><small>{money(amount)}</small></div>)}</div>
    </div>;
}
