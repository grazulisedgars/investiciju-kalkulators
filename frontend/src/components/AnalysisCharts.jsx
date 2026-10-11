import { useEffect, useRef, useState } from "react";

const money = value => value.toLocaleString("lv-LV", { maximumFractionDigits: 0 }) + " €";

export function CashFlowChart({ results, annualBars = false }) {
    const ref = useRef(null);
    const [width, setWidth] = useState(360);
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    const height = 265, left = 48, right = 20, top = 20, bottom = 35;
    const years = 10;
    const points = Array.from({ length: 11 }, (_, year) => ({ year, value: -results.investment + results.net_annual * year }));
    const values = [...points.map(p => p.value), 0, ...(annualBars ? [results.net_annual, results.gross_annual] : [])];
    // Vienmērīgas ass iedaļas un precīza nulles līnija.
    const range = Math.max(...values) - Math.min(...values);
    const magnitude = 10 ** Math.floor(Math.log10(Math.max(range / 5, 1)));
    const tick = Math.ceil(range / 5 / magnitude) * magnitude;
    const lo = Math.floor(Math.min(...values) / tick) * tick, hi = Math.ceil(Math.max(...values) / tick) * tick, padding = 0;
    const ticks = Array.from({ length: Math.round((hi-lo)/tick)+1 }, (_, i) => lo+i*tick);
    const x = year => left + year / years * (width-left-right);
    const y = value => top + (hi+padding-value)/(hi-lo+2*padding)*(height-top-bottom);
    const tickYears = width < 350 ? [0, 5, 10] : [0, 2, 4, 6, 8, 10];
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.year)},${y(p.value)}`).join(" ");
    return <div className="advanced-chart-container" ref={ref}>
        {annualBars && <div className="analysis-chart-legend"><span><i className="legend-net" />Neto naudas plūsma</span><span><i className="legend-gross" />Bruto īres ieņēmumi</span><span><i className="legend-cumulative" />Kumulatīvā naudas plūsma</span></div>}
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={annualBars ? "Gada neto naudas plūsma un kumulatīvais atlikums desmit gados" : "Ieguldījuma atgūšanas atlikums desmit gados"}>
            {ticks.map(v => <g key={v}><line className="analysis-grid" x1={left} x2={width-right} y1={y(v)} y2={y(v)} /><text x={left-8} y={y(v)+4} textAnchor="end">{v === 0 ? '0' : `${(v/1000).toLocaleString("lv-LV", { maximumFractionDigits: 1 })}k`}</text></g>)}
            <line className="analysis-zero" x1={left} x2={width-right} y1={y(0)} y2={y(0)} />
            {annualBars && points.map(p => {
                const net = p.year === 0 ? -results.investment : results.net_annual;
                const gross = p.year === 0 ? -results.investment : results.gross_annual;
                const barWidth = Math.min(12, (width-left-right)/32);
                return <g key={p.year}><rect className="analysis-bar-gross" x={x(p.year)} y={Math.min(y(0),y(gross))} width={barWidth} height={Math.abs(y(0)-y(gross))}><title>{p.year}. gads: {money(gross)}</title></rect><rect className="analysis-bar" x={x(p.year)-barWidth} y={Math.min(y(0),y(net))} width={barWidth} height={Math.abs(y(0)-y(net))}><title>{p.year}. gads: neto plūsma {money(net)}</title></rect></g>;
            })}
            <path className="analysis-line" d={line} />
            {points.map(p => <circle key={p.year} className="analysis-dot" cx={x(p.year)} cy={y(p.value)} r="3"><title>{p.year}. gads: atlikums {money(p.value)}</title></circle>)}
            {results.payback !== null && results.payback <= 10 && <g><circle className="analysis-dot" cx={x(results.payback)} cy={y(0)} r="5" /><text className="analysis-label" x={x(results.payback)} y={y(0)-14} textAnchor="middle">{results.payback.toLocaleString("lv-LV", { maximumFractionDigits: 1 })} gadi</text></g>}
            {tickYears.map(year => <text key={year} x={x(year)} y={height-22} textAnchor={year === 0 ? "start" : year === 10 ? "end" : "middle"}>{year}</text>)}
            <text x={width-right} y={height-3} textAnchor="end">Gadi</text>
        </svg>
        <p className="advanced-note">{annualBars ? "0. gadā: sākotnējais ieguldījums. Līnija: uzkrātā neto plūsma pēc ieguldījuma." : results.payback === null ? "Pie šī scenārija ieguldījums neatmaksājas." : results.payback > 10 ? "Atmaksāšanās punkts ir ārpus 10 gadu grafika." : "0 €: sākotnējais ieguldījums ir atgūts."}</p>
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
