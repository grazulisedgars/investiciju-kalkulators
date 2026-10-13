import {diaryCostSources} from './diaryCostSources';

// Vienīgā faktisko datu atskaite ir ieraksta datums, nevis prognozes līknes krustpunkts.
export function actualChartProgress(inputs,results,entries) {
    const valid=entries.filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.entry_date || '') && Number.isFinite(Number(e.amount)) && Number(e.amount)>=0);
    const mortgage=results.loan_amount!==undefined;
    const payments=valid.filter(e=>e.entry_type==='rent' || (mortgage && e.entry_type==='loan'));
    if(!payments.length)return null;
    const sources=diaryCostSources(inputs,valid);
    const repairIds=new Set(inputs.repair_source==='diary'?sources.usedRepairIds:[]);
    const utilityIds=new Set(inputs.utilities_source==='diary'?sources.usedUtilityIds:[]);
    const relevant=valid.filter(e=>e.entry_type==='rent' || (mortgage && e.entry_type==='loan') || repairIds.has(e.id) || utilityIds.has(e.id));
    const date=relevant.map(e=>e.entry_date).sort().at(-1);
    const startDate=[inputs.renovation_start_date,inputs.utilities_source==='diary'?(inputs.utilities_start_date || inputs.renovation_start_date):null].filter(Boolean).sort()[0] || relevant.map(e=>e.entry_date).sort()[0];
    const [year,month,day]=date.split('-').map(Number),[startYear,startMonth]=startDate.split('-').map(Number);
    const days=new Date(Date.UTC(year,month,0)).getUTCDate();
    const elapsedYears=((year-startYear)*12+month-startMonth+(day-1)/days)/12;
    const cents=rows=>rows.reduce((sum,e)=>sum+Math.round(Number(e.amount)*100),0)/100;
    const rent=cents(relevant.filter(e=>e.entry_type==='rent'));
    const loan=cents(relevant.filter(e=>e.entry_type==='loan'));
    const utilities=cents(relevant.filter(e=>utilityIds.has(e.id)));
    const repair=inputs.repair_source==='diary'?cents(relevant.filter(e=>repairIds.has(e.id))):results.renovation;
    const capital=results.own_capital ?? results.investment;
    // No kopējā kapitāla izņem remontu, tad ieskaita to vienreiz atbilstoši avotam.
    const value=-(capital-results.renovation)-repair-utilities-loan+rent;
    return {year:elapsedYears,value,date,startDate,rent,loan,utilities,repair};
}
