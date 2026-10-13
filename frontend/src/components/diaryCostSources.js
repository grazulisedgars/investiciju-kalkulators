export function periodFromDates(start, end) {
    if (!start || !end || end < start) return null;
    const [y1,m1] = start.split('-').map(Number), [y2,m2] = end.split('-').map(Number);
    const total = (y2-y1)*12+m2-m1+1;
    return { renovation_years: Math.floor(total/12), renovation_months: total%12 };
}

export function validateDiarySources(v,scope="all") {
    const checkRepair=scope!=="utilities",checkUtilities=scope!=="repair";
    if (!!v.renovation_start_date !== !!v.renovation_end_date) return 'Norādi renovācijas sākumu un beigas.';
    if (v.renovation_start_date && v.renovation_end_date < v.renovation_start_date) return 'Renovācijas beigas nevar būt pirms sākuma.';
    if (checkRepair && v.repair_source === 'diary' && v.renovation_required!==false && !v.renovation_start_date) return 'Remonta dienasgrāmatas izmaksām norādi renovācijas datumus.';
    const start=v.utilities_start_date || v.renovation_start_date, end=v.utilities_end_date || v.renovation_end_date;
    if(checkUtilities && v.utilities_source==='diary' && (!start || !end))return 'Norādi komunālo maksājumu atlases periodu.';
    if(checkUtilities && (!!v.utilities_start_date!==!!v.utilities_end_date))return 'Norādi abus komunālo maksājumu atlases datumus.';
    if(checkUtilities && start && end<start)return 'Komunālo maksājumu perioda beigas nevar būt pirms sākuma.';
    const period = periodFromDates(v.renovation_start_date,v.renovation_end_date);
    if (period && period.renovation_years*12+period.renovation_months>611) return 'Renovācijas periods ir pārāk garš.';
    return '';
}

export function numericAnalysis(v) {
    const preserved = ['repair_source','utilities_source','repair_entry_ids','utility_entry_ids','renovation_required'];
    const dates = ['renovation_start_date','renovation_end_date','utilities_start_date','utilities_end_date'];
    const output = Object.fromEntries(Object.entries(v).map(([key,value]) => [key,
        preserved.includes(key) ? value : dates.includes(key) ? value || null : key === 'future_price_per_m2' && (value === '' || value == null) ? null : Number(value)]));
    if(v.renovation_required===false)Object.assign(output,{renovation_cost_per_m2:0,repair_source:'manual',repair_entry_ids:[],renovation_start_date:null,renovation_end_date:null,renovation_years:0,renovation_months:0});
    return { ...output, ...(periodFromDates(output.renovation_start_date,output.renovation_end_date) || {}), utilities_start_date:v.utilities_start_date || output.renovation_start_date || null,utilities_end_date:v.utilities_end_date || output.renovation_end_date || null };
}

export function diaryCostSources(v, entries) {
    const period = periodFromDates(v.renovation_start_date,v.renovation_end_date);
    const utilStart=v.utilities_start_date || v.renovation_start_date,utilEnd=v.utilities_end_date || v.renovation_end_date;
    const anchor=[v.renovation_start_date,v.utilities_source==='diary'?utilStart:null].filter(Boolean).sort()[0];
    const selected = v.repair_entry_ids == null ? null : new Set(v.repair_entry_ids);
    const repairRows = period ? entries.filter(e=>e.entry_type==='expense' && e.entry_date>=v.renovation_start_date) : [];
    const used = repairRows.filter(e=>selected === null ? e.entry_date<=v.renovation_end_date : selected.has(e.id));
    const utilityRows = periodFromDates(utilStart,utilEnd) ? entries.filter(e=>e.entry_type==='utility' && e.entry_date>=utilStart) : [];
    const utilitySelection = v.utility_entry_ids == null ? null : new Set(v.utility_entry_ids);
    const usedUtilities = utilityRows.filter(e=>utilitySelection === null ? e.entry_date<=utilEnd : utilitySelection.has(e.id));
    const cents = list => list.reduce((sum,e)=>sum+Math.round(Number(e.amount || 0)*100),0);
    const utilitiesByMonth = {}, repairByMonth = {};
    for (const row of usedUtilities) {
        const [year,month] = row.entry_date.split('-').map(Number);
        const [startYear,startMonth] = anchor.split('-').map(Number);
        const index = (year-startYear)*12+month-startMonth+1;
        utilitiesByMonth[index] = Math.round(((utilitiesByMonth[index] || 0)+Number(row.amount || 0))*100)/100;
    }
    for (const row of used) {
        const [year,month] = row.entry_date.split('-').map(Number);
        const [startYear,startMonth] = anchor.split('-').map(Number);
        const index = (year-startYear)*12+month-startMonth+1;
        repairByMonth[index] = Math.round(((repairByMonth[index] || 0)+Number(row.amount || 0))*100)/100;
    }
    return { repairTotal:cents(used)/100, repairCount:used.length, repairRows, utilityRows, usedRepairIds:used.map(e=>e.id),
        utilitiesTotal:cents(usedUtilities)/100, utilitiesCount:usedUtilities.length, utilitiesByMonth, repairByMonth, usedUtilityIds:usedUtilities.map(e=>e.id) };
}
