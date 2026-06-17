/* eslint-disable */
// ── VERIFICA ──────────────────────────────────────────────────────────────
function runVerifica(corsi,anagraficaCorsi,tutors,tutEvents){
  const errors=[],corsiById={},corsiByName={};
  corsi.forEach(co=>corsiById[co.id]=co);
  anagraficaCorsi.forEach(a=>{if(corsiById[a.id])corsiByName[a.nome]=corsiById[a.id];});
  function safeEvs(months){return Object.entries(months).map(([mk,evs])=>({mk,evs:Array.isArray(evs)?evs:[]}));}
  // orfano
  for(const[tid,months]of Object.entries(tutEvents)){for(const{mk,evs}of safeEvs(months)){for(const ev of evs){if(!corsiByName[ev.name]){const t=tutors.find(x=>x.id===tid);errors.push({type:"orfano",monthKey:mk,evId:ev.id,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" del ${fmtDayMonth(ev.day,mk)} non in anagrafica.`,detail:"Slot orfano: il corso non esiste in anagrafica.",day:ev.day});}}}}
  // fuori_avviso, fuori_sessione, fuori_orario
  for(const[tid,months]of Object.entries(tutEvents)){for(const{mk,evs}of safeEvs(months)){for(const ev of evs){const co=corsiByName[ev.name];if(!co)continue;const coDay=(co.events||[]).find(e=>e.month===mk&&e.day===ev.day);const t=tutors.find(x=>x.id===tid);if(!coDay){const altCoNames=Object.entries(corsiByName).filter(([n,co])=>n!==ev.name&&(co.events||[]).some(e=>e.month===mk&&e.day===ev.day)).map(([n])=>n);if(altCoNames.length>0)errors.push({type:"fuori_avviso",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" del ${fmtDayMonth(ev.day,mk)} non ha sessioni — il giorno è coperto da: ${altCoNames.join(", ")}.`,detail:"Possibile errore di assegnazione corso."});else errors.push({type:"fuori_sessione",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" del ${fmtDayMonth(ev.day,mk)} non rientra in nessuna sessione pianificata.`,detail:"Nessun corso ha sessioni programmate in questo giorno."});}else if(ev.start<coDay.start||ev.end>coDay.end){const altFitting=Object.entries(corsiByName).filter(([n,co])=>n!==ev.name&&(co.events||[]).some(e=>e.month===mk&&e.day===ev.day&&ev.start>=e.start&&ev.end<=e.end)).map(([n])=>n);if(altFitting.length>0)errors.push({type:"fuori_avviso",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" del ${fmtDayMonth(ev.day,mk)} ( ${fmt(ev.start)}–${fmt(ev.end)} ) rientra nella sessione di: ${altFitting.join(", ")}.`,detail:"Possibile errore di assegnazione corso."});else errors.push({type:"fuori_orario",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot del ${fmtDayMonth(ev.day,mk)} fuori orario (${fmt(ev.start)}–${fmt(ev.end)}).`,detail:`Orario sessione: ${fmt(coDay.start)}–${fmt(coDay.end)}`});}}}}
  // sovrapposizione
  for(const[tid,months]of Object.entries(tutEvents)){for(const{mk,evs}of safeEvs(months)){const t=tutors.find(x=>x.id===tid);for(let i=0;i<evs.length;i++)for(let j=i+1;j<evs.length;j++){const a=evs[i],b=evs[j];if(a.day===b.day&&a.start<b.end&&b.start<a.end)errors.push({type:"sovrapposizione",monthKey:mk,evId:a.id,day:a.day,msg:`Tutor "${t?.cognome} ${t?.nome}": sovrapposizione il ${fmtDayMonth(a.day,mk)} tra "${a.name}" e "${b.name}".`,detail:`${fmt(a.start)}–${fmt(a.end)} vs ${fmt(b.start)}–${fmt(b.end)}`});}}}
  // eccedenza, durata
  for(const ana of anagraficaCorsi){const co=corsiById[ana.id];const totAv=co?(co.events||[]).reduce((s,e)=>s+(e.ore||0),0):0;let totTut=0;for(const[,months]of Object.entries(tutEvents))for(const{evs}of safeEvs(months))for(const ev of evs)if(ev.name===ana.nome)totTut+=(ev.ore||0);if(totTut>totAv)errors.push({type:"eccedenza",monthKey:null,msg:`Corso "${ana.nome}": ore tutoraggio (${totTut}h) superano ore corso (${totAv}h).`,detail:`Eccedenza: ${totTut-totAv}h`});if(ana.durataOre&&totAv!==ana.durataOre)errors.push({type:"durata",monthKey:null,msg:`Corso "${ana.nome}": ore nel calendario (${totAv}h) ≠ durata da bando (${ana.durataOre}h).`,detail:`Differenza: ${Math.abs(totAv-ana.durataOre)}h`});}
  // giornata_lunga
  for(const[tid,months]of Object.entries(tutEvents)){for(const{mk,evs}of safeEvs(months)){const t=tutors.find(x=>x.id===tid);const byDay={};for(const ev of evs){if(!byDay[ev.day])byDay[ev.day]=0;byDay[ev.day]+=ev.ore||0;}for(const[day,totH]of Object.entries(byDay)){if(totH>8)errors.push({type:"giornata_lunga",monthKey:mk,day:Number(day),msg:`Tutor "${t?.cognome} ${t?.nome}": giornata >8h il ${fmtDayMonth(Number(day),mk)} (${totH}h).`,detail:"Superato limite giornaliero consigliato."});}}}
  // domenica — segnalata come errore per tutor e corsi (il sabato è ammesso)
  for(const[tid,months]of Object.entries(tutEvents)){for(const{mk,evs}of safeEvs(months)){const mObj=MONTHS.find(m=>m.key===mk);if(!mObj)continue;const t=tutors.find(x=>x.id===tid);for(const ev of evs){const d=new Date(mObj.year,mObj.month,ev.day).getDay();if(d===0)errors.push({type:"domenica",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot di domenica il ${fmtDayMonth(ev.day,mk)}.`,detail:"Slot inserito di domenica."});}}}
  for(const ana of anagraficaCorsi){const co=corsiById[ana.id];if(!co)continue;for(const ev of (co.events||[])){const mk=ev.month||"";const mObj=MONTHS.find(m=>m.key===mk);if(!mObj)continue;const d=new Date(mObj.year,mObj.month,ev.day).getDay();if(d===0)errors.push({type:"domenica",monthKey:mk,evId:ev.id,day:ev.day,msg:`Corso "${ana.nome}": sessione di domenica il ${fmtDayMonth(ev.day,mk)}.`,detail:"Sessione inserita di domenica."});}}
  // orario_zero — slot/sessioni con orario non valido (start>=end, tipicamente 00:00-00:00)
  // fuori_fascia — slot/sessioni con orario prima delle 08:00 o dopo le 20:00 (fuori dalla griglia visibile)
  for(const[tid,months]of Object.entries(tutEvents)){for(const{mk,evs}of safeEvs(months)){const t=tutors.find(x=>x.id===tid);for(const ev of evs){if(ev.end<=ev.start)errors.push({type:"orario_zero",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name||"?"}" del ${fmtDayMonth(ev.day,mk)} ha orario non valido (${fmt(ev.start)}–${fmt(ev.end)}).`,detail:"Orario non valido: correggere o eliminare lo slot."});else if(ev.start<8||ev.end>20)errors.push({type:"fuori_fascia",monthKey:mk,evId:ev.id,day:ev.day,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name||"?"}" del ${fmtDayMonth(ev.day,mk)} è fuori fascia (${fmt(ev.start)}–${fmt(ev.end)}).`,detail:"Orario fuori dalla fascia visibile 08:00–20:00."});}}}
  for(const ana of anagraficaCorsi){const co=corsiById[ana.id];if(!co)continue;for(const ev of (co.events||[])){const mk=ev.month||"";if(ev.end<=ev.start)errors.push({type:"orario_zero",monthKey:mk,evId:ev.id,day:ev.day,msg:`Corso "${ana.nome}": sessione del ${fmtDayMonth(ev.day,mk)} ha orario non valido (${fmt(ev.start)}–${fmt(ev.end)}).`,detail:"Orario non valido: correggere o eliminare la sessione."});else if(ev.start<8||ev.end>20)errors.push({type:"fuori_fascia",monthKey:mk,evId:ev.id,day:ev.day,msg:`Corso "${ana.nome}": sessione del ${fmtDayMonth(ev.day,mk)} è fuori fascia (${fmt(ev.start)}–${fmt(ev.end)}).`,detail:"Orario fuori dalla fascia visibile 08:00–20:00."});}}
  // tutor_senza_slot
  const corsiNamesSet=new Set(anagraficaCorsi.map(a=>a.nome));
  for(const t of tutors){let totalSlots=0,hasLinkedSlot=false;for(const{evs}of safeEvs(tutEvents[t.id]||{})){totalSlots+=evs.length;if(evs.some(ev=>corsiNamesSet.has(ev.name)))hasLinkedSlot=true;}if(totalSlots===0)errors.push({type:"tutor_senza_slot",monthKey:null,msg:`Tutor "${t.cognome} ${t.nome}" non è mai presente nel calendario.`,detail:"Tutor presente in anagrafica ma senza sessioni."});else if(!hasLinkedSlot)errors.push({type:"tutor_senza_slot",monthKey:null,msg:`Tutor "${t.cognome} ${t.nome}" presente ma non collegato ad alcun corso in anagrafica.`,detail:"Tutti gli slot fanno riferimento a corsi non in anagrafica."});}
  // avviso_senza_sessioni
  for(const ana of anagraficaCorsi){const co=corsiById[ana.id];if(!co||!(co.events||[]).length)errors.push({type:"corso_senza_sessioni",monthKey:null,msg:`Corso "${ana.nome}" non ha sessioni nel calendario.`,detail:"Nessuna data inserita per questo corso."});}
  return errors;
}

const VERIFICA_CATS=[
  {type:"sovrapposizione",label:"Sovrapposizioni",icon:"zap",tone:"danger"},
  {type:"fuori_orario",label:"Fuori orario",icon:"clock",tone:"warning"},
  {type:"fuori_avviso",label:"Corso errato",icon:"arrowRight",tone:"warning"},
  {type:"fuori_sessione",label:"Fuori da ogni sessione",icon:"calendar",tone:"danger"},
  {type:"eccedenza",label:"Ore eccedenti",icon:"trending",tone:"warning"},
  {type:"durata",label:"Durata non corrispondente",icon:"clipboard",tone:"info"},
  {type:"orfano",label:"Slot orfani",icon:"user",tone:"warning"},
  {type:"domenica",label:"Slot di domenica",icon:"sun",tone:"warning"},
  {type:"tutor_senza_slot",label:"Tutor senza slot",icon:"users",tone:"info"},
  {type:"corso_senza_sessioni",label:"Corso senza sessioni",icon:"briefcase",tone:"info"},
  {type:"giornata_lunga",label:"Giornata >8h",icon:"alert",tone:"warning"},
  {type:"orario_zero",label:"Orario non valido",icon:"clock",tone:"danger"},
  {type:"fuori_fascia",label:"Fuori fascia oraria",icon:"clock",tone:"warning"},
];

function VerificaScreen({corsi=[],tutors=[],tutEvents={},anagraficaCorsi=[],onNavigateToError}){
  const[errors,setErrors]=useState(()=>runVerifica(corsi,anagraficaCorsi,tutors,tutEvents));
  const[lastRun,setLastRun]=useState(()=>new Date());
  const[activeCats,setActiveCats]=useState(new Set(VERIFICA_CATS.map(c=>c.type)));
  const[catExpanded,setCatExpanded]=useState(false);
  const[selAv,setSelAv]=useState("");
  const[selTutor,setSelTutor]=useState("");
  const[sortBy,setSortBy]=useState("date");

  function riesegui(){setErrors(runVerifica(corsi,anagraficaCorsi,tutors,tutEvents));setLastRun(new Date());}
  function toggleCat(type){setActiveCats(p=>{const n=new Set(p);n.has(type)?n.delete(type):n.add(type);return n;});}

  function dateRank(e){const mi=e.monthKey?MONTHS.findIndex(m=>m.key===e.monthKey):Infinity;return[mi===undefined||mi===-1?Infinity:mi,e.day||0];}
  const ok=errors.length===0;
  let filtered=errors.filter(e=>activeCats.has(e.type)&&(!selAv||e.msg.includes(selAv))&&(!selTutor||e.msg.includes(`${tutors.find(t=>t.id===selTutor)?.cognome}`)));
  if(sortBy==="date")filtered=[...filtered].sort((a,b)=>{const[ami,ad]=dateRank(a);const[bmi,bd]=dateRank(b);return ami!==bmi?ami-bmi:ad-bd;});
  else if(sortBy==="type")filtered=[...filtered].sort((a,b)=>a.type.localeCompare(b.type));
  else if(sortBy==="msg")filtered=[...filtered].sort((a,b)=>a.msg.localeCompare(b.msg));

  return(<div className="verifica-panel" style={{width:380,flexShrink:0,background:"var(--bg-elev)",borderLeft:"1px solid var(--border)",display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"var(--fg)"}}>Verifica coerenza</div><div style={{fontSize:10,color:"var(--fg-subtle)",marginTop:1}}>Ultimo controllo: {fmtTs(lastRun)}</div></div>
        <button onClick={riesegui} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:5}}><Icon name="refresh" size={12} color="#fff"/>Riesegui</button>
      </div>
      <div style={{padding:"8px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <button onClick={()=>setCatExpanded(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--bg-sunken)",border:"1px solid var(--border)",borderRadius:"var(--radius)",cursor:"pointer",textAlign:"left"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            {[...activeCats].slice(0,4).map(t=>{const c=VERIFICA_CATS.find(x=>x.type===t);return c?<span key={t} className="badge" data-tone={c.tone} style={{fontSize:10}}>{c.label}</span>:null;})}
            {activeCats.size>4&&<span style={{fontSize:11,color:"var(--fg-subtle)"}}>+{activeCats.size-4}</span>}
            <span style={{fontSize:11,color:"var(--fg-subtle)",marginLeft:"auto"}}>{activeCats.size}/{VERIFICA_CATS.length}</span>
          </div>
          <Icon name={catExpanded?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
        </button>
        {catExpanded&&<div style={{marginTop:8,padding:12,background:"var(--bg-sunken)",border:"1px solid var(--border)",borderRadius:"var(--radius)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
            {VERIFICA_CATS.map(c=>{const cnt=errors.filter(e=>e.type===c.type).length;const checked=activeCats.has(c.type);return(<label key={c.type} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:"var(--radius)",background:checked?"var(--bg-elev)":"transparent",border:`1px solid ${checked?"var(--border)":"transparent"}`,cursor:"pointer"}}>
              <input type="checkbox" checked={checked} onChange={()=>toggleCat(c.type)} style={{flexShrink:0}}/>
              <Icon name={c.icon} size={13} color={`var(--${c.tone})`}/>
              <span style={{flex:1,fontSize:11,color:"var(--fg)"}}>{c.label}</span>
              {cnt>0&&<span style={{fontSize:10,fontWeight:700,color:`var(--${c.tone})`}}>{cnt}</span>}
            </label>);} )}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setActiveCats(new Set())} className="btn" data-variant="ghost" data-size="sm">Nessuna</button>
            <button onClick={()=>setActiveCats(new Set(VERIFICA_CATS.map(c=>c.type)))} className="btn" data-variant="outline" data-size="sm">Tutte</button>
            <button onClick={()=>setCatExpanded(false)} className="btn" data-variant="accent" data-size="sm" style={{marginLeft:"auto"}}>Applica</button>
          </div>
        </div>}
        <div style={{display:"flex",gap:6,marginTop:8}}>
          {anagraficaCorsi.length>0&&<select value={selAv} onChange={e=>setSelAv(e.target.value)} className="select" style={{flex:1,fontSize:11}}>
            <option value="">Tutti i corsi</option>
            {anagraficaCorsi.map(a=><option key={a.id||a.nome} value={a.nome}>{a.nome}</option>)}
          </select>}
          {tutors.length>0&&<select value={selTutor} onChange={e=>setSelTutor(e.target.value)} className="select" style={{flex:1,fontSize:11}}>
            <option value="">Tutti i tutor</option>
            {[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=><option key={t.id} value={t.id}>{t.cognome} {t.nome}</option>)}
          </select>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
          <span style={{fontSize:10,color:"var(--fg-subtle)",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>Ordina:</span>
          {[{v:"date",l:"Cronologico"},{v:"type",l:"Tipo"},{v:"msg",l:"A→Z"}].map(o=><button key={o.v} onClick={()=>setSortBy(o.v)} style={{fontSize:10,padding:"2px 8px",borderRadius:100,border:`1px solid ${sortBy===o.v?"var(--accent)":"var(--border)"}`,background:sortBy===o.v?"var(--accent)":"transparent",color:sortBy===o.v?"#fff":"var(--fg-muted)",cursor:"pointer"}}>{o.l}</button>)}
          {(selAv||selTutor)&&<button onClick={()=>{setSelAv("");setSelTutor("");}} className="btn" data-variant="ghost" data-size="sm" style={{marginLeft:"auto",fontSize:10}}>Reset</button>}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",background:"var(--bg)"}}>
        <div style={{padding:"10px 12px",borderRadius:"var(--radius-md)",background:ok?"var(--success-soft)":"var(--bg-elev)",border:`1px solid ${ok?"var(--success)":"var(--border)"}`,display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <Icon name={ok?"checkCircle":"alert"} size={18} color={ok?"var(--success)":"var(--danger)"}/>
          <span style={{fontWeight:700,fontSize:12,color:ok?"var(--success)":"var(--fg)"}}>{ok?"Tutto in regola.":filtered.length===0?"Nessun problema nei filtri.":`${filtered.length} problem${filtered.length===1?"a":"i"}`}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map((e,i)=>{const cat=VERIFICA_CATS.find(c=>c.type===e.type)||{icon:"alert",tone:"warning",label:e.type};const canNav=!!(e.monthKey&&onNavigateToError);return(<div key={i} onClick={()=>canNav&&onNavigateToError(e.monthKey,e.evId,e.day)} role={canNav?"button":undefined} tabIndex={canNav?0:undefined} onKeyDown={canNav?(ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();onNavigateToError(e.monthKey,e.evId,e.day);}}):undefined} style={{padding:"9px 10px",borderRadius:"var(--radius-md)",border:"1px solid var(--border)",background:"var(--bg-elev)",display:"flex",gap:9,alignItems:"flex-start",cursor:canNav?"pointer":"default",transition:"background .1s"}} onMouseEnter={ev=>{if(canNav)ev.currentTarget.style.background="var(--bg-hover)";}} onMouseLeave={ev=>ev.currentTarget.style.background="var(--bg-elev)"}>
            <div style={{width:30,height:30,borderRadius:7,flexShrink:0,background:`var(--${cat.tone}-soft)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name={cat.icon} size={14} color={`var(--${cat.tone})`}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                <span className="badge" data-tone={cat.tone} style={{fontSize:10}}>{cat.label}</span>
                {canNav&&<span style={{fontSize:10,color:"var(--info)",fontWeight:600,display:"flex",alignItems:"center",gap:3,marginLeft:"auto"}}><Icon name="calendar" size={10} color="var(--info)"/>{MONTHS.find(m=>m.key===e.monthKey)?.label||e.monthKey}</span>}
              </div>
              <div style={{fontSize:12,color:"var(--fg)",lineHeight:1.45}}>{e.msg}</div>
              {e.detail&&<div style={{fontSize:10,color:"var(--fg-muted)",marginTop:2}}>{e.detail}</div>}
            </div>
          </div>);})}
          {filtered.length===0&&!ok&&<p style={{color:"var(--fg-subtle)",textAlign:"center",padding:20,fontSize:13}}>Nessun errore nei filtri selezionati.</p>}
        </div>
      </div>
  </div>);
}

// ── ANAGRAFICA TUTOR SCREEN ───────────────────────────────────────────────
function AnaTutorsScreen({tutors,tutEvents,anagraficaCorsi,onSaveTutor,canEdit,canBulkVerify,onVerifyAllTutor}){
  const[q,setQ]=useState("");const[selected,setSelected]=useState(null);const[editing,setEditing]=useState(false);const[isNew,setIsNew]=useState(false);const[form,setForm]=useState({});const[saving,setSaving]=useState(false);const[verifying,setVerifying]=useState(false);
  function getTutOre(tId){let o=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)o+=(ev.ore||0);return o;}
  function getTutUnverified(tId){let u=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)if(!ev.verified)u++;return u;}
  function getTutSlots(tId){let s=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))s+=evs.length;return s;}
  function getTutAvvisiSet(tId){const n=new Set();const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)n.add(ev.name);return n;}
  const avOreByName={};anagraficaCorsi.forEach(a=>{let t=0;for(const[,ms]of Object.entries(tutEvents))for(const[,evs]of Object.entries(ms))for(const ev of evs)if(ev.name===a.nome)t+=ev.ore||0;avOreByName[a.nome]=t;});
  const filtered=[...tutors].filter(t=>`${t.nome} ${t.cognome} ${t.cf||""} ${t.azienda||""}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.cognome.localeCompare(b.cognome));
  useEffect(()=>{if(tutors.length>0&&!selected)setSelected(tutors[0]);},[tutors]);
  function startEdit(){setForm({...selected});setEditing(true);}
  async function saveEdit(){if(!form.nome||!form.cognome)return;setSaving(true);const newList=isNew?[...tutors,form]:tutors.map(t=>t.id===form.id?form:t);await onSaveTutor(newList,isNew?"add":"edit",form);setIsNew(false);setEditing(false);setSelected(form);setSaving(false);}
  function addNew(){const usedColors=tutors.map(t=>t.color).filter(Boolean);const freeColor=PALETTE.find(c=>!usedColors.includes(c))||PALETTE[0];const newItem={id:`tutor-${Date.now()}`,nome:"",cognome:"",cf:"",azienda:"",color:freeColor};setForm({...newItem});setSelected(newItem);setIsNew(true);setEditing(true);}
  async function deleteSelected(){if(!selected||!confirm(`Eliminare "${selected.cognome} ${selected.nome}"?`))return;const newList=tutors.filter(t=>t.id!==selected.id);await onSaveTutor(newList,"delete",selected);setSelected(newList[0]||null);}
  const usedColors=tutors.filter(t=>t.id!==selected?.id).map(t=>t.color).filter(Boolean);
  const selUnverified=selected?getTutUnverified(selected.id):0;
  async function handleVerifyAll(){if(!selected)return;const n=getTutUnverified(selected.id);if(n===0)return;if(!confirm(`Verificare tutti i ${n} slot non ancora verificati del tutor «${selected.cognome} ${selected.nome}»?\n\nTutti gli slot a calendario di questo tutor verranno segnati come verificati.`))return;setVerifying(true);await onVerifyAllTutor(selected.id);setVerifying(false);}
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header" style={{flexWrap:"wrap",gap:12}}>
      <div><div className="page-breadcrumb">Anagrafiche · {tutors.length} tutor registrati</div><h1 className="page-title">Tutor</h1><p className="page-desc">Gestisci l'elenco dei tutor del tuo ente. Ogni tutor ha un colore univoco usato in tutta l'app.</p></div>
      {canEdit&&<button className="btn" data-variant="accent" onClick={addNew} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={14} color="#fff"/>Nuovo tutor</button>}
    </div>
    <div className="list-detail" style={{flex:1,minHeight:0}}>
      <div className="list-pane">
        <div className="list-pane-toolbar">
          <div style={{position:"relative"}}><Icon name="search" size={14} color="var(--fg-faint)" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/><input className="input" placeholder="Cerca per nome, cognome, azienda…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32}}/></div>
        </div>
        <div className="list-pane-body">
          {filtered.map(t=>{const isSel=selected?.id===t.id;const ore=getTutOre(t.id);const avvN=getTutAvvisiSet(t.id).size;return(<button key={t.id} className={`list-item${isSel?" active":""}`} onClick={()=>{setSelected(t);setEditing(false);}}>
            {isSel&&<span style={{position:"absolute",left:0,top:12,bottom:12,width:3,background:t.color||"var(--accent)",borderRadius:"0 3px 3px 0"}}/>}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13.5,color:"var(--fg)"}}>{t.cognome} {t.nome}</div>
                <div style={{fontSize:11,color:"var(--fg-subtle)"}}>{t.azienda||"—"}</div>
              </div>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:700,fontSize:12,color:"var(--fg)"}}>{fmtOreMin(ore)}</span>
            </div>
          </button>);})}
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--fg-subtle)",fontSize:13}}>Nessun tutor trovato</div>}
        </div>
      </div>
      {selected?(<div className="detail-pane">
        {!editing?(<>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:56,height:56,borderRadius:999,background:selected.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(selected.cognome[0]||"")+(selected.nome[0]||"")}</div>
              <div><h2 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",color:"var(--fg)",marginBottom:2}}>{selected.cognome} {selected.nome}</h2><div style={{fontSize:12,color:"var(--fg-muted)"}}>{selected.azienda||"Nessuna azienda"}</div></div>
            </div>
            {(canEdit||canBulkVerify)&&<div style={{display:"flex",gap:8,flexShrink:0}}>
              {canBulkVerify&&<button className="btn" data-variant="outline" onClick={handleVerifyAll} disabled={verifying||selUnverified===0} title={selUnverified===0?"Tutti gli slot di questo tutor sono già verificati":`Verifica in blocco i ${selUnverified} slot non ancora verificati`} style={{display:"flex",alignItems:"center",gap:6}}>{verifying?<><Icon name="loader" size={13}/>Verifica…</>:<><Icon name="shieldCheck" size={13} color={selUnverified===0?"var(--fg-faint)":"var(--success)"}/>Verifica tutor{selUnverified>0?` (${selUnverified})`:""}</>}</button>}
              {canEdit&&<button className="btn" data-variant="outline" onClick={startEdit} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="edit" size={13}/>Modifica</button>}
              {canEdit&&<button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={13} color="var(--danger)"/>Elimina</button>}
            </div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {[{label:"Slot totali",value:getTutSlots(selected.id),icon:"mapPin"},{label:"Ore totali",value:fmtOreMin(getTutOre(selected.id)),icon:"clock"},{label:"Corsi",value:getTutAvvisiSet(selected.id).size,icon:"briefcase"},{label:"Azienda",value:selected.azienda||"—",icon:"building"}].map(k=><div key={k.label} className="kpi-card"><div className="kpi-icon"><Icon name={k.icon} size={16} color="var(--accent)"/></div><div><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{fontSize:k.label==="Azienda"?13:20,color:"var(--fg)"}}>{k.value}</div></div></div>)}
          </div>
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Dettagli</div>
            <dl style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:"10px 16px",margin:0,fontSize:13}}>
              <dt style={{color:"var(--fg-subtle)"}}>Codice Fiscale</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.cf||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Colore</dt><dd style={{margin:0,display:"flex",alignItems:"center",gap:8}}><span style={{width:16,height:16,borderRadius:4,background:selected.color||"var(--accent)"}}/><span style={{fontFamily:'"JetBrains Mono",monospace',color:"var(--fg-muted)",fontSize:12}}>{(selected.color||"").toLowerCase()}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Corsi seguiti</dt><dd style={{margin:0,color:"var(--fg)"}}>{[...getTutAvvisiSet(selected.id)].join(", ")||"—"}</dd>
            </dl>
          </div>
        </>):(<div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:24,boxShadow:"var(--shadow-xs)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:16}}>Modifica tutor</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label className="label">Nome *</label><input className="input" value={form.nome||""} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}/></div>
            <div><label className="label">Cognome *</label><input className="input" value={form.cognome||""} onChange={e=>setForm(f=>({...f,cognome:e.target.value}))}/></div>
          </div>
          <div style={{marginBottom:14}}><label className="label">Codice Fiscale</label><input className="input mono" value={form.cf||""} onChange={e=>setForm(f=>({...f,cf:e.target.value.toUpperCase()}))} maxLength={16}/></div>
          <div style={{marginBottom:18}}><label className="label">Azienda / Ente</label><input className="input" value={form.azienda||""} onChange={e=>setForm(f=>({...f,azienda:e.target.value}))}/></div>
          <div style={{marginBottom:18}}><label className="label">Colore identificativo</label><ColorPicker value={form.color||PALETTE[0]} onChange={c=>setForm(f=>({...f,color:c}))} usedColors={usedColors}/></div>
          <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid var(--divider)",paddingTop:14}}>
            {!isNew&&<button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina tutor</button>}
            <div style={{display:"flex",gap:8,marginLeft:"auto"}}><button className="btn" data-variant="outline" onClick={()=>{setEditing(false);setIsNew(false);if(isNew)setSelected(tutors[0]||null);}}>Annulla</button><button className="btn" data-variant="accent" onClick={saveEdit} disabled={saving||!form.nome||!form.cognome} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={14} color="#fff"/>Salvataggio...</>:<><Icon name="check" size={14} color="#fff"/>{isNew?"Crea tutor":"Salva modifiche"}</>}</button></div>
          </div>
        </div>)}
      </div>):(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-subtle)"}}>Seleziona un tutor a sinistra</div>)}
    </div>
  </div>);
}

// ── ANAGRAFICA CORSI SCREEN ──────────────────────────────────────────────
function AnaCorsiScreen({corsi,anagraficaCorsi,onSaveAnaCorso,avvisiEntita=[],canEdit,canBulkVerify,onVerifyAllCorso}){
  const[q,setQ]=useState("");const[statoFilter,setStatoFilter]=useState("all");const[selected,setSelected]=useState(null);const[editing,setEditing]=useState(false);const[isNew,setIsNew]=useState(false);const[form,setForm]=useState({});const[saving,setSaving]=useState(false);const[verifying,setVerifying]=useState(false);
  const corsiById={};corsi.forEach(co=>corsiById[co.id]=co);
  const avEntitaById={};avvisiEntita.forEach(av=>avEntitaById[av.id]=av);
  function getOre(ana){const co=corsiById[ana.id];return co?co.events.reduce((s,e)=>s+(e.ore||0),0):0;}
  function pct(ana){const ore=getOre(ana);return ana.durataOre?Math.round(ore/ana.durataOre*100):0;}
  const filtered=[...anagraficaCorsi].filter(a=>(statoFilter==="all"||a.stato===statoFilter)&&`${a.nome} ${a.codice||""}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.nome.localeCompare(b.nome));
  useEffect(()=>{if(anagraficaCorsi.length>0&&!selected)setSelected(anagraficaCorsi[0]);},[anagraficaCorsi]);
  function startEdit(){setForm({...selected});setEditing(true);}
  async function saveEdit(){if(!form.nome||!form.durataOre||Number(form.durataOre)<=0)return;setSaving(true);const newList=isNew?[...anagraficaCorsi,form]:anagraficaCorsi.map(a=>a.id===form.id?form:a);await onSaveAnaCorso(newList,isNew?"add":"edit",form);setIsNew(false);setEditing(false);setSelected(form);setSaving(false);}
  function addNew(){const free=PALETTE.find(c=>!anagraficaCorsi.map(a=>a.colore).includes(c))||PALETTE[0];const newItem={id:`av-${Date.now()}`,nome:"",codice:"",colore:free,durataOre:"",stato:"In corso",dataInizio:"",dataFine:"",sede:"",note:"",avvisoId:""};setForm({...newItem});setSelected(newItem);setIsNew(true);setEditing(true);}
  async function deleteSelected(){if(!selected||!confirm(`Eliminare "${selected.nome}"?`))return;const newList=anagraficaCorsi.filter(a=>a.id!==selected.id);await onSaveAnaCorso(newList,"delete",selected);setSelected(newList[0]||null);}
  const usedColors=anagraficaCorsi.filter(a=>a.id!==selected?.id).map(a=>a.colore).filter(Boolean);
  function getUnverified(ana){const co=corsiById[ana?.id];return co?co.events.filter(e=>!e.verified).length:0;}
  const selUnverified=selected?getUnverified(selected):0;
  async function handleVerifyAll(){if(!selected)return;const n=getUnverified(selected);if(n===0)return;if(!confirm(`Verificare tutti i ${n} slot non ancora verificati del corso «${selected.nome}»?\n\nTutti gli slot a calendario di questo corso verranno segnati come verificati.`))return;setVerifying(true);await onVerifyAllCorso(selected.id);setVerifying(false);}
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header" style={{flexWrap:"wrap",gap:12}}>
      <div><div className="page-breadcrumb">Anagrafiche · {anagraficaCorsi.length} corsi registrati</div><h1 className="page-title">Corsi</h1><p className="page-desc">Corsi e attività formative collegate agli avvisi.</p></div>
      {canEdit&&<div style={{display:"flex",gap:8}}>
        <button className="btn" data-variant="accent" onClick={addNew} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={14} color="#fff"/>Nuovo corso</button>
      </div>}
    </div>
    <div className="list-detail" style={{flex:1,minHeight:0}}>
      <div className="list-pane">
        <div className="list-pane-toolbar">
          <div style={{position:"relative",marginBottom:10}}><Icon name="search" size={14} color="var(--fg-faint)" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/><input className="input" placeholder="Cerca corso o codice…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32}}/></div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{v:"all",label:"Tutti",count:anagraficaCorsi.length},{v:"In corso",label:"In corso",count:anagraficaCorsi.filter(a=>a.stato==="In corso").length},{v:"Sospeso",label:"Sospesi",count:anagraficaCorsi.filter(a=>a.stato==="Sospeso").length},{v:"Concluso",label:"Conclusi",count:anagraficaCorsi.filter(a=>a.stato==="Concluso").length}].map(o=><button key={o.v} onClick={()=>setStatoFilter(o.v)} style={{padding:"5px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:5,background:statoFilter===o.v?"var(--bg-elev)":"transparent",color:statoFilter===o.v?"var(--fg)":"var(--fg-muted)",border:`1px solid ${statoFilter===o.v?"var(--border)":"transparent"}`}}>{o.label}<span style={{fontSize:10,color:"var(--fg-subtle)",fontFamily:'"JetBrains Mono",monospace'}}>{o.count}</span></button>)}
          </div>
        </div>
        <div className="list-pane-body">
          {filtered.map(a=>{const isSel=selected?.id===a.id;const p=pct(a);const ore=getOre(a);return(<button key={a.id} className={`list-item${isSel?" active":""}`} onClick={()=>{setSelected(a);setEditing(false);}}>
            {isSel&&<span style={{position:"absolute",left:0,top:12,bottom:12,width:3,background:a.colore||"var(--accent)",borderRadius:"0 3px 3px 0"}}/>}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:3,background:a.colore||"var(--accent)",flexShrink:0}}/><span style={{fontSize:13.5,fontWeight:600,color:"var(--fg)"}}>{a.nome}</span></div>
              <span className="badge" data-tone={STATO_TONES[a.stato]||"info"}>{a.stato}</span>
            </div>
            <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:"var(--fg-subtle)",marginBottom:8}}>{a.codice}</div>
            <div style={{fontSize:11.5,color:"var(--fg-muted)",marginBottom:4}}>{a.dataInizio||"—"}{a.dataFine?` → ${a.dataFine}`:""}</div>
            {a.sede&&<div style={{fontSize:11,color:"var(--fg-subtle)",display:"flex",alignItems:"center",gap:4}}><Icon name="mapPin" size={10} color="var(--fg-faint)"/>{a.sede}</div>}
          </button>);})}
        </div>
      </div>
      {selected?(<div className="detail-pane">
        {!editing?(
          <><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:24}}>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{width:12,height:12,borderRadius:3,background:selected.colore||"var(--accent)"}}/><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:"var(--fg-subtle)"}}>{selected.codice}</span><span className="badge" data-tone={STATO_TONES[selected.stato]||"info"}>{selected.stato}</span></div>
              <h2 style={{fontSize:26,fontWeight:700,letterSpacing:"-0.02em",color:"var(--fg)",marginBottom:6}}>{selected.nome}</h2>
              <p style={{fontSize:13,color:"var(--fg-muted)",maxWidth:540,lineHeight:1.55}}>{selected.note||"Nessuna nota."}</p>
            </div>
            {(canEdit||canBulkVerify)&&<div style={{display:"flex",gap:8,flexShrink:0}}>
              {canBulkVerify&&<button className="btn" data-variant="outline" onClick={handleVerifyAll} disabled={verifying||selUnverified===0} title={selUnverified===0?"Tutti gli slot di questo corso sono già verificati":`Verifica in blocco i ${selUnverified} slot non ancora verificati`} style={{display:"flex",alignItems:"center",gap:6}}>{verifying?<><Icon name="loader" size={13}/>Verifica…</>:<><Icon name="shieldCheck" size={13} color={selUnverified===0?"var(--fg-faint)":"var(--success)"}/>Verifica corso{selUnverified>0?` (${selUnverified})`:""}</>}</button>}
              {canEdit&&<button className="btn" data-variant="outline" onClick={startEdit} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="edit" size={13}/>Modifica</button>}
              {canEdit&&<button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={13} color="var(--danger)"/>Elimina</button>}
            </div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {[{label:"Da bando",value:selected.durataOre?fmtOreMin(selected.durataOre):"?",icon:"file"},{label:"Calendario",value:fmtOreMin(getOre(selected)),icon:"calendar",warn:getOre(selected)>selected.durataOre},{label:"Avviso/Progetto",value:avEntitaById[selected.avvisoId]?.nome||"—",icon:"briefcase"},{label:"Slot",value:(corsiById[selected.id]?.events?.length||0),icon:"clock"}].map(k=><div key={k.label} className="kpi-card"><div className="kpi-icon"><Icon name={k.icon} size={16} color={k.warn?"var(--danger)":"var(--accent)"}/></div><div><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{color:k.warn?"var(--danger)":"var(--fg)",fontSize:22}}>{k.value}</div></div></div>)}
          </div>
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Dettagli</div>
            <dl style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:"10px 16px",margin:0,fontSize:13}}>
              <dt style={{color:"var(--fg-subtle)"}}>Codice corso</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.codice||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Stato</dt><dd style={{margin:0}}><span className="badge" data-tone={STATO_TONES[selected.stato]||"info"}>{selected.stato}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Avviso/progetto collegato</dt><dd style={{margin:0,color:"var(--fg)"}}>{avEntitaById[selected.avvisoId]?.nome||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Periodo</dt><dd style={{margin:0,color:"var(--fg)"}}>{selected.dataInizio||"—"}{selected.dataFine?` → ${selected.dataFine}`:""}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Sede</dt><dd style={{margin:0,color:"var(--fg)"}}>{selected.sede||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Durata da bando</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.durataOre?fmtOreMin(selected.durataOre):"?"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Colore</dt><dd style={{margin:0,display:"flex",alignItems:"center",gap:8}}><span style={{width:16,height:16,borderRadius:4,background:selected.colore||"var(--accent)"}}/><span style={{fontFamily:'"JetBrains Mono",monospace',color:"var(--fg-muted)",fontSize:12}}>{(selected.colore||"").toLowerCase()}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Note</dt><dd style={{margin:0,color:"var(--fg)",lineHeight:1.55}}>{selected.note||"—"}</dd>
            </dl>
          </div></>
        ):(
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:24,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:16}}>Modifica corso</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Nome *</label><input className="input" value={form.nome||""} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}/></div><div><label className="label">Codice</label><input className="input mono" value={form.codice||""} onChange={e=>setForm(f=>({...f,codice:e.target.value}))}/></div></div>
            <div style={{marginBottom:14}}><label className="label">Avviso/progetto collegato</label><select className="select" value={form.avvisoId||""} onChange={e=>setForm(f=>({...f,avvisoId:e.target.value}))}><option value="">— Nessuno —</option>{avvisiEntita.map(av=><option key={av.id} value={av.id}>{av.nome}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Durata (ore)</label><input className="input mono" type="number" min="0" value={form.durataOre||""} onChange={e=>setForm(f=>({...f,durataOre:e.target.value===""?"":Number(e.target.value)}))}/></div><div><label className="label">Stato</label><select className="select" value={form.stato||"In corso"} onChange={e=>setForm(f=>({...f,stato:e.target.value}))}>{AV_STATI.map(s=><option key={s} value={s}>{s}</option>)}</select></div><div><label className="label">Colore</label><ColorPicker value={form.colore||PALETTE[0]} onChange={c=>setForm(f=>({...f,colore:c}))} usedColors={usedColors}/></div></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Data inizio</label><input className="input" type="date" value={form.dataInizio||""} onChange={e=>setForm(f=>({...f,dataInizio:e.target.value}))}/></div><div><label className="label">Data fine</label><input className="input" type="date" value={form.dataFine||""} onChange={e=>setForm(f=>({...f,dataFine:e.target.value}))}/></div></div>
            <div style={{marginBottom:14}}><label className="label">Sede</label><input className="input" value={form.sede||""} onChange={e=>setForm(f=>({...f,sede:e.target.value}))} placeholder="Es. Via Roma 1, Palermo"/></div>
            <div style={{marginBottom:14}}><label className="label">Note</label><textarea className="textarea" value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={3}/></div>
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid var(--divider)",paddingTop:14}}>
              {!isNew&&<button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina corso</button>}
              <div style={{display:"flex",gap:8,marginLeft:"auto"}}><button className="btn" data-variant="outline" onClick={()=>{setEditing(false);setIsNew(false);if(isNew)setSelected(anagraficaCorsi[0]||null);}}>Annulla</button><button className="btn" data-variant="accent" onClick={saveEdit} disabled={saving||!form.nome||!form.durataOre||Number(form.durataOre)<=0} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={14} color="#fff"/>Salvataggio...</>:<><Icon name="check" size={14} color="#fff"/>{isNew?"Crea corso":"Salva modifiche"}</>}</button></div>
            </div>
          </div>
        )}
      </div>):(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-subtle)"}}>Seleziona un corso a sinistra</div>)}
    </div>
  </div>);
}

// ── ANAGRAFICA AVVISI SCREEN ──────────────────────────────────────────────
function AnaAvvisiScreen({avvisi=[],onSaveAvviso,canEdit}){
  const[q,setQ]=useState("");const[statoFilter,setStatoFilter]=useState("all");const[selected,setSelected]=useState(null);const[editing,setEditing]=useState(false);const[isNew,setIsNew]=useState(false);const[form,setForm]=useState({});const[saving,setSaving]=useState(false);
  const filtered=[...avvisi].filter(a=>(statoFilter==="all"||a.stato===statoFilter)&&`${a.nome} ${a.codice||""}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.nome.localeCompare(b.nome));
  useEffect(()=>{if(avvisi.length>0&&!selected)setSelected(avvisi[0]);},[avvisi]);
  function startEdit(){setForm({...selected});setEditing(true);}
  async function saveEdit(){if(!form.nome)return;setSaving(true);const newList=isNew?[...avvisi,form]:avvisi.map(a=>a.id===form.id?form:a);await onSaveAvviso(newList,isNew?"add":"edit",form);setIsNew(false);setEditing(false);setSelected(form);setSaving(false);}
  function addNew(){const newItem={id:`avviso-${Date.now()}`,nome:"",codice:"",ente:"",anno:new Date().getFullYear(),stato:"In corso",note:""};setForm({...newItem});setSelected(newItem);setIsNew(true);setEditing(true);}
  async function deleteSelected(){if(!selected||!confirm(`Eliminare "${selected.nome}"?`))return;const newList=avvisi.filter(a=>a.id!==selected.id);await onSaveAvviso(newList,"delete",selected);setSelected(newList[0]||null);}
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header" style={{flexWrap:"wrap",gap:12}}>
      <div><div className="page-breadcrumb">Anagrafiche · {avvisi.length} avvisi/progetti registrati</div><h1 className="page-title">Avvisi</h1><p className="page-desc">Bandi, progetti e avvisi pubblici. Ogni corso è collegato ad un avviso/progetto.</p></div>
      {canEdit&&<div style={{display:"flex",gap:8}}>
        <button className="btn" data-variant="accent" onClick={addNew} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={14} color="#fff"/>Nuovo avviso</button>
      </div>}
    </div>
    <div className="list-detail" style={{flex:1,minHeight:0}}>
      <div className="list-pane">
        <div className="list-pane-toolbar">
          <div style={{position:"relative",marginBottom:10}}><Icon name="search" size={14} color="var(--fg-faint)" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/><input className="input" placeholder="Cerca avviso o codice…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32}}/></div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{v:"all",label:"Tutti",count:avvisi.length},{v:"In corso",label:"In corso",count:avvisi.filter(a=>a.stato==="In corso").length},{v:"Sospeso",label:"Sospesi",count:avvisi.filter(a=>a.stato==="Sospeso").length},{v:"Concluso",label:"Conclusi",count:avvisi.filter(a=>a.stato==="Concluso").length}].map(o=><button key={o.v} onClick={()=>setStatoFilter(o.v)} style={{padding:"5px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:5,background:statoFilter===o.v?"var(--bg-elev)":"transparent",color:statoFilter===o.v?"var(--fg)":"var(--fg-muted)",border:`1px solid ${statoFilter===o.v?"var(--border)":"transparent"}`}}>{o.label}<span style={{fontSize:10,color:"var(--fg-subtle)",fontFamily:'"JetBrains Mono",monospace'}}>{o.count}</span></button>)}
          </div>
        </div>
        <div className="list-pane-body">
          {filtered.map(a=>{const isSel=selected?.id===a.id;return(<button key={a.id} className={`list-item${isSel?" active":""}`} onClick={()=>{setSelected(a);setEditing(false);}}>
            {isSel&&<span style={{position:"absolute",left:0,top:12,bottom:12,width:3,background:"var(--accent)",borderRadius:"0 3px 3px 0"}}/>}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13.5,fontWeight:600,color:"var(--fg)"}}>{a.nome}</span>
              <span className="badge" data-tone={STATO_TONES[a.stato]||"info"}>{a.stato}</span>
            </div>
            <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:"var(--fg-subtle)",marginBottom:4}}>{a.codice}</div>
            <div style={{fontSize:11.5,color:"var(--fg-muted)"}}>{a.ente||"—"}{a.anno?` · ${a.anno}`:""}</div>
          </button>);})}
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--fg-subtle)",fontSize:13}}>Nessun avviso trovato</div>}
        </div>
      </div>
      {selected?(<div className="detail-pane">
        {!editing?(
          <><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:24}}>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:"var(--fg-subtle)"}}>{selected.codice}</span><span className="badge" data-tone={STATO_TONES[selected.stato]||"info"}>{selected.stato}</span></div>
              <h2 style={{fontSize:26,fontWeight:700,letterSpacing:"-0.02em",color:"var(--fg)",marginBottom:6}}>{selected.nome}</h2>
              <p style={{fontSize:13,color:"var(--fg-muted)",maxWidth:540,lineHeight:1.55}}>{selected.note||"Nessuna nota."}</p>
            </div>
            {canEdit&&<div style={{display:"flex",gap:8,flexShrink:0}}>
              <button className="btn" data-variant="outline" onClick={startEdit} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="edit" size={13}/>Modifica</button>
              <button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={13} color="var(--danger)"/>Elimina</button>
            </div>}
          </div>
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Dettagli</div>
            <dl style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:"10px 16px",margin:0,fontSize:13}}>
              <dt style={{color:"var(--fg-subtle)"}}>Codice/DDG</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.codice||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Stato</dt><dd style={{margin:0}}><span className="badge" data-tone={STATO_TONES[selected.stato]||"info"}>{selected.stato}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Ente</dt><dd style={{margin:0,color:"var(--fg)"}}>{selected.ente||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Anno</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.anno||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Note</dt><dd style={{margin:0,color:"var(--fg)",lineHeight:1.55}}>{selected.note||"—"}</dd>
            </dl>
          </div></>
        ):(
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:24,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:16}}>Modifica avviso/progetto</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Nome *</label><input className="input" value={form.nome||""} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}/></div><div><label className="label">Codice/DDG</label><input className="input mono" value={form.codice||""} onChange={e=>setForm(f=>({...f,codice:e.target.value}))}/></div></div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Ente</label><input className="input" value={form.ente||""} onChange={e=>setForm(f=>({...f,ente:e.target.value}))}/></div><div><label className="label">Anno</label><input className="input mono" type="number" value={form.anno||""} onChange={e=>setForm(f=>({...f,anno:e.target.value===""?"":Number(e.target.value)}))}/></div></div>
            <div style={{marginBottom:14}}><label className="label">Stato</label><select className="select" value={form.stato||"In corso"} onChange={e=>setForm(f=>({...f,stato:e.target.value}))}>{AV_STATI.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{marginBottom:14}}><label className="label">Note</label><textarea className="textarea" value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={3}/></div>
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid var(--divider)",paddingTop:14}}>
              {!isNew&&<button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina avviso</button>}
              <div style={{display:"flex",gap:8,marginLeft:"auto"}}><button className="btn" data-variant="outline" onClick={()=>{setEditing(false);setIsNew(false);if(isNew)setSelected(avvisi[0]||null);}}>Annulla</button><button className="btn" data-variant="accent" onClick={saveEdit} disabled={saving||!form.nome} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={14} color="#fff"/>Salvataggio...</>:<><Icon name="check" size={14} color="#fff"/>{isNew?"Crea avviso":"Salva modifiche"}</>}</button></div>
            </div>
          </div>
        )}
      </div>):(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-subtle)"}}>Seleziona un avviso a sinistra</div>)}
    </div>
  </div>);
}

// ── EXPORT INSIGHTS MODAL ────────────────────────────────────────────────────
function ExportInsightsModal({anagraficaCorsi,corsiById,avvisi,allMonthKeys,currentMonthKey,onClose}){
  const[selIds,setSelIds]=useState(anagraficaCorsi.map(a=>a.id));
  const[period,setPeriod]=useState({mode:"single",monthKey:currentMonthKey,year:MONTHS.find(m=>m.key===currentMonthKey)?.year||2026});
  const[generating,setGenerating]=useState(false);
  const[progress,setProgress]=useState(null);
  const[err,setErr]=useState(null);
  function toggleId(id){setSelIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function loadDocx(){return new Promise((resolve,reject)=>{
    if(window.docx)return resolve(window.docx);
    const old=document.getElementById("docx-cdn");if(old)old.remove();
    const s=document.createElement("script");s.id="docx-cdn";
    s.src="https://unpkg.com/docx@7.8.2/build/index.js";s.async=true;
    s.onload=()=>window.docx?resolve(window.docx):reject(new Error("Libreria Word non disponibile (script caricato ma incompleto)."));
    s.onerror=()=>reject(new Error("Impossibile caricare la libreria Word. Verifica la connessione e riprova."));
    document.head.appendChild(s);
  });}
  function getMks(){if(period.mode==="single")return[period.monthKey];if(period.mode==="year")return MONTHS.filter(m=>m.year===period.year).map(m=>m.key);if(period.mode==="range"){const si=MONTHS.findIndex(m=>m.key===period.startKey),ei=MONTHS.findIndex(m=>m.key===period.endKey);if(si<0||ei<0)return[currentMonthKey];return MONTHS.slice(Math.min(si,ei),Math.max(si,ei)+1).map(m=>m.key);}return[currentMonthKey];}
  function periodLabel(){if(period.mode==="year")return`Anno ${period.year}`;if(period.mode==="range"){const s=MONTHS.find(m=>m.key===period.startKey),e=MONTHS.find(m=>m.key===period.endKey);return s&&e?`${MONTH_NAMES_SHORT[s.month]} ${s.year} – ${MONTH_NAMES_SHORT[e.month]} ${e.year}`:"Range";}return MONTHS.find(m=>m.key===period.monthKey)?.label||period.monthKey;}
  async function buildDocx(mks,onProgress){
    const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,AlignmentType,ShadingType,BorderStyle}=window.docx;
    const GIORNI=["Domenica","Luned\xEC","Marted\xEC","Mercoled\xEC","Gioved\xEC","Venerd\xEC","Sabato"];
    const MESI=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
    function fmt2(d){const h=Math.floor(d),m=Math.round((d%1)*60);return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;}
    const BRD={style:BorderStyle.SINGLE,size:4,color:"CCCCCC"};
    const tblBorders={top:BRD,bottom:BRD,left:BRD,right:BRD,insideH:BRD,insideV:BRD};
    const COL=[1800,2800,2000,900,700];
    const toRender=[...anagraficaCorsi].filter(a=>selIds.includes(a.id)).sort((a,b)=>a.nome.localeCompare(b.nome)).map(ana=>({ana,evs:(corsiById[ana.id]?.events||[]).filter(e=>mks.includes(e.month)).sort((a,b)=>{const ai=mks.indexOf(a.month),bi=mks.indexOf(b.month);return ai!==bi?ai-bi:a.day-b.day||a.start-b.start;})})).filter(x=>x.evs.length);
    const body=[];
    body.push(new Paragraph({children:[new TextRun({text:"Calendario Lezioni",bold:true,size:44,color:"1A1F4D"})],spacing:{after:120}}));
    body.push(new Paragraph({children:[new TextRun({text:`Periodo: ${periodLabel()}`,size:22,color:"444444"})],spacing:{after:80}}));
    body.push(new Paragraph({children:[new TextRun({text:`Generato il ${new Date().toLocaleDateString("it-IT")}`,size:18,color:"888888",italics:true})],spacing:{after:480}}));
    let first=true;
    for(let ci=0;ci<toRender.length;ci++){
      const {ana,evs}=toRender[ci];
      onProgress&&onProgress(ci,toRender.length);
      await new Promise(r=>setTimeout(r,0));
      if(!first)body.push(new Paragraph({text:"",spacing:{before:560,after:0}}));
      first=false;
      const av=avvisi.find(x=>x.id===ana.avvisoId);
      const totOre=evs.reduce((s,e)=>s+(e.ore||(e.end-e.start)||0),0);
      const hasUnver=evs.some(e=>!e.verified);
      if(av)body.push(new Paragraph({children:[new TextRun({text:av.nome,size:18,color:"888888"})],spacing:{after:40}}));
      body.push(new Paragraph({children:[new TextRun({text:ana.nome,bold:true,size:32,color:"1A1F4D"})],spacing:{after:40}}));
      if(ana.codice)body.push(new Paragraph({children:[new TextRun({text:`Codice: ${ana.codice}`,size:18,color:"888888"})],spacing:{after:40}}));
      body.push(new Paragraph({children:[new TextRun({text:`${evs.length} sessioni · ${fmtOreMin(totOre)} · ${periodLabel()}`,size:18,color:"555555"})],spacing:{after:200}}));
      const hdrRow=new TableRow({tableHeader:true,children:["Giorno","Data","Orario","Ore","Verif."].map((h,i)=>new TableCell({width:{size:COL[i],type:WidthType.DXA},shading:{fill:"1A1F4D",type:ShadingType.CLEAR,color:"auto"},children:[new Paragraph({children:[new TextRun({text:h,bold:true,color:"FFFFFF",size:18})],alignment:AlignmentType.LEFT})]}))});
      const dataRows=evs.map(ev=>{
        const mObj=MONTHS.find(m=>m.key===ev.month);
        const dt=new Date(mObj.year,mObj.month,ev.day);
        const row=[
          {t:GIORNI[dt.getDay()],i:0,c:"111111"},
          {t:`${ev.day} ${MESI[mObj.month]} ${mObj.year}`,i:1,c:"111111"},
          {t:`${fmt2(ev.start)} – ${fmt2(ev.end)}`,i:2,c:"111111"},
          {t:fmtOreMin(ev.ore||(ev.end-ev.start)||0),i:3,c:"111111"},
          {t:ev.verified?"✓":"*",i:4,c:ev.verified?"1A7A1A":"CC4400"},
        ];
        return new TableRow({children:row.map(({t,i,c})=>new TableCell({width:{size:COL[i],type:WidthType.DXA},children:[new Paragraph({children:[new TextRun({text:t,size:18,color:c})]})]}))});
      });
      body.push(new Table({rows:[hdrRow,...dataRows],width:{size:8200,type:WidthType.DXA},borders:tblBorders}));
      body.push(new Paragraph({children:[new TextRun({text:`Totale: ${fmtOreMin(totOre)}`,bold:true,size:20})],spacing:{before:120,after:40}}));
      if(hasUnver)body.push(new Paragraph({children:[new TextRun({text:"* Sessioni non ancora verificate",size:16,color:"888888",italics:true})],spacing:{after:40}}));
    }
    onProgress&&onProgress(toRender.length,toRender.length);
    return Packer.toBlob(new Document({sections:[{properties:{page:{margin:{top:1440,right:1440,bottom:1440,left:1440}}},children:body}]}));
  }
  async function doExport(){
    if(!selIds.length){setErr("Seleziona almeno un corso.");return;}
    setErr(null);setGenerating(true);setProgress({pct:2,label:"Preparazione…"});
    let creep=null;
    try{
      if(!window.docx){let p=2;creep=setInterval(()=>{p=Math.min(60,p+Math.max(1,(60-p)*0.06));setProgress({pct:Math.round(p),label:"Caricamento libreria Word…"});},160);}
      await loadDocx();
      if(creep){clearInterval(creep);creep=null;}
      setProgress({pct:65,label:"Composizione documento…"});
      const blob=await buildDocx(getMks(),(done,tot)=>setProgress({pct:65+Math.round(done/Math.max(1,tot)*28),label:`Composizione corsi ${Math.min(done+1,tot)}/${tot}…`}));
      setProgress({pct:96,label:"Creazione file .docx…"});
      const lbl=periodLabel().replace(/[\s\/]+/g,"_");
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`Calendario_Lezioni_${lbl}.docx`;a.rel="noopener";document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),4000);
      setProgress({pct:100,label:"Completato — download avviato"});
      setTimeout(onClose,800);
    }catch(e){if(creep)clearInterval(creep);setErr(`Errore generazione: ${e.message}`);setProgress(null);setGenerating(false);}
  }
  const curMks=getMks();
  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="add-modal-box" style={{width:520,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexShrink:0}}>
          <Icon name="download" size={16} color="var(--accent)"/>
          <span style={{fontWeight:700,fontSize:15,color:"var(--fg)"}}>Esporta calendario lezioni</span>
          <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm" style={{marginLeft:"auto"}}><Icon name="x" size={14}/></button>
        </div>
        <label className="label" style={{marginBottom:6,display:"block",flexShrink:0}}>Periodo</label>
        <div style={{marginBottom:16,flexShrink:0}}><MonthRangePicker value={period} onChange={setPeriod} months={allMonthKeys}/></div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexShrink:0}}>
          <label className="label" style={{margin:0}}>Corsi da includere</label>
          <button onClick={()=>setSelIds(anagraficaCorsi.map(a=>a.id))} style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer"}}>Tutti</button>
          <span style={{color:"var(--fg-subtle)",fontSize:11}}>·</span>
          <button onClick={()=>setSelIds([])} style={{fontSize:11,color:"var(--fg-subtle)",background:"none",border:"none",cursor:"pointer"}}>Nessuno</button>
          <span style={{marginLeft:"auto",fontSize:11,color:"var(--fg-subtle)"}}>{selIds.length}/{anagraficaCorsi.length}</span>
        </div>
        <div style={{overflowY:"auto",flex:1,minHeight:0,border:"1px solid var(--border)",borderRadius:"var(--radius)",background:"var(--bg-sunken)",marginBottom:16}}>
          {[...anagraficaCorsi].sort((a,b)=>a.nome.localeCompare(b.nome)).map(ana=>{
            const cnt=(corsiById[ana.id]?.events||[]).filter(e=>curMks.includes(e.month)).length;
            const chk=selIds.includes(ana.id);
            return(<label key={ana.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid var(--divider)",opacity:cnt===0?.45:1}}>
              <input type="checkbox" checked={chk} onChange={()=>toggleId(ana.id)} style={{accentColor:"var(--accent)",flexShrink:0}}/>
              <span style={{width:8,height:8,borderRadius:2,background:ana.colore||"var(--accent)",flexShrink:0}}/>
              <span style={{flex:1,fontSize:12,color:"var(--fg)",fontWeight:chk?600:400}}>{ana.nome}</span>
              <span style={{fontSize:11,color:cnt>0?"var(--fg-subtle)":"var(--danger)",fontFamily:'"JetBrains Mono",monospace'}}>{cnt} sess.</span>
            </label>);
          })}
        </div>
        {err&&<div style={{color:"var(--danger)",fontSize:12,marginBottom:8,flexShrink:0}}>{err}</div>}
        {generating&&progress?(
          <div style={{flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:"var(--fg-muted)",display:"flex",alignItems:"center",gap:6}}><Icon name="loader" size={12} color="var(--accent)"/>{progress.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:"var(--accent)",fontFamily:'"JetBrains Mono",monospace'}}>{progress.pct}%</span>
            </div>
            <div style={{height:9,borderRadius:999,background:"var(--bg-sunken)",border:"1px solid var(--border)",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${progress.pct}%`,background:"linear-gradient(90deg,var(--accent),#F5A35A)",borderRadius:999,transition:"width .25s ease"}}/>
            </div>
          </div>
        ):(
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexShrink:0}}>
            <button onClick={onClose} className="btn" data-variant="outline">Annulla</button>
            <button onClick={doExport} disabled={!selIds.length} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}>
              <Icon name="download" size={13} color="#fff"/>Esporta .docx
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── INSIGHTS SCREEN ───────────────────────────────────────────────────────
function InsightsScreen({corsi,anagraficaCorsi,avvisi=[],tutors,tutEvents,currentMonthKey,onClose,onNavigate}){
  const[viewMode,setViewMode]=useState("tutor");
  const[selPeriod,setSelPeriod]=useState({mode:"single",monthKey:currentMonthKey,year:MONTHS.find(m=>m.key===currentMonthKey)?.year||2026});
  const[selAvFilter,setSelAvFilter]=useState("");
  const[selTutFilter,setSelTutFilter]=useState("");
  const[expandedTut,setExpandedTut]=useState({});const[expandedTutAv,setExpandedTutAv]=useState({});const[expandedTutSlots,setExpandedTutSlots]=useState({});
  const[expandedAv,setExpandedAv]=useState({});const[expandedAvTut,setExpandedAvTut]=useState({});const[expandedAvLezioni,setExpandedAvLezioni]=useState({});
  const[selProgettoFilter,setSelProgettoFilter]=useState("");
  const[expandedProg,setExpandedProg]=useState({});const[expandedProgCo,setExpandedProgCo]=useState({});const[showExport,setShowExport]=useState(false);
  const corsiById=useMemo(()=>{const o={};corsi.forEach(co=>o[co.id]=co);return o;},[corsi]);
  function getMks(){if(selPeriod.mode==="single")return[selPeriod.monthKey];if(selPeriod.mode==="year")return MONTHS.filter(m=>m.year===selPeriod.year).map(m=>m.key);if(selPeriod.mode==="range"){const si=MONTHS.findIndex(m=>m.key===selPeriod.startKey),ei=MONTHS.findIndex(m=>m.key===selPeriod.endKey);if(si<0||ei<0)return[selPeriod.monthKey||currentMonthKey];return MONTHS.slice(Math.min(si,ei),Math.max(si,ei)+1).map(m=>m.key);}return[currentMonthKey];}
  const mks=useMemo(()=>getMks(),[selPeriod,currentMonthKey]);
  function getTutOrePeriodo(tId){let t=0;const td=tutEvents[tId]||{};for(const mk of mks)for(const ev of(td[mk]||[]))t+=ev.ore||0;return t;}
  function getTutOreAnno(tId,avName){let t=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)if(ev.name===avName)t+=(ev.ore||0);return t;}
  function getTutOreAvPeriodo(tId,avName){let t=0;const td=tutEvents[tId]||{};for(const mk of mks)t+=(td[mk]||[]).filter(e=>e.name===avName).reduce((s,e)=>s+e.ore,0);return t;}
  function getTutAvvisiPeriodo(tId){const n=new Set();const td=tutEvents[tId]||{};for(const mk of mks)for(const ev of(td[mk]||[]))n.add(ev.name);return[...n].sort();}
  function getTutTotOre(tId){let t=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)t+=ev.ore||0;return t;}
  function getAvOrePeriodo(anaId){const co=corsiById[anaId];if(!co)return 0;return co.events.filter(e=>mks.includes(e.month)).reduce((s,e)=>s+e.ore,0);}
  function getAvTotOre(anaId){const co=corsiById[anaId];if(!co)return 0;return co.events.reduce((s,e)=>s+e.ore,0);}
  function getTutsForAvPeriodo(avName){return[...tutors].filter(t=>mks.some(mk=>(tutEvents[t.id]?.[mk]||[]).some(e=>e.name===avName))).sort((a,b)=>a.cognome.localeCompare(b.cognome));}
  function getSlotsForTutAvMk(tId,avName,mk){return(tutEvents[tId]?.[mk]||[]).filter(e=>e.name===avName).sort((a,b)=>a.day-b.day||a.start-b.start);}
  function getSlotsForTutAvPeriodo(tId,avName){return mks.flatMap(mk=>getSlotsForTutAvMk(tId,avName,mk).map(sl=>({...sl,_mk:mk})));}
  function getProgettoCorsi(avvId){return anagraficaCorsi.filter(a=>a.avvisoId===avvId);}
  function getProgettoOrePeriodo(avvId){return getProgettoCorsi(avvId).reduce((s,a)=>s+getAvOrePeriodo(a.id),0);}
  function getProgettoTotOre(avvId){return getProgettoCorsi(avvId).reduce((s,a)=>s+getAvTotOre(a.id),0);}
  function getProgettoDurataOre(avvId){return getProgettoCorsi(avvId).reduce((s,a)=>s+(Number(a.durataOre)||0),0);}
  function getProgettoTutors(avvId){const s=new Set();for(const ana of getProgettoCorsi(avvId))for(const t of getTutsForAvPeriodo(ana.nome))s.add(t.id);return tutors.filter(t=>s.has(t.id));}
  const pctBadge=(ore,max)=>{if(!max)return null;const p=ore/max*100;return<span className="badge" data-tone={p>100?"danger":p>=80?"success":"info"}>{fmtPct(ore,max)}</span>;};
  const allMonthKeys=useMemo(()=>MONTHS.filter(m=>{const mk=m.key;const hasTut=tutors.some(t=>(tutEvents[t.id]?.[mk]||[]).length>0);const hasAv=anagraficaCorsi.some(a=>(corsiById[a.id]?.events||[]).some(e=>e.month===mk));return hasTut||hasAv;}).map(m=>m.key),[tutors,tutEvents,anagraficaCorsi,corsiById]);
  const totTutOre=useMemo(()=>tutors.reduce((s,t)=>s+getTutOrePeriodo(t.id),0),[tutors,tutEvents,mks]);
  const totAvOre=useMemo(()=>anagraficaCorsi.reduce((s,a)=>s+getAvOrePeriodo(a.id),0),[anagraficaCorsi,corsiById,mks]);
  const activeTutors=useMemo(()=>tutors.filter(t=>getTutOrePeriodo(t.id)>0),[tutors,tutEvents,mks]);
  const activeAvvisi=useMemo(()=>anagraficaCorsi.filter(a=>getAvOrePeriodo(a.id)>0),[anagraficaCorsi,corsiById,mks]);
  const totSlots=useMemo(()=>tutors.reduce((s,t)=>s+mks.reduce((s2,mk)=>s2+(tutEvents[t.id]?.[mk]||[]).length,0),0)+anagraficaCorsi.reduce((s,a)=>s+(corsiById[a.id]?.events||[]).filter(e=>mks.includes(e.month)).length,0),[tutors,anagraficaCorsi,tutEvents,corsiById,mks]);
  const activeProgetti=useMemo(()=>avvisi.filter(av=>getProgettoOrePeriodo(av.id)>0),[avvisi,anagraficaCorsi,corsiById,mks]);
  const totProgOre=useMemo(()=>avvisi.reduce((s,av)=>s+getProgettoOrePeriodo(av.id),0),[avvisi,anagraficaCorsi,corsiById,mks]);
  const RC=typeof window.Recharts!=="undefined"?window.Recharts:{};
  const safeColor=c=>(c&&c.startsWith("#"))?c:"#4f86c6";
  const chartDataTutor=useMemo(()=>[...tutors].filter(t=>getTutOrePeriodo(t.id)>0).sort((a,b)=>getTutOrePeriodo(b.id)-getTutOrePeriodo(a.id)).slice(0,8).map(t=>({name:`${t.cognome} ${t.nome[0]}.`,ore:getTutOrePeriodo(t.id),color:safeColor(t.color)})),[tutors,tutEvents,mks]);
  const chartDataAv=useMemo(()=>[...anagraficaCorsi].filter(a=>getAvOrePeriodo(a.id)>0).sort((a,b)=>getAvOrePeriodo(b.id)-getAvOrePeriodo(a.id)).slice(0,8).map(a=>({name:a.nome,ore:getAvOrePeriodo(a.id),color:safeColor(a.colore)})),[anagraficaCorsi,corsiById,mks]);
  const chartDataProg=useMemo(()=>[...avvisi].filter(av=>getProgettoOrePeriodo(av.id)>0).sort((a,b)=>getProgettoOrePeriodo(b.id)-getProgettoOrePeriodo(a.id)).slice(0,8).map(av=>{const c=getProgettoCorsi(av.id)[0];return{name:av.nome,ore:getProgettoOrePeriodo(av.id),color:safeColor(c?.colore)};}),[avvisi,anagraficaCorsi,corsiById,mks]);
  const chartData=viewMode==="tutor"?chartDataTutor:viewMode==="avviso"?chartDataAv:chartDataProg;
  function periodSubtitle(){if(selPeriod.mode==="year")return`Anno ${selPeriod.year}`;if(selPeriod.mode==="range"){const s=MONTHS.find(m=>m.key===selPeriod.startKey);const e=MONTHS.find(m=>m.key===selPeriod.endKey);return s&&e?`${MONTH_NAMES_SHORT[s.month]} → ${MONTH_NAMES_SHORT[e.month]} ${e.year}`:"";}return MONTHS.find(m=>m.key===selPeriod.monthKey)?.label||"";}
  function toggleTut(id){setExpandedTut(p=>({...p,[id]:!p[id]}))}
  function toggleTutAv(key){setExpandedTutAv(p=>({...p,[key]:!p[key]}))}
  function toggleAv(id){setExpandedAv(p=>({...p,[id]:!p[id]}))}
  function toggleAvTut(key){setExpandedAvTut(p=>({...p,[key]:!p[key]}))}
  function toggleAvLezioni(id){setExpandedAvLezioni(p=>({...p,[id]:!p[id]}))}
  function toggleTutSlots(id){setExpandedTutSlots(p=>({...p,[id]:!p[id]}))}
  function toggleProg(id){setExpandedProg(p=>({...p,[id]:!p[id]}))}
  function toggleProgCo(key){setExpandedProgCo(p=>({...p,[key]:!p[key]}))}
  return(<div className="drawer-overlay">
    <div className="drawer-backdrop" onClick={onClose}/>
    <div style={{width:"88%",maxWidth:900,background:"var(--bg-elev)",borderLeft:"1px solid var(--border)",boxShadow:"var(--shadow-lg)",display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"var(--bg-elev)"}}>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:18,color:"var(--fg)"}}>Insights</div><div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:2}}>{periodSubtitle()}</div></div>
        <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="x" size={16}/></button>
      </div>
      <div style={{padding:"10px 24px",borderBottom:"1px solid var(--border)",display:"flex",gap:10,alignItems:"center",flexShrink:0,background:"var(--bg-elev)"}}>
        <div className="tab-strip">
          <button className={`tab-strip-btn${viewMode==="tutor"?" active":""}`} onClick={()=>{setViewMode("tutor");setSelTutFilter("");}} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="user" size={12}/>Per tutor</button>
          <button className={`tab-strip-btn${viewMode==="avviso"?" active":""}`} onClick={()=>{setViewMode("avviso");setSelAvFilter("");}} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="briefcase" size={12}/>Per corso</button>
          <button className={`tab-strip-btn${viewMode==="progetto"?" active":""}`} onClick={()=>{setViewMode("progetto");setSelProgettoFilter("");}} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="file" size={12}/>Per avviso/progetto</button>
        </div>
        <button disabled={selPeriod.mode!=="single"} onClick={()=>{const idx=MONTHS.findIndex(m=>m.key===selPeriod.monthKey);if(idx>0)setSelPeriod({mode:"single",monthKey:MONTHS[idx-1].key,year:MONTHS[idx-1].year});}} className="btn" data-variant="ghost" data-size="icon-sm" title="Mese precedente"><Icon name="chevLeft" size={14}/></button>
        <MonthRangePicker value={selPeriod} onChange={setSelPeriod} months={allMonthKeys}/>
        <button disabled={selPeriod.mode!=="single"} onClick={()=>{const idx=MONTHS.findIndex(m=>m.key===selPeriod.monthKey);if(idx<MONTHS.length-1)setSelPeriod({mode:"single",monthKey:MONTHS[idx+1].key,year:MONTHS[idx+1].year});}} className="btn" data-variant="ghost" data-size="icon-sm" title="Mese successivo"><Icon name="chevRight" size={14}/></button>
        {viewMode==="tutor"
          ?<select className="select" value={selTutFilter} onChange={e=>setSelTutFilter(e.target.value)} style={{minWidth:160}}><option value="">Tutti i tutor</option>{[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=><option key={t.id} value={t.id}>{t.cognome} {t.nome}</option>)}</select>
          :viewMode==="avviso"
            ?<select className="select" value={selAvFilter} onChange={e=>setSelAvFilter(e.target.value)} style={{minWidth:160}}><option value="">Tutti i corsi</option>{anagraficaCorsi.map(a=><option key={a.id} value={a.nome}>{a.nome}</option>)}</select>
            :<select className="select" value={selProgettoFilter} onChange={e=>setSelProgettoFilter(e.target.value)} style={{minWidth:180}}><option value="">Tutti gli avvisi/progetti</option>{[...avvisi].sort((a,b)=>a.nome.localeCompare(b.nome)).map(av=><option key={av.id} value={av.id}>{av.nome}</option>)}</select>}
        {viewMode==="avviso"&&<button onClick={()=>setShowExport(true)} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="download" size={13}/>Esporta .docx</button>}
        <div style={{flex:1}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"14px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        {[{label:"TUTOR ATTIVI",val:activeTutors.length,icon:"users"},{label:"ORE PERIODO",val:fmtOreMin(viewMode==="tutor"?totTutOre:viewMode==="avviso"?totAvOre:totProgOre),icon:"clock"},{label:"SLOT TOTALI",val:totSlots,icon:"mapPin"},{label:"AVVISI ATTIVI",val:activeAvvisi.length,icon:"briefcase"}].map(k=><div key={k.label} style={{background:"var(--bg-sunken)",borderRadius:"var(--radius-md)",padding:"10px 14px",border:"1px solid var(--border)"}}>
          <div style={{fontSize:20,fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace',lineHeight:1}}>{k.val}</div>
          <div style={{fontSize:10,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginTop:4,display:"flex",alignItems:"center",gap:5}}><Icon name={k.icon} size={10} color="var(--fg-subtle)"/>{k.label}</div>
        </div>)}
      </div>
      {RC.BarChart&&chartData.length>0&&(viewMode!=="progetto"||!selProgettoFilter)&&<div style={{padding:"12px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>ORE {viewMode==="tutor"?"PER TUTOR":viewMode==="avviso"?"PER CORSO":"PER AVVISO/PROGETTO"} — {periodSubtitle()}</div>
        <RC.ResponsiveContainer width="100%" height={Math.max(80,chartData.length*32)}>
          <RC.BarChart data={chartData} layout="vertical" margin={{top:0,right:60,bottom:0,left:100}}>
            <RC.XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>fmtOreMin(v)} stroke="var(--border)"/>
            <RC.YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"var(--fg-muted)"}} width={100} stroke="none"/>
            <RC.Tooltip formatter={(v)=>[fmtOreMin(v),"Ore"]} contentStyle={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:6,fontSize:12}}/>
            <RC.Bar dataKey="ore" radius={[0,4,4,0]}>
              {chartData.map((d,i)=><RC.Cell key={i} fill={d.color}/>)}
            </RC.Bar>
          </RC.BarChart>
        </RC.ResponsiveContainer>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"16px 24px",background:"var(--bg)"}}>
        {viewMode==="tutor"&&[...tutors].filter(t=>!selTutFilter||t.id===selTutFilter).sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=>{
          const ore=getTutOrePeriodo(t.id);const avNames=getTutAvvisiPeriodo(t.id);const totOre=getTutTotOre(t.id);
          if(!ore&&!avNames.length)return null;
          const exp=expandedTut[t.id];
          return(<div key={t.id} style={{marginBottom:8,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)"}}>
            <button onClick={()=>toggleTut(t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
              <div style={{width:38,height:38,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:15,color:"var(--fg)"}}>{t.cognome} {t.nome}</div><div style={{fontSize:12,color:"var(--fg-muted)"}}>{avNames.length} corsi · {avNames.reduce((s,n)=>s+getSlotsForTutAvPeriodo(t.id,n).length,0)} slot</div></div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:600,fontSize:15,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace'}}>{fmtOreMin(ore)}</div><div style={{fontSize:11,color:"var(--fg-subtle)"}}>{fmtOreMin(totOre)} tot.</div></div>
              <Icon name={exp?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
            </button>
            {exp&&<div style={{padding:"8px 14px",borderTop:"1px solid var(--divider)"}}>
              {avNames.map(avName=>{const oreAv=getTutOreAvPeriodo(t.id,avName);const oreAnno=getTutOreAnno(t.id,avName);const ana=anagraficaCorsi.find(a=>a.nome===avName);const avKey=`${t.id}-${avName}`;const expAv=expandedTutAv[avKey];
                return(<div key={avName} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleTutAv(avKey)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <span style={{width:8,height:8,borderRadius:2,background:ana?.colore||"var(--accent)",flexShrink:0}}/>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>{avName}</span>
                    {ana?.durataOre?(()=>{const p=oreAnno/ana.durataOre*100;const tone=p>100?"danger":p>=80?"success":"info";return(<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}><span className="badge" data-tone={tone}>{fmtPct(oreAnno,ana.durataOre)}</span><span style={{fontSize:9,color:"var(--fg-subtle)"}}>su tot. da bando</span></div>);})():<span style={{fontSize:11,color:"var(--fg-subtle)"}}>—</span>}
                    <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:"var(--fg)"}}>{fmtOreMin(oreAv)}</span>
                    <Icon name={expAv?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expAv&&<div style={{padding:"6px 12px",borderTop:"1px solid var(--divider)",display:"flex",flexWrap:"wrap",gap:4}}>
                    {getSlotsForTutAvPeriodo(t.id,avName).map((sl,i)=>(
                      <button key={i} onClick={()=>onNavigate&&onNavigate(sl._mk||mks[0],sl.day)} style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:"var(--bg-sunken)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--fg-muted)",fontFamily:'"JetBrains Mono",monospace'}}>{fmtDayMonth(sl.day,sl._mk)} · {fmt(sl.start)}–{fmt(sl.end)}</button>
                    ))}
                  </div>}
                </div>);
              })}
              {(()=>{const allSlots=mks.flatMap(mk=>(tutEvents[t.id]?.[mk]||[]).map(sl=>({...sl,_mk:mk}))).sort((a,b)=>{const ai=mks.indexOf(a._mk),bi=mks.indexOf(b._mk);return ai!==bi?ai-bi:a.day-b.day||a.start-b.start;});if(!allSlots.length)return null;const expS=expandedTutSlots[t.id];
                return(<div style={{marginTop:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleTutSlots(t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <Icon name="calendar" size={12} color="var(--fg-subtle)"/>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>Slot pianificati</span>
                    <span style={{fontSize:11,color:"var(--fg-subtle)",marginRight:4}}>{allSlots.length}</span>
                    <Icon name={expS?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expS&&<div style={{borderTop:"1px solid var(--divider)"}}>
                    {allSlots.map((sl,i)=><button key={sl.id||i} onClick={()=>onNavigate&&onNavigate(sl._mk,sl.day)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"none",border:"none",borderBottom:"1px solid var(--divider)",cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-sunken)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:"var(--fg-muted)",minWidth:70,flexShrink:0}}>{fmtDayMonth(sl.day,sl._mk)}</span>
                      <span style={{width:8,height:8,borderRadius:2,background:(anagraficaCorsi.find(a=>a.nome===sl.name)?.colore)||"var(--accent)",flexShrink:0}}/>
                      <span style={{flex:1,fontSize:11,color:"var(--fg)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sl.name}</span>
                      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:"var(--fg-muted)",flexShrink:0}}>{fmt(sl.start)}–{fmt(sl.end)}</span>
                      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:"var(--fg-subtle)",minWidth:36,textAlign:"right",flexShrink:0}}>{fmtOreMin(sl.ore||0)}</span>
                      {sl.verified&&<Icon name="check" size={10} color="var(--success)"/>}
                    </button>)}
                  </div>}
                </div>);
              })()}
            </div>}
          </div>);
        })}
        {viewMode==="avviso"&&[...anagraficaCorsi].filter(a=>!selAvFilter||a.nome===selAvFilter).sort((a,b)=>a.nome.localeCompare(b.nome)).map(ana=>{
          const oreAv=getAvOrePeriodo(ana.id);const tuts=getTutsForAvPeriodo(ana.nome);
          if(!oreAv&&!tuts.length)return null;
          const exp=expandedAv[ana.id];const totOre=getAvTotOre(ana.id);const pct=ana.durataOre?Math.round(totOre/ana.durataOre*100):null;
          return(<div key={ana.id} style={{marginBottom:8,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)"}}>
            <button onClick={()=>toggleAv(ana.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
              <span style={{width:10,height:10,borderRadius:3,background:ana.colore||"var(--accent)",flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{ana.nome}</div><div style={{fontSize:11,color:"var(--fg-subtle)"}}>{tuts.length} tutor{ana.durataOre?` · ${fmtOreMin(totOre)}/${fmtOreMin(ana.durataOre)}`:""}</div></div>
              {ana.durataOre?<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}><span className="badge" data-tone={pct>100?"danger":pct>=80?"success":"info"}>{fmtPct(totOre,ana.durataOre)}</span><span style={{fontSize:9,color:"var(--fg-subtle)"}}>pianificato su tot.</span></div>:<span style={{fontSize:11,color:"var(--fg-subtle)"}}>—</span>}
              <span style={{fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace',fontSize:13}}>{fmtOreMin(oreAv)}</span>
              <Icon name={exp?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
            </button>
            {exp&&<div style={{padding:"8px 14px",borderTop:"1px solid var(--divider)"}}>
              {ana.durataOre&&pct!=null&&(()=>{const tutOreAv=tutors.reduce((s,t)=>s+getTutOreAvPeriodo(t.id,ana.nome),0);const tutPct=Math.round(tutOreAv/ana.durataOre*100);const avOrePeriodo=getAvOrePeriodo(ana.id);const avPeriodoPct=Math.round(avOrePeriodo/ana.durataOre*100);const periodLabel=periodSubtitle();return(<div style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid var(--divider)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Ore pianificate</span><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:pct>100?"var(--danger)":"var(--fg)"}}>{pct}% · {fmtOreMin(totOre)}/{fmtOreMin(ana.durataOre)}</span></div>
                <div className="progress-bar-track" style={{height:6,marginBottom:10}}><div className="progress-bar-fill" style={{width:`${Math.min(100,pct)}%`,background:`linear-gradient(90deg,${ana.colore||"var(--accent)"}bb,${ana.colore||"var(--accent)"})`}}/></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Avanzamento ore corso</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:9,color:"var(--fg-subtle)",fontStyle:"italic"}}>{periodLabel}</span><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:avPeriodoPct>100?"var(--danger)":"var(--fg)"}}>{avPeriodoPct}% · {fmtOreMin(avOrePeriodo)}/{fmtOreMin(ana.durataOre)}</span></div></div>
                <div className="progress-bar-track" style={{height:6,marginBottom:10}}><div className="progress-bar-fill" style={{width:`${Math.min(100,avPeriodoPct)}%`,background:`linear-gradient(90deg,${ana.colore||"var(--accent)"}88,${ana.colore||"var(--accent)"}bb)`}}/></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Ore tutor assegnati</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:9,color:"var(--fg-subtle)",fontStyle:"italic"}}>{periodLabel}</span><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:tutPct>100?"var(--danger)":"var(--fg)"}}>{tutPct}% · {fmtOreMin(tutOreAv)}/{fmtOreMin(ana.durataOre)}</span></div></div>
                <div className="progress-bar-track" style={{height:6}}><div className="progress-bar-fill" style={{width:`${Math.min(100,tutPct)}%`,background:`linear-gradient(90deg,${ana.colore||"var(--accent)"}44,${ana.colore||"var(--accent)"}77)`}}/></div>
              </div>);})()}
              {tuts.map(t=>{const oreT=getSlotsForTutAvPeriodo(t.id,ana.nome).reduce((s,e)=>s+e.ore,0);const avKey=`${ana.id}-${t.id}`;const expT=expandedAvTut[avKey];
                return(<div key={t.id} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleAvTut(avKey)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <div style={{width:22,height:22,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>{t.cognome} {t.nome}</span>
                    <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:"var(--fg)"}}>{fmtOreMin(oreT)}</span>
                    <Icon name={expT?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expT&&<div style={{padding:"6px 12px",borderTop:"1px solid var(--divider)",display:"flex",flexWrap:"wrap",gap:4}}>
                    {getSlotsForTutAvPeriodo(t.id,ana.nome).map((sl,i)=>(
                      <button key={i} onClick={()=>onNavigate&&onNavigate(sl._mk||mks[0],sl.day)} style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:"var(--bg-sunken)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--fg-muted)",fontFamily:'"JetBrains Mono",monospace'}}>{fmtDayMonth(sl.day,sl._mk)} · {fmt(sl.start)}–{fmt(sl.end)}</button>
                    ))}
                  </div>}
                </div>);
              })}
              {(()=>{const events=(corsiById[ana.id]?.events||[]).filter(e=>mks.includes(e.month)).sort((a,b)=>{const ai=mks.indexOf(a.month),bi=mks.indexOf(b.month);return ai!==bi?ai-bi:a.day-b.day||a.start-b.start;});if(!events.length)return null;const expL=expandedAvLezioni[ana.id];
                return(<div style={{marginTop:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleAvLezioni(ana.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <Icon name="calendar" size={12} color="var(--fg-subtle)"/>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>Lezioni pianificate</span>
                    <span style={{fontSize:11,color:"var(--fg-subtle)",marginRight:4}}>{events.length}</span>
                    <Icon name={expL?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expL&&<div style={{borderTop:"1px solid var(--divider)"}}>
                    {events.map((ev,i)=><button key={ev.id||i} onClick={()=>onNavigate&&onNavigate(ev.month,ev.day)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"none",border:"none",borderBottom:"1px solid var(--divider)",cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-sunken)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:"var(--fg-muted)",minWidth:70,flexShrink:0}}>{fmtDayMonth(ev.day,ev.month)}</span>
                      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:"var(--fg-muted)",flex:1}}>{fmt(ev.start)}–{fmt(ev.end)}</span>
                      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:"var(--fg-subtle)",minWidth:36,textAlign:"right",flexShrink:0}}>{fmtOreMin(ev.ore||0)}</span>
                      {ev.verified&&<Icon name="check" size={10} color="var(--success)"/>}
                    </button>)}
                  </div>}
                </div>);
              })()}
            </div>}
          </div>);
        })}
        {viewMode==="progetto"&&[...avvisi].filter(av=>!selProgettoFilter||av.id===selProgettoFilter).sort((a,b)=>a.nome.localeCompare(b.nome)).map(av=>{
          const corsiAv=getProgettoCorsi(av.id);const oreAv=getProgettoOrePeriodo(av.id);const tutorsAv=getProgettoTutors(av.id);
          if(!oreAv&&!tutorsAv.length)return null;
          const totOre=getProgettoTotOre(av.id);const durataOre=getProgettoDurataOre(av.id);const pct=durataOre?Math.round(totOre/durataOre*100):null;
          const exp=expandedProg[av.id];const firstColor=corsiAv[0]?.colore||"var(--accent)";
          return(<div key={av.id} style={{marginBottom:8,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)"}}>
            <button onClick={()=>toggleProg(av.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
              <span style={{width:10,height:10,borderRadius:3,background:firstColor,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{av.nome}</div><div style={{fontSize:11,color:"var(--fg-subtle)"}}>{corsiAv.length} corsi · {tutorsAv.length} tutor{av.ente?` · ${av.ente}`:""}</div></div>
              {durataOre&&pct!=null?<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}><span className="badge" data-tone={pct>100?"danger":pct>=80?"success":"info"}>{pct}%</span><span style={{fontSize:9,color:"var(--fg-subtle)"}}>avanz. globale</span></div>:<span style={{fontSize:11,color:"var(--fg-subtle)"}}>—</span>}
              <span style={{fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace',fontSize:13,marginLeft:8}}>{fmtOreMin(oreAv)}</span>
              <Icon name={exp?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
            </button>
            {exp&&<div style={{padding:"8px 14px",borderTop:"1px solid var(--divider)"}}>
              {durataOre&&pct!=null&&(()=>{const tutOreAv=tutorsAv.reduce((s,t)=>s+corsiAv.reduce((s2,ana)=>s2+getTutOreAvPeriodo(t.id,ana.nome),0),0);const tutPct=Math.round(tutOreAv/durataOre*100);const avPct=Math.round(oreAv/durataOre*100);return(<div style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid var(--divider)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Ore totali pianificate</span><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:pct>100?"var(--danger)":"var(--fg)"}}>{pct}% · {fmtOreMin(totOre)}/{fmtOreMin(durataOre)}</span></div>
                <div className="progress-bar-track" style={{height:6,marginBottom:10}}><div className="progress-bar-fill" style={{width:`${Math.min(100,pct)}%`,background:`linear-gradient(90deg,${firstColor}bb,${firstColor})`}}/></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Ore corso nel periodo</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:9,color:"var(--fg-subtle)",fontStyle:"italic"}}>{periodSubtitle()}</span><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:avPct>100?"var(--danger)":"var(--fg)"}}>{avPct}% · {fmtOreMin(oreAv)}/{fmtOreMin(durataOre)}</span></div></div>
                <div className="progress-bar-track" style={{height:6,marginBottom:10}}><div className="progress-bar-fill" style={{width:`${Math.min(100,avPct)}%`,background:`linear-gradient(90deg,${firstColor}88,${firstColor}bb)`}}/></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Ore tutor assegnati</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:9,color:"var(--fg-subtle)",fontStyle:"italic"}}>{periodSubtitle()}</span><span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:tutPct>100?"var(--danger)":"var(--fg)"}}>{tutPct}% · {fmtOreMin(tutOreAv)}/{fmtOreMin(durataOre)}</span></div></div>
                <div className="progress-bar-track" style={{height:6}}><div className="progress-bar-fill" style={{width:`${Math.min(100,tutPct)}%`,background:`linear-gradient(90deg,${firstColor}44,${firstColor}77)`}}/></div>
              </div>);})()}
              {corsiAv.map(ana=>{
                const oreAnaCo=getAvOrePeriodo(ana.id);const totOreAnaCo=getAvTotOre(ana.id);const pctAnaCo=ana.durataOre?Math.round(totOreAnaCo/ana.durataOre*100):null;const tutsAnaCo=getTutsForAvPeriodo(ana.nome);const progCoKey=`${av.id}-${ana.id}`;const expCo=expandedProgCo[progCoKey];
                return(<div key={ana.id} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleProgCo(progCoKey)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <span style={{width:8,height:8,borderRadius:2,background:ana.colore||"var(--accent)",flexShrink:0}}/>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>{ana.nome}</span>
                    <span style={{fontSize:10.5,color:"var(--fg-subtle)",marginRight:6}}>{tutsAnaCo.length} tutor</span>
                    {pctAnaCo!=null?<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1}}><span className="badge" data-tone={pctAnaCo>100?"danger":pctAnaCo>=80?"success":"info"}>{fmtPct(totOreAnaCo,ana.durataOre)}</span><span style={{fontSize:9,color:"var(--fg-subtle)"}}>su bando</span></div>:<span style={{fontSize:11,color:"var(--fg-subtle)"}}>—</span>}
                    <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:"var(--fg)",marginLeft:6}}>{fmtOreMin(oreAnaCo)}</span>
                    <Icon name={expCo?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expCo&&<div style={{padding:"8px 14px",borderTop:"1px solid var(--divider)"}}>
                    {tutsAnaCo.map(t=>{const oreT=getSlotsForTutAvPeriodo(t.id,ana.nome).reduce((s,e)=>s+e.ore,0);const tutKey=`${progCoKey}-${t.id}`;const expTut=expandedProgCo[tutKey];
                      return(<div key={t.id} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                        <button onClick={()=>toggleProgCo(tutKey)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                          <div style={{width:22,height:22,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
                          <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>{t.cognome} {t.nome}</span>
                          <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:"var(--fg)"}}>{fmtOreMin(oreT)}</span>
                          <Icon name={expTut?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                        </button>
                        {expTut&&<div style={{padding:"6px 12px",borderTop:"1px solid var(--divider)",display:"flex",flexWrap:"wrap",gap:4}}>
                          {getSlotsForTutAvPeriodo(t.id,ana.nome).map((sl,i)=>(
                            <button key={i} onClick={()=>onNavigate&&onNavigate(sl._mk||mks[0],sl.day)} style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:"var(--bg-sunken)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--fg-muted)",fontFamily:'"JetBrains Mono",monospace'}}>{fmtDayMonth(sl.day,sl._mk)} · {fmt(sl.start)}–{fmt(sl.end)}</button>
                          ))}
                        </div>}
                      </div>);
                    })}
                  </div>}
                </div>);
              })}
            </div>}
          </div>);
        })}
      </div>
    </div>
    {showExport&&<ExportInsightsModal anagraficaCorsi={anagraficaCorsi} corsiById={corsiById} avvisi={avvisi} allMonthKeys={allMonthKeys} currentMonthKey={currentMonthKey} onClose={()=>setShowExport(false)}/>}
  </div>);
}

// ── CUSTOMIZE PANEL ───────────────────────────────────────────────────────
function CustomizePanel({settings,theme,setTheme,onSaveSettings}){
  const[logoB64,setLogoB64]=useState(settings.logoBase64||"");
  const[logoWhiteB64,setLogoWhiteB64]=useState(settings.logoWhiteBase64||"");
  const[appSubtitle,setAppSubtitle]=useState(settings.appSubtitle||"");
  const[primaryColor,setPrimaryState]=useState(settings.brandNavy||"#1E2248");
  const[primaryInput,setPrimaryInput]=useState(settings.brandNavy||"#1E2248");
  const[accentColor,setAccentState]=useState(settings.accentColor||"#EC7A26");
  const[accentInput,setAccentInput]=useState(settings.accentColor||"#EC7A26");
  const[bgColor,setBgState]=useState(settings.bgColor||"#F8F7F4");
  const[bgInput,setBgInput]=useState(settings.bgColor||"#F8F7F4");
  const[defaultCalView,setDefaultCalView]=useState(settings.defaultCalView||"day");
  const[defaultCalMode,setDefaultCalMode]=useState(settings.defaultCalMode||"avviso");
  const[defaultZoom,setDefaultZoom]=useState(settings.defaultZoom??2);
  const[saved,setSaved]=useState(false);
  const logoFileRef=useRef();const logoWhiteFileRef=useRef();
  const primaryColorRef=useRef();const accentColorRef=useRef();const bgColorRef=useRef();
  function applyAccent(c){if(!/^#[0-9A-Fa-f]{6}$/.test(c))return;document.documentElement.style.setProperty("--accent",c);document.documentElement.style.setProperty("--accent-strong",darkenHex(c,.15));document.documentElement.style.setProperty("--accent-soft",hexToRgba(c,.12));}
  function applyPrimary(c){if(!/^#[0-9A-Fa-f]{6}$/.test(c))return;document.documentElement.style.setProperty("--brand-navy",c);}
  function applyBg(c){if(c&&/^#[0-9A-Fa-f]{6}$/.test(c)&&document.documentElement.getAttribute("data-theme")!=="dark")document.documentElement.style.setProperty("--bg",c);}
  function setAccent(c){setAccentState(c);setAccentInput(c);applyAccent(c);}
  function setPrimary(c){setPrimaryState(c);setPrimaryInput(c);applyPrimary(c);}
  function setBg(c){setBgState(c);setBgInput(c);applyBg(c);}
  function handleLogoFile(e){const f=e.target.files[0];if(!f)return;if(f.size>2*1024*1024){alert("File troppo grande (max 2 MB)");e.target.value="";return;}const r=new FileReader();r.onload=ev=>setLogoB64(ev.target.result);r.readAsDataURL(f);e.target.value="";}
  function handleLogoWhiteFile(e){const f=e.target.files[0];if(!f)return;if(f.size>2*1024*1024){alert("File troppo grande (max 2 MB)");e.target.value="";return;}const r=new FileReader();r.onload=ev=>setLogoWhiteB64(ev.target.result);r.readAsDataURL(f);e.target.value="";}
  async function handleSave(){
    const prefs={accentColor,brandNavy:primaryColor,bgColor,defaultCalView,defaultCalMode,defaultZoom,theme,logoBase64:logoB64,logoWhiteBase64:logoWhiteB64,appSubtitle};
    await onSaveSettings(prefs);applyAccent(accentColor);applyPrimary(primaryColor);if(bgColor)applyBg(bgColor);setSaved(true);setTimeout(()=>setSaved(false),2000);
  }
  const isHex=v=>/^#[0-9A-Fa-f]{6}$/.test(v);
  const cardStyle={background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:24,boxShadow:"var(--shadow-xs)",marginBottom:20};
  const hdrStyle={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16};
  const lblStyle={fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"};
  const hintStyle={fontSize:11,color:"var(--fg-subtle)"};
  const colorCols=[
    {label:"PRIMARIO",val:primaryColor,input:primaryInput,setInput:setPrimaryInput,set:setPrimary,ref:primaryColorRef,default:"#1E2248"},
    {label:"ACCENTO",val:accentColor,input:accentInput,setInput:setAccentInput,set:setAccent,ref:accentColorRef,default:"#EC7A26"},
    {label:"SFONDO",val:bgColor,input:bgInput,setInput:setBgInput,set:setBg,ref:bgColorRef,default:"#F8F7F4"},
  ];
  const prefRows=[
    {label:"Tema",desc:"Chiaro o scuro in tutta l'app",content:<div style={{display:"flex",gap:4,padding:3,background:"var(--bg-sunken)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}><button onClick={()=>setTheme("light")} className={`theme-btn${theme==="light"?" active":""}`} style={{display:"flex",alignItems:"center",gap:5}}><Icon name="sun" size={12}/>Chiaro</button><button onClick={()=>setTheme("dark")} className={`theme-btn${theme==="dark"?" active":""}`} style={{display:"flex",alignItems:"center",gap:5}}><Icon name="moon" size={12}/>Scuro</button></div>},
    {label:"Vista default",desc:"Vista all'apertura dell'app — ricaricare la pagina per apportare la modifica",content:<div style={{display:"flex",gap:6}}>{[{v:"month",label:"Mese"},{v:"week",label:"Sett."},{v:"day",label:"Giorno"}].map(o=><button key={o.v} onClick={()=>setDefaultCalView(o.v)} style={{padding:"5px 10px",borderRadius:"var(--radius)",border:`1.5px solid ${defaultCalView===o.v?"var(--accent)":"var(--border)"}`,background:defaultCalView===o.v?"var(--accent-soft)":"transparent",color:defaultCalView===o.v?"var(--accent-strong)":"var(--fg)",fontWeight:600,fontSize:12,cursor:"pointer"}}>{o.v==="month"?"Mese":o.v==="week"?"Sett.":"Giorno"}</button>)}</div>},
    {label:"Calendario default",desc:"Modalità attiva all'apertura del calendario",content:<div style={{display:"flex",gap:6}}>{[{v:"avviso",label:"Corsi"},{v:"tutoraggio",label:"Tutoraggi"}].map(o=><button key={o.v} onClick={()=>setDefaultCalMode(o.v)} style={{padding:"5px 12px",borderRadius:"var(--radius)",border:`1.5px solid ${defaultCalMode===o.v?"var(--accent)":"var(--border)"}`,background:defaultCalMode===o.v?"var(--accent-soft)":"transparent",color:defaultCalMode===o.v?"var(--accent-strong)":"var(--fg)",fontWeight:600,fontSize:12,cursor:"pointer"}}>{o.label}</button>)}</div>},
    {label:"Zoom default",desc:"Livello di zoom all'apertura — ricaricare la pagina per apportare la modifica",content:<select className="select" value={defaultZoom} onChange={e=>setDefaultZoom(Number(e.target.value))} style={{width:100}}>{ZOOM_LEVELS.map((z,i)=><option key={i} value={i}>{Math.round(z*100)}%</option>)}</select>},
  ];
  return(<div style={{maxWidth:720}}>
    {/* Card 1: LOGO */}
    <div style={cardStyle}>
      <div style={hdrStyle}><span style={lblStyle}>LOGO</span><span style={hintStyle}>PNG, SVG · max 2 MB · sfondo trasparente</span></div>
      <div style={{display:"flex",gap:16,marginBottom:16}}>
        <div style={{flex:1,background:"#F1EFE8",borderRadius:"var(--radius)",padding:24,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)"}}>
          <img src={logoB64||"assets/appmark-color.png"} alt="Logo chiaro" style={{height:48,objectFit:"contain"}}/>
        </div>
        <div style={{flex:1,background:"var(--brand-navy)",borderRadius:"var(--radius)",padding:24,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)"}}>
          <img src={logoWhiteB64||"assets/appmark-white.png"} alt="Logo scuro" style={{height:48,objectFit:"contain"}}/>
        </div>
        <div style={{flex:1,paddingLeft:4,display:"flex",flexDirection:"column",justifyContent:"center",gap:8}}>
          <p style={{fontSize:12,color:"var(--fg-muted)",marginBottom:4,lineHeight:1.5}}>Carica il logo per sfondo chiaro e scuro.</p>
          <button className="btn" data-variant="accent" onClick={()=>logoFileRef.current.click()} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="upload" size={13} color="#fff"/>Logo chiaro</button>
          <button className="btn" data-variant="outline" onClick={()=>logoWhiteFileRef.current.click()} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="upload" size={13}/>Logo scuro</button>
          {(logoB64||logoWhiteB64)&&<button className="btn" data-variant="ghost" onClick={()=>{setLogoB64("");setLogoWhiteB64("");}} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="rotateCcw" size={13}/>Reset</button>}
          <input ref={logoFileRef} type="file" accept=".png,.svg,.jpg,.jpeg" style={{display:"none"}} onChange={handleLogoFile}/>
          <input ref={logoWhiteFileRef} type="file" accept=".png,.svg,.jpg,.jpeg" style={{display:"none"}} onChange={handleLogoWhiteFile}/>
        </div>
      </div>
      <div><label className="label">Sottotitolo app</label><input className="input" value={appSubtitle} onChange={e=>setAppSubtitle(e.target.value)} placeholder="EHT · Harmonic Innovation Group"/><p style={{fontSize:11,color:"var(--fg-subtle)",marginTop:4}}>Appare nella pagina di login sotto il nome dell'app.</p></div>
    </div>
    {/* Card 2: COLORI */}
    <div style={cardStyle}>
      <div style={hdrStyle}><span style={lblStyle}>COLORI</span><span style={hintStyle}>I tre colori brand applicati in tutta l'interfaccia</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
        {colorCols.map(c=>(
          <div key={c.label}>
            <div onClick={()=>c.ref.current&&c.ref.current.click()} style={{height:80,borderRadius:"var(--radius-md)",background:isHex(c.val)?c.val:"var(--bg-sunken)",border:"1px solid var(--border)",cursor:"pointer",marginBottom:8}}/>
            <input ref={c.ref} type="color" value={isHex(c.val)?c.val:"#cccccc"} onChange={e=>c.set(e.target.value)} style={{position:"absolute",opacity:0,width:1,height:1,pointerEvents:"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:600,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".04em"}}>{c.label}</span>
              <span style={{fontSize:10,color:"var(--fg-subtle)"}}>HEX</span>
            </div>
            <input className="input mono" value={c.input} onChange={e=>{c.setInput(e.target.value);if(isHex(e.target.value))c.set(e.target.value);}} maxLength={7} style={{fontSize:12,textAlign:"center"}}/>
          </div>
        ))}
      </div>
      <div style={{background:"var(--bg-sunken)",borderRadius:"var(--radius)",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginRight:4}}>ANTEPRIMA</span>
        <button className="btn" style={{background:isHex(primaryColor)?primaryColor:"var(--brand-navy)",color:"#fff",border:"none",fontSize:12,padding:"4px 12px",cursor:"default"}}>Pulsante primario</button>
        <button className="btn" style={{background:isHex(accentColor)?accentColor:"var(--accent)",color:"#fff",border:"none",fontSize:12,padding:"4px 12px",cursor:"default"}}>Pulsante secondario</button>
        <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:100,border:`1px solid ${isHex(accentColor)?accentColor:"var(--accent)"}`,color:isHex(accentColor)?accentColor:"var(--accent)",fontSize:11,fontWeight:600}}>Badge</span>
        <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:100,background:isHex(primaryColor)?primaryColor:"var(--brand-navy)",color:"#fff",fontSize:11,fontWeight:600}}>Badge Navy</span>
      </div>
    </div>
    {/* Card 3: PREFERENZE */}
    <div style={cardStyle}>
      <div style={hdrStyle}><span style={lblStyle}>PREFERENZE</span></div>
      {prefRows.map((row,i,arr)=>(
        <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<arr.length-1?"1px solid var(--divider)":"none"}}>
          <div><div style={{fontSize:13,fontWeight:600,color:"var(--fg)"}}>{row.label}</div><div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:2}}>{row.desc}</div></div>
          {row.content}
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <button className="btn" data-variant="accent" onClick={handleSave} style={{display:"flex",alignItems:"center",gap:6}}>{saved?<><Icon name="check" size={14} color="#fff"/>Salvato</>:<><Icon name="save" size={14} color="#fff"/>Salva preferenze</>}</button>
      </div>
    </div>
  </div>);
}

// ── GESTIONE PERMESSI ─────────────────────────────────────────────────────
function GestionePermessi({rolePermissions,onSave}){
  const[local,setLocal]=useState(()=>{const d={};for(const r of["viewer","user","admin"])d[r]={...(DEFAULT_ROLE_PERMS[r]||{}),...((rolePermissions||{})[r]||{})};return d;});
  const[saving,setSaving]=useState(false);const[saved,setSaved]=useState(false);
  const GROUPS=[
    {label:"Calendario",icon:"calendar",items:[
      {key:"addSlot",label:"Aggiunge slot",desc:"Crea nuovi slot tutoraggi e corsi"},
      {key:"editSlot",label:"Modifica slot non verificati",desc:"Modifica orari, tutor, corso degli slot liberi"},
      {key:"deleteSlot",label:"Elimina slot",desc:"Rimuove slot non verificati dal calendario"},
      {key:"editVerified",label:"Modifica slot verificati",desc:"Può toccare slot già verificati da un admin"},
      {key:"verifySlot",label:"Verifica / de-verifica slot",desc:"Mostra la checkbox di verifica nel modale di modifica"},
      {key:"bulkVerify",label:"Verifica massiva corso / tutor",desc:"Verifica in blocco tutti gli slot di un corso o tutor dall'anagrafica"},
    ]},
    {label:"Strumenti",icon:"sparkles",items:[
      {key:"useAiImport",label:"Usa AI Import",desc:"Accesso all'assistente di importazione automatica da documenti"},
      {key:"useInsights",label:"Insights & Riepiloghi",desc:"Accesso al pannello statistiche e analisi mensili"},
      {key:"useVerifica",label:"Verifica coerenza",desc:"Accesso al pannello di controllo e rilevamento anomalie"},
    ]},
    {label:"Anagrafica",icon:"users",items:[
      {key:"editAnagrafica",label:"Modifica tutors, corsi e avvisi",desc:"Crea, modifica, elimina tutor, corsi e avvisi in anagrafica"},
    ]},
    {label:"Dati & Impostazioni",icon:"activity",items:[
      {key:"viewLog",label:"Visualizza log attività",desc:"Accesso allo storico delle modifiche"},
      {key:"viewBackup",label:"Backup ed export",desc:"Accesso al tab backup e snapshot del database"},
      {key:"editSettings",label:"Modifica impostazioni app",desc:"Nome app, logo, colori, API key e personalizzazione"},
      {key:"manageDemo",label:"Dati demo e reset DB",desc:"Carica dati di esempio o svuota completamente il database"},
    ]},
  ];
  const ROLES=[{key:"viewer",label:"Viewer",tone:"default",icon:"eye"},{key:"user",label:"Utente",tone:"info",icon:"user"},{key:"admin",label:"Admin",tone:"accent",icon:"shieldCheck"}];
  function toggle(role,key){setLocal(p=>({...p,[role]:{...p[role],[key]:!p[role][key]}}));setSaved(false);}
  async function handleSave(){setSaving(true);await onSave(local);setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500);}
  function handleReset(){const d={};for(const r of["viewer","user","admin"])d[r]={...DEFAULT_ROLE_PERMS[r]};setLocal(d);setSaved(false);}
  return(<div style={{maxWidth:780}}>
    <div style={{marginBottom:20}}>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--fg)"}}>Gestione permessi</h2>
      <p style={{fontSize:13,color:"var(--fg-muted)"}}>Personalizza cosa può fare ogni ruolo. Le modifiche hanno effetto immediato per tutti gli utenti.</p>
    </div>
    <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 14px",background:"var(--info-soft)",border:"1px solid rgba(62,111,184,.18)",borderRadius:"var(--radius)",marginBottom:22}}>
      <Icon name="info" size={14} color="var(--info)" style={{flexShrink:0,marginTop:1}}/>
      <span style={{fontSize:12.5,color:"var(--info)",lineHeight:1.45}}>Il ruolo <strong>Superadmin</strong> ha sempre tutti i permessi e non è modificabile. Le modifiche si applicano istantaneamente senza riavvio sessione.</span>
    </div>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",boxShadow:"var(--shadow-xs)",overflow:"hidden",marginBottom:20}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th style={{padding:"10px 18px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",background:"var(--bg-sunken)",borderBottom:"2px solid var(--border)",width:"44%"}}>Permesso</th>
            {ROLES.map(r=><th key={r.key} style={{padding:"10px 14px",background:"var(--bg-sunken)",borderBottom:"2px solid var(--border)",textAlign:"center",minWidth:100}}><span className="badge" data-tone={r.tone} style={{margin:"0 auto"}}><Icon name={r.icon} size={10}/>{r.label}</span></th>)}
            <th style={{padding:"10px 14px",background:"rgba(192,57,43,.04)",borderBottom:"2px solid var(--border)",textAlign:"center",minWidth:100}}><span className="badge" data-tone="danger" style={{margin:"0 auto"}}><Icon name="star" size={10}/>Superadmin</span></th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((g,gi)=>[
            <tr key={`g${gi}`}><td colSpan={5} style={{padding:"6px 18px 4px",background:"var(--bg-sunken)",borderBottom:"1px solid var(--divider)"}}><span style={{fontSize:10.5,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".07em",display:"flex",alignItems:"center",gap:6}}><Icon name={g.icon} size={11}/>{g.label}</span></td></tr>,
            ...g.items.map((item,ii)=><tr key={`${gi}-${ii}`}>
              <td style={{padding:"11px 18px",borderBottom:"1px solid var(--divider)"}}><div style={{fontSize:12.5,fontWeight:500,color:"var(--fg)"}}>{item.label}</div><div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:2}}>{item.desc}</div></td>
              {ROLES.map(r=><td key={r.key} style={{padding:"11px 14px",borderBottom:"1px solid var(--divider)",textAlign:"center"}}><label style={{display:"inline-block",position:"relative",width:34,height:20,cursor:"pointer"}}><input type="checkbox" checked={!!local[r.key]?.[item.key]} onChange={()=>toggle(r.key,item.key)} style={{opacity:0,width:0,height:0,position:"absolute"}}/><span style={{position:"absolute",inset:0,borderRadius:100,background:local[r.key]?.[item.key]?"var(--success)":"var(--border-strong)",transition:"background .15s",cursor:"pointer"}}/><span style={{position:"absolute",top:3,left:local[r.key]?.[item.key]?17:3,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 2px rgba(0,0,0,.2)"}}/></label></td>)}
              <td style={{padding:"11px 14px",borderBottom:"1px solid var(--divider)",textAlign:"center",background:"rgba(192,57,43,.03)"}}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:6,background:"var(--danger-soft)"}}><Icon name="check" size={12} color="var(--danger)"/></span></td>
            </tr>)
          ])}
        </tbody>
      </table>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button className="btn" data-variant="primary" onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={13} color="#fff"/>Salvataggio...</>:saved?<><Icon name="check" size={13} color="#fff"/>Salvato</>:<><Icon name="save" size={13} color="#fff"/>Salva permessi</>}</button>
      <button className="btn" data-variant="outline" onClick={handleReset} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="refresh" size={13}/>Ripristina default</button>
    </div>
  </div>);
}
// ── SETTINGS SCREEN ───────────────────────────────────────────────────────
function SettingsScreen({role,settings,corsi,tutors,tutEvents,anagraficaCorsi,onSaveSettings,isSuperAdmin,isAdmin,isUser,perms,theme,setTheme,currentUser,profileTarget}){
  const firstSec=profileTarget&&isAdmin?"users":perms?.editSettings!==false?"personalizza":isAdmin?"users":perms?.viewBackup?"backup":perms?.viewLog?"log":"personalizza";
  const[section,setSection]=useState(firstSec);
  const SUB=[
    (perms?.editSettings!==false)&&{id:"personalizza",label:"Personalizza",icon:"palette",desc:"Tema, colori, densità e preferenze."},
    isAdmin&&{id:"users",label:"Utenti e permessi",icon:"key",desc:"Chi può accedere e cosa può fare."},
    isSuperAdmin&&{id:"permissions",label:"Gestione permessi",icon:"shield",desc:"Personalizza i permessi per ogni ruolo."},
    isSuperAdmin&&{id:"api",label:"Gestione API AI",icon:"sparkles",desc:"Chiavi Gemini, OpenAI e provider attivo."},
    (perms?.viewBackup)&&{id:"backup",label:"Backup",icon:"save",desc:"Snapshot del database, import/export."},
    (perms?.viewLog)&&{id:"log",label:"Log attività",icon:"clock",desc:"Storico delle modifiche per utente."},
    (perms?.manageDemo)&&{id:"demo",label:"Dati demo",icon:"dice",desc:"Carica dati di esempio o resetta tutto."},
  ].filter(Boolean);
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header"><div><div className="page-breadcrumb">Sistema</div><h1 className="page-title">Impostazioni</h1></div></div>
    <div style={{flex:1,display:"flex",minHeight:0}}>
      <aside style={{width:240,flexShrink:0,padding:"18px 14px",borderRight:"1px solid var(--border)",background:"var(--bg)"}}>
        {SUB.map(s=>{const active=section===s.id;return(<button key={s.id} onClick={()=>setSection(s.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",background:active?"var(--bg-elev)":"transparent",border:`1px solid ${active?"var(--border)":"transparent"}`,borderRadius:"var(--radius)",cursor:"pointer",textAlign:"left",marginBottom:4,boxShadow:active?"var(--shadow-xs)":"none"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.background="var(--bg-hover)";}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
          <div style={{width:32,height:32,borderRadius:8,background:active?"var(--accent-soft)":"var(--bg-hover)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name={s.icon} size={15} color={active?"var(--accent-strong)":"var(--fg-muted)"}/>
          </div>
          <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"var(--fg)"}}>{s.label}</div><div style={{fontSize:11,color:"var(--fg-subtle)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.desc}</div></div>
        </button>);})}
      </aside>
      <div style={{flex:1,...(section==="users"?{display:"flex",minHeight:0,overflow:"hidden"}:{overflowY:"auto",padding:32}),background:"var(--bg)"}}>
        {section==="personalizza"&&<CustomizePanel settings={settings} theme={theme} setTheme={setTheme} onSaveSettings={onSaveSettings}/>}
        {section==="users"&&<UsersPanel isSuperAdmin={isSuperAdmin} currentUser={currentUser} initialEmail={profileTarget}/>}
        {section==="permissions"&&<GestionePermessi rolePermissions={settings.rolePermissions||{}} onSave={rp=>onSaveSettings({rolePermissions:rp})}/>}
        {section==="api"&&<ApiPanel settings={settings} onSave={onSaveSettings}/>}
        {section==="backup"&&<BackupPanel corsi={corsi} tutors={tutors} tutEvents={tutEvents} anagraficaCorsi={anagraficaCorsi} avvisi={[]} settings={settings} isSuperAdmin={isSuperAdmin}/>}
        {section==="log"&&<LogPanel/>}
        {section==="demo"&&perms?.manageDemo&&<DemoPanel isSuperAdmin={isSuperAdmin}/>}
      </div>
    </div>
  </div>);
}

// ── SETTINGS SUB-PANELS ───────────────────────────────────────────────────
function UsersPanel({isSuperAdmin,currentUser,initialEmail}){
  const[emails,setEmails]=useState([]);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);
  const[selected,setSelected]=useState(null);const[isNew,setIsNew]=useState(false);
  const[q,setQ]=useState("");const[newEmail,setNewEmail]=useState("");const[editRole,setEditRole]=useState("user");
  const[profileForm,setProfileForm]=useState({nome:"",cognome:"",telefono:"",ente:""});
  const[profileUid,setProfileUid]=useState(null);const[profileLoading,setProfileLoading]=useState(false);
  const[pwForm,setPwForm]=useState({current:"",newPw:"",confirm:""});const[pwSaving,setPwSaving]=useState(false);const[pwMsg,setPwMsg]=useState(null);
  const[resetSending,setResetSending]=useState(false);const[resetMsg,setResetMsg]=useState(null);
  const roleOptions=isSuperAdmin?["user","viewer","admin","superadmin"]:["user","viewer","admin"];
  useEffect(()=>{db.collection("authorizedEmails").get().then(snap=>{const list=snap.docs.map(d=>({email:d.id,...d.data()}));setEmails(list);setLoading(false);});},[]);
  useEffect(()=>{if(!initialEmail||loading)return;const u=emails.find(e=>e.email===initialEmail);if(u)selectUser(u);},[loading,initialEmail]);
  useEffect(()=>{
    if(!selected)return;
    const _isSelf=selected.email===currentUser?.email;
    const canEdit=isSuperAdmin||selected.role!=="superadmin";
    if(!canEdit)return;
    setProfileLoading(true);setProfileUid(null);setProfileForm({nome:"",cognome:"",telefono:"",ente:""});
    if(_isSelf&&currentUser?.uid){
      db.collection("userProfiles").doc(currentUser.uid).get().then(snap=>{
        setProfileUid(currentUser.uid);
        if(snap.exists){const d=snap.data();setProfileForm({nome:d.nome||"",cognome:d.cognome||"",telefono:d.telefono||"",ente:d.ente||""});}
        setProfileLoading(false);
      }).catch(()=>setProfileLoading(false));
    }else{
      db.collection("userProfiles").where("email","==",selected.email).limit(1).get().then(snap=>{
        if(!snap.empty){const doc=snap.docs[0];setProfileUid(doc.id);const d=doc.data();setProfileForm({nome:d.nome||"",cognome:d.cognome||"",telefono:d.telefono||"",ente:d.ente||""});}
        setProfileLoading(false);
      }).catch(()=>setProfileLoading(false));
    }
  },[selected]);
  function selectUser(e){setSelected(e);setIsNew(false);setEditRole(e.role||"user");setPwForm({current:"",newPw:"",confirm:""});setPwMsg(null);setResetMsg(null);}
  function startNew(){setSelected(null);setIsNew(true);setNewEmail("");setEditRole("user");}
  const isSelf=!!selected&&!!currentUser&&selected.email===currentUser.email;
  const canEditProfile=!!(selected&&(isSuperAdmin||selected.role!=="superadmin"));
  async function handleSave(){setSaving(true);if(isNew){const email=newEmail.trim().toLowerCase();if(!email){setSaving(false);return;}await db.collection("authorizedEmails").doc(email).set({role:editRole});const snap=await db.collection("authorizedEmails").get();const list=snap.docs.map(d=>({email:d.id,...d.data()}));setEmails(list);setSelected({email,role:editRole});setIsNew(false);}else{if(canEditProfile&&editRole!==selected.role)await db.collection("authorizedEmails").doc(selected.email).update({role:editRole});if(canEditProfile&&profileUid)await db.collection("userProfiles").doc(profileUid).set({nome:profileForm.nome,cognome:profileForm.cognome,telefono:profileForm.telefono||"",ente:profileForm.ente||"",email:selected.email},{merge:true});const updated={...selected,role:editRole};setEmails(p=>p.map(e=>e.email===selected.email?updated:e));setSelected(updated);}setSaving(false);}
  async function handlePasswordChange(){if(!pwForm.newPw||pwForm.newPw!==pwForm.confirm||pwForm.newPw.length<6)return;setPwSaving(true);setPwMsg(null);try{const cred=firebase.auth.EmailAuthProvider.credential(currentUser.email,pwForm.current);await firebase.auth().currentUser.reauthenticateWithCredential(cred);await firebase.auth().currentUser.updatePassword(pwForm.newPw);setPwMsg({ok:true,text:"Password aggiornata con successo."});setPwForm({current:"",newPw:"",confirm:""});}catch(e){setPwMsg({ok:false,text:e.code==="auth/wrong-password"?"Password attuale non corretta.":e.code==="auth/weak-password"?"Password troppo debole (min. 6 caratteri).":"Errore: "+e.message});}setPwSaving(false);}
  async function handleResetEmail(){setResetSending(true);setResetMsg(null);try{await firebase.auth().sendPasswordResetEmail(selected.email);setResetMsg({ok:true,text:`Email di reset inviata a ${selected.email}.`});}catch(e){setResetMsg({ok:false,text:"Errore: "+e.message});}setResetSending(false);}
  async function handleRemove(){if(!selected||!confirm(`Rimuovere ${selected.email}?`))return;await db.collection("authorizedEmails").doc(selected.email).delete();setEmails(p=>p.filter(e=>e.email!==selected.email));setSelected(null);}
  const filtered=[...emails].filter(e=>e.email.includes(q.toLowerCase())).sort((a,b)=>a.email.localeCompare(b.email));
  function RoleCards({value,onChange}){return(<div style={{display:"grid",gridTemplateColumns:`repeat(${roleOptions.length},1fr)`,gap:8}}>{roleOptions.map(r=>{const col=ROLE_COLOR[r]||"var(--fg-subtle)";const sel=value===r;return(<button key={r} onClick={()=>onChange(r)} style={{padding:"12px 6px",borderRadius:"var(--radius)",border:`1.5px solid ${sel?col:"var(--border)"}`,background:sel?"var(--bg-sunken)":"var(--bg-elev)",cursor:"pointer",textAlign:"center",transition:"border-color .15s"}}><Icon name={ROLE_ICON[r]||"user"} size={16} color={sel?col:"var(--fg-muted)"}/><div style={{fontSize:11,fontWeight:700,color:sel?col:"var(--fg-muted)",marginTop:5}}>{ROLE_LABEL[r]}</div></button>);})}</div>);}
  return(<div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
    <div style={{width:300,flexShrink:0,display:"flex",flexDirection:"column",borderRight:"1px solid var(--border)",background:"var(--bg)",overflow:"hidden"}}>
      <div style={{padding:"12px 14px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{position:"relative",marginBottom:8}}><Icon name="search" size={13} color="var(--fg-faint)" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/><input className="input" placeholder="Cerca email…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:30,fontSize:13}}/></div>
        <button className="btn" data-variant="accent" onClick={startNew} style={{width:"100%",justifyContent:"center",display:"flex",alignItems:"center",gap:6,height:36}}><Icon name="plus" size={13} color="#fff"/>Aggiungi utente</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 10px"}}>
        {loading?<div style={{padding:24,textAlign:"center",color:"var(--fg-subtle)",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="loader" size={14} color="var(--fg-subtle)"/>Caricamento...</div>
        :filtered.map(e=>{const isSel=!isNew&&selected?.email===e.email;const col=ROLE_COLOR[e.role]||"var(--fg-subtle)";const isMe=e.email===currentUser?.email;return(<button key={e.email} className={`list-item${isSel?" active":""}`} onClick={()=>selectUser(e)}>
          {isSel&&<span style={{position:"absolute",left:0,top:12,bottom:12,width:3,background:col,borderRadius:"0 3px 3px 0"}}/>}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:999,background:"var(--bg-sunken)",border:`1.5px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={ROLE_ICON[e.role]||"user"} size={14} color={col}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--fg)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.email}{isMe&&<span style={{marginLeft:5,fontSize:10,padding:"1px 5px",borderRadius:100,background:"var(--accent-soft)",color:"var(--accent-strong)",fontWeight:700}}>tu</span>}</div>
              <div style={{fontSize:11,color:col,fontWeight:600,marginTop:1}}>{ROLE_LABEL[e.role]||e.role}</div>
            </div>
          </div>
        </button>);})}
        {!loading&&filtered.length===0&&<div style={{padding:32,textAlign:"center",color:"var(--fg-subtle)",fontSize:13}}>Nessun utente trovato</div>}
      </div>
    </div>
    <div className="detail-pane" style={{overflowY:"auto"}}>
      {isNew?(<div style={{maxWidth:480}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4,color:"var(--fg)"}}>Nuovo utente</h2>
        <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Inserisci l'email autorizzata e assegna un ruolo.</p>
        <div style={{marginBottom:18}}><label className="label">Email</label><input className="input" type="email" placeholder="email@ente.it" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></div>
        <div style={{marginBottom:24}}><label className="label" style={{marginBottom:8,display:"block"}}>Ruolo</label><RoleCards value={editRole} onChange={setEditRole}/></div>
        <button className="btn" data-variant="accent" onClick={handleSave} disabled={saving||!newEmail.trim()} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<Icon name="loader" size={14} color="#fff"/>:<Icon name="plus" size={14} color="#fff"/>}Aggiungi utente</button>
      </div>)
      :selected?(<div style={{maxWidth:520}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
          <div style={{width:54,height:54,borderRadius:999,background:ROLE_COLOR[selected.role]||"var(--bg-sunken)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={ROLE_ICON[selected.role]||"user"} size={24} color="#fff"/></div>
          <div><h2 style={{fontSize:17,fontWeight:700,color:"var(--fg)",marginBottom:4,wordBreak:"break-all"}}>{selected.email}{isSelf&&<span style={{marginLeft:8,fontSize:11,padding:"2px 7px",borderRadius:100,background:"var(--accent-soft)",color:"var(--accent-strong)",fontWeight:700,verticalAlign:"middle"}}>il tuo account</span>}</h2><span className="badge" data-tone={selected.role==="superadmin"?"danger":selected.role==="admin"?"accent":selected.role==="viewer"?"default":"info"}>{ROLE_LABEL[selected.role]||selected.role}</span></div>
        </div>
        <div style={{marginBottom:18}}>
          <label className="label" style={{marginBottom:8,display:"block"}}>Ruolo</label>
          {canEditProfile?<RoleCards value={editRole} onChange={setEditRole}/>
          :<div style={{padding:"10px 14px",borderRadius:"var(--radius)",background:"var(--bg-sunken)",border:"1px solid var(--border)",fontSize:13,color:"var(--fg-muted)",display:"flex",alignItems:"center",gap:8}}><Icon name="key" size={14} color="var(--fg-faint)"/>Solo il superadmin può modificare questo ruolo.</div>}
        </div>
        {canEditProfile&&<>
          <div style={{height:1,background:"var(--divider)",margin:"20px 0"}}/>
          <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Informazioni personali</div>
          {profileLoading?<div style={{padding:"14px 0",color:"var(--fg-subtle)",fontSize:13,display:"flex",alignItems:"center",gap:8}}><Icon name="loader" size={14} color="var(--fg-subtle)"/>Caricamento profilo...</div>
          :(!isSelf&&!profileUid)?<div style={{padding:"10px 14px",borderRadius:"var(--radius)",background:"var(--bg-sunken)",border:"1px solid var(--border)",fontSize:13,color:"var(--fg-muted)",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Icon name="user" size={14} color="var(--fg-faint)"/>Utente non ancora registrato — il profilo sarà disponibile dopo il primo accesso.</div>
          :<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label className="label">Nome</label><input className="input" value={profileForm.nome} onChange={e=>setProfileForm(f=>({...f,nome:e.target.value}))}/></div>
              <div><label className="label">Cognome</label><input className="input" value={profileForm.cognome} onChange={e=>setProfileForm(f=>({...f,cognome:e.target.value}))}/></div>
            </div>
            <div style={{marginBottom:12}}><label className="label">Telefono</label><input className="input" value={profileForm.telefono} onChange={e=>setProfileForm(f=>({...f,telefono:e.target.value}))}/></div>
            <div style={{marginBottom:16}}><label className="label">Ente / Azienda</label><input className="input" value={profileForm.ente} onChange={e=>setProfileForm(f=>({...f,ente:e.target.value}))}/></div>
          </>}
          <div style={{height:1,background:"var(--divider)",margin:"20px 0"}}/>
          <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Password</div>
          {isSelf?(<>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
              <div><label className="label">Password attuale</label><input className="input" type="password" value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} placeholder="••••••••"/></div>
              <div><label className="label">Nuova password</label><input className="input" type="password" value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} placeholder="min. 6 caratteri"/></div>
              <div><label className="label">Conferma password</label><input className="input" type="password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} placeholder="Ripeti la nuova password"/></div>
            </div>
            {pwMsg&&<div style={{padding:"8px 12px",borderRadius:"var(--radius)",background:pwMsg.ok?"var(--success-soft)":"var(--danger-soft)",color:pwMsg.ok?"var(--success)":"var(--danger)",fontSize:12,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Icon name={pwMsg.ok?"checkCircle":"xCircle"} size={13} color={pwMsg.ok?"var(--success)":"var(--danger)"}/>{pwMsg.text}</div>}
            <button className="btn" data-variant="outline" onClick={handlePasswordChange} disabled={pwSaving||!pwForm.current||!pwForm.newPw||pwForm.newPw!==pwForm.confirm||pwForm.newPw.length<6} style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>{pwSaving?<><Icon name="loader" size={14}/>Aggiornamento...</>:<><Icon name="key" size={14}/>Cambia password</>}</button>
          </>):(<div style={{marginBottom:20}}>
            {resetMsg&&<div style={{padding:"8px 12px",borderRadius:"var(--radius)",background:resetMsg.ok?"var(--success-soft)":"var(--danger-soft)",color:resetMsg.ok?"var(--success)":"var(--danger)",fontSize:12,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Icon name={resetMsg.ok?"checkCircle":"xCircle"} size={13} color={resetMsg.ok?"var(--success)":"var(--danger)"}/>{resetMsg.text}</div>}
            <button className="btn" data-variant="outline" onClick={handleResetEmail} disabled={resetSending} style={{display:"flex",alignItems:"center",gap:6}}>{resetSending?<><Icon name="loader" size={14}/>Invio...</>:<><Icon name="send" size={14}/>Invia email di reset password</>}</button>
            <div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:6}}>Un link per reimpostare la password verrà inviato a {selected.email}.</div>
          </div>)}
        </>}
        <div style={{display:"flex",alignItems:"center",gap:10,borderTop:"1px solid var(--divider)",paddingTop:16,marginTop:4}}>
          {canEditProfile&&<button className="btn" data-variant="accent" onClick={handleSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<Icon name="loader" size={14} color="#fff"/>:<Icon name="check" size={14} color="#fff"/>}Salva modifiche</button>}
          {!isSelf&&canEditProfile&&<button className="btn" data-variant="danger" onClick={handleRemove} style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}><Icon name="trash" size={13} color="var(--danger)"/>Rimuovi</button>}
        </div>
      </div>)
      :(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--fg-subtle)",gap:10}}>
        <Icon name="users" size={32} color="var(--fg-faint)"/>
        <div style={{fontSize:13}}>Seleziona un utente o aggiungine uno nuovo</div>
      </div>)}
    </div>
  </div>);
}

function ApiPanel({settings,onSave}){
  const[aiProvider,setAiProvider]=useState(settings.aiProvider||"openai");const[geminiKey,setGeminiKey]=useState(settings.geminiApiKey||"");const[openaiKey,setOpenaiKey]=useState(settings.openaiApiKey||"");const[saved,setSaved]=useState(false);
  const[testG,setTestG]=useState(null);const[testO,setTestO]=useState(null);const[cdG,setCdG]=useState(0);const[cdO,setCdO]=useState(0);
  useEffect(()=>{if(cdG<=0)return;const t=setInterval(()=>setCdG(c=>Math.max(0,c-1)),1000);return()=>clearInterval(t);},[cdG]);
  useEffect(()=>{if(cdO<=0)return;const t=setInterval(()=>setCdO(c=>Math.max(0,c-1)),1000);return()=>clearInterval(t);},[cdO]);
  async function handleSave(){await onSave({aiProvider,geminiApiKey:geminiKey,openaiApiKey:openaiKey});setSaved(true);setTimeout(()=>setSaved(false),2000);}
  async function testGemini(){if(!geminiKey){setTestG({ok:false,msg:"Chiave non inserita"});return;}setTestG(null);try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);if(r.ok){setTestG({ok:true,msg:"Connessione riuscita"});}else{let detail="";try{const j=await r.json();detail=j.error?.message||"";}catch{}setTestG({ok:false,msg:`Errore ${r.status}${detail?`: ${detail}`:""}`.trim()});}}catch{setTestG({ok:false,msg:"Errore di rete"});}setCdG(60);}
  async function testOpenai(){if(!openaiKey){setTestO({ok:false,msg:"Chiave non inserita"});return;}setTestO(null);try{const r=await fetch("https://api.openai.com/v1/models",{headers:{"Authorization":`Bearer ${openaiKey}`}});setTestO(r.ok?{ok:true,msg:"Connessione riuscita"}:r.status===429?{ok:false,msg:"Quota esaurita"}:r.status===401?{ok:false,msg:"Chiave non valida"}:{ok:false,msg:`Errore ${r.status}`});}catch{setTestO({ok:false,msg:"Errore di rete"});}setCdO(60);}
  return(<div style={{maxWidth:720}}>
    <h2 style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--fg)"}}>Gestione API AI</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Chiavi per l'assistente di import. Salvate cifrate su Firestore.</p>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,marginBottom:14,boxShadow:"var(--shadow-xs)"}}>
      <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>Provider attivo</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{v:"gemini",label:"Google Gemini",icon:"sparkles",desc:"gemini-2.5-flash · ottima su PDF e immagini"},{v:"openai",label:"OpenAI",icon:"zap",desc:"gpt-4o-mini · ottima sui PDF"}].map(o=><button key={o.v} onClick={()=>setAiProvider(o.v)} style={{textAlign:"left",padding:14,borderRadius:"var(--radius)",cursor:"pointer",background:aiProvider===o.v?"var(--bg-sunken)":"var(--bg-elev)",border:`1.5px solid ${aiProvider===o.v?"var(--accent)":"var(--border)"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><Icon name={o.icon} size={15} color={aiProvider===o.v?"var(--accent)":"var(--fg-muted)"}/><div style={{fontSize:14,fontWeight:700,color:"var(--fg)"}}>{o.label}</div>{aiProvider===o.v&&<span className="badge" data-tone="accent" style={{marginLeft:"auto"}}>Attivo</span>}</div>
          <div style={{fontSize:12,color:"var(--fg-muted)"}}>{o.desc}</div>
        </button>)}
      </div>
      {[{name:"gemini",label:"Gemini API Key",placeholder:"AIza…",val:geminiKey,setVal:setGeminiKey,test:testGemini,testRes:testG,cd:cdG},{name:"openai",label:"OpenAI API Key",placeholder:"sk-…",val:openaiKey,setVal:setOpenaiKey,test:testOpenai,testRes:testO,cd:cdO}].map(c=><div key={c.name} style={{marginBottom:14,padding:14,borderRadius:"var(--radius)",border:"1px solid var(--border)",background:"var(--bg-sunken)",opacity:aiProvider===c.name?1:.55}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--fg)",marginBottom:8}}>{c.label}</div>
        <div style={{display:"flex",gap:8}}><input type="password" className="input mono" value={c.val} onChange={e=>c.setVal(e.target.value)} placeholder={c.placeholder} style={{flex:1}}/><button onClick={c.test} disabled={c.cd>0} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="search" size={13}/>Testa{c.cd>0?` (${c.cd}s)`:""}</button></div>
        {c.testRes&&<div style={{marginTop:8,fontSize:12,display:"flex",alignItems:"center",gap:6,color:c.testRes.ok?"var(--success)":"var(--danger)"}}><Icon name={c.testRes.ok?"checkCircle":"xCircle"} size={13} color={c.testRes.ok?"var(--success)":"var(--danger)"}/>{c.testRes.msg}</div>}
      </div>)}
      <button className="btn" data-variant={saved?"accent":"primary"} onClick={handleSave} style={{display:"flex",alignItems:"center",gap:6}}>{saved?<><Icon name="check" size={14} color="#fff"/>Salvato</>:<><Icon name="save" size={14} color="#fff"/>Salva impostazioni</>}</button>
    </div>
  </div>);
}

function BackupPanel({corsi,tutors,tutEvents,anagraficaCorsi,avvisi,settings={},isSuperAdmin}){
  const[backups,setBackups]=useState([]);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[msg,setMsg]=useState(null);
  function fmtSize(b){if(b<1024)return`${b} B`;if(b<1024*1024)return`${(b/1024).toFixed(1)} KB`;return`${(b/1024/1024).toFixed(2)} MB`;}
  async function load(){setLoading(true);setBackups(await fsListBackups());setLoading(false);}
  useEffect(()=>{load();},[]);
  async function doBackup(){setSaving(true);setMsg(null);try{await fsCreateBackup(corsi,tutors,tutEvents,anagraficaCorsi,avvisi,settings);await fsApplyBackupPolicy(await fsListBackups());setMsg({ok:true,text:"Backup creato."});await load();}catch(e){setMsg({ok:false,text:e.message});}setSaving(false);}
  async function doRestore(b){if(!confirm(`Ripristinare il backup del ${fmtTs(b.created)}?`))return;try{const data=JSON.parse(b.data);const v=data.version||0;if(v>0&&v<5&&!confirm(`Backup v${v} (formato precedente). Alcuni dati non verranno ripristinati. Continuare?`))return;window.__restoreBackup&&await window.__restoreBackup(data);setMsg({ok:true,text:`Ripristinato (v${v||"?"}).`});}catch(e){setMsg({ok:false,text:e.message});}}
  function doDownload(b){const blob=new Blob([b.data],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`backup_${b.created.toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);}
  async function doDelete(b){if(!confirm(`Eliminare il backup del ${fmtTs(b.created)}?`))return;await fsDeleteBackup(b.id);await load();}
  return(<div style={{maxWidth:880}}>
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:22}}>
      <div><h2 style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--fg)"}}>Backup</h2><p style={{fontSize:13,color:"var(--fg-muted)"}}>Policy: max 10 backup · dall'undicesimo viene eliminato il più vecchio. Include tutti i dati: calendari, anagrafiche, impostazioni, utenti e log.</p></div>
      <div style={{display:"flex",gap:8}}>
        <label className="btn" data-variant="outline" style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Icon name="upload" size={14}/>Importa JSON<input type="file" accept=".json" style={{display:"none"}} onChange={e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=async ev=>{try{const raw=JSON.parse(ev.target.result);const v=raw.version||0;if(v>0&&v<5&&!confirm(`File v${v} (formato precedente). Continuare?`))return;window.__restoreBackup&&await window.__restoreBackup(raw);setMsg({ok:true,text:"Importato."});}catch(err){setMsg({ok:false,text:err.message});}};reader.readAsText(file);e.target.value="";}}/></label>
        <button className="btn" data-variant="accent" onClick={doBackup} disabled={saving} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={14} color="#fff"/>Salvataggio...</>:<><Icon name="save" size={14} color="#fff"/>Crea backup</>}</button>
      </div>
    </div>
    {msg&&<div style={{padding:"10px 14px",borderRadius:"var(--radius)",background:msg.ok?"var(--success-soft)":"var(--danger-soft)",color:msg.ok?"var(--success)":"var(--danger)",fontSize:13,fontWeight:600,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Icon name={msg.ok?"checkCircle":"xCircle"} size={14} color={msg.ok?"var(--success)":"var(--danger)"}/>{msg.text}</div>}
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",overflow:"hidden",boxShadow:"var(--shadow-xs)"}}>
      {loading?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="loader" size={14} color="var(--fg-subtle)"/>Caricamento...</p>
      :backups.length===0?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,fontStyle:"italic",textAlign:"center"}}>Nessun backup disponibile.</p>
      :<table className="data-table"><thead><tr><th>Data e ora</th><th>Dimensione</th><th>Azioni</th></tr></thead><tbody>{backups.map((b,i)=>(<tr key={b.id}><td style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12}}>{fmtTs(b.created)}</td><td style={{color:"var(--fg-subtle)"}}>{fmtSize(b.size)}</td><td><div style={{display:"flex",gap:6}}><button onClick={()=>doDownload(b)} className="btn" data-variant="outline" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}><Icon name="download" size={13}/></button><button onClick={()=>doRestore(b)} className="btn" data-variant="outline" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}><Icon name="rotateCcw" size={13}/></button><button onClick={()=>doDelete(b)} className="btn" data-variant="danger" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}><Icon name="trash" size={13} color="var(--danger)"/></button></div></td></tr>))}</tbody></table>}
    </div>
  </div>);
}

function LogRow({r}){
  const[open,setOpen]=useState(false);
  const changes=r.changes||[];
  const hasDetail=changes.length>0;
  return(<>
    <tr style={hasDetail?{cursor:"pointer"}:undefined} onClick={()=>hasDetail&&setOpen(o=>!o)} role={hasDetail?"button":undefined} tabIndex={hasDetail?0:undefined} aria-expanded={hasDetail?open:undefined} onKeyDown={hasDetail?(e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setOpen(o=>!o);}}):undefined}>
      <td style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,whiteSpace:"nowrap"}}>{fmtTs(r.ts)}</td>
      <td style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--fg-muted)"}}>{r.userEmail}</td>
      <td style={{whiteSpace:"nowrap"}}>{LOG_TYPE_LABELS[r.type]||r.type}</td>
      <td style={{color:"var(--fg-muted)",lineHeight:1.4}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{flex:1}}>{r.detail}</span>
          {hasDetail&&<span className="badge" style={{flexShrink:0,gap:4}}><Icon name={open?"chevDown":"chevRight"} size={11} color="var(--fg-subtle)"/>{changes.length} {changes.length===1?"modifica":"modifiche"}</span>}
        </div>
        {hasDetail&&open&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5,paddingLeft:2}}>
          {changes.map((c,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".04em",fontSize:10,minWidth:54}}>{c.label}</span>
            <span style={{color:"var(--fg-muted)",textDecoration:"line-through",opacity:.7}}>{c.from}</span>
            <Icon name="arrowRight" size={11} color="var(--accent)"/>
            <span style={{color:"var(--fg)",fontWeight:600}}>{c.to}</span>
          </div>)}
        </div>}
      </td>
    </tr>
  </>);
}
function LogPanel(){
  const[rows,setRows]=useState([]);const[loading,setLoading]=useState(true);const[filterUser,setFilterUser]=useState("");
  useEffect(()=>{fsLoadLog().then(r=>{setRows(r);setLoading(false);});},[]);
  const users=[...new Set(rows.map(r=>r.userEmail))].sort();
  const filtered=rows.filter(r=>!filterUser||r.userEmail===filterUser);
  return(<div style={{maxWidth:980}}>
    <h2 style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--fg)"}}>Log attività</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Storico delle modifiche ai dati.</p>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <select className="select" value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={{width:240}}><option value="">— Tutti gli utenti —</option>{users.map(u=><option key={u} value={u}>{u}</option>)}</select>
      <span style={{fontSize:12,color:"var(--fg-subtle)",alignSelf:"center"}}>{filtered.length} record</span>
    </div>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",overflow:"hidden",boxShadow:"var(--shadow-xs)"}}>
      {loading?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="loader" size={14} color="var(--fg-subtle)"/>Caricamento...</p>
      :filtered.length===0?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,fontStyle:"italic",textAlign:"center"}}>Nessuna attività registrata.</p>
      :<table className="data-table"><thead><tr><th>Data e ora</th><th>Utente</th><th>Tipo</th><th>Dettaglio</th></tr></thead><tbody>{filtered.map((r,i)=><LogRow key={r.id} r={r}/>)}</tbody></table>}
    </div>
  </div>);
}

function DemoPanel({isSuperAdmin}){
  async function loadDemo(){if(!confirm("Caricare i dati demo? I dati esistenti saranno sovrascritti."))return;window.__loadDemo&&await window.__loadDemo();alert("Dati demo caricati!");}
  async function clearDb(){if(!confirm("Eliminare TUTTI i dati?"))return;if(!confirm("Sei sicuro? Operazione irreversibile."))return;window.__clearDb&&await window.__clearDb();alert("Database svuotato.");}
  return(<div style={{maxWidth:720}}>
    <h2 style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--fg)"}}>Dati demo</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Carica dati di esempio o azzera tutto.</p>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--accent)",borderRadius:"var(--radius-md)",padding:22,marginBottom:14,boxShadow:"var(--shadow-xs)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <div style={{width:48,height:48,borderRadius:12,background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="dice" size={22} color="var(--accent)"/>
        </div>
        <div><h3 style={{fontSize:15,fontWeight:700,marginBottom:2,color:"var(--fg)"}}>Carica dati demo</h3><p style={{fontSize:12,color:"var(--fg-muted)"}}>5 tutor · 6 corsi · ~620 slot distribuiti su tutto il 2026</p></div>
      </div>
      <div style={{padding:12,background:"var(--warning-soft)",borderRadius:8,marginBottom:12,fontSize:11.5,color:"var(--fg)",lineHeight:1.6,display:"flex",alignItems:"flex-start",gap:8}}>
        <Icon name="alert" size={14} color="var(--warning)" style={{flexShrink:0,marginTop:1}}/>
        <span><strong>Attenzione:</strong> i dati attuali verranno sovrascritti.</span>
      </div>
      <button className="btn" data-variant="accent" onClick={loadDemo} style={{width:"100%",justifyContent:"center",display:"flex",alignItems:"center",gap:6}}><Icon name="dice" size={14} color="#fff"/>Carica dati demo</button>
    </div>
    {isSuperAdmin&&<div style={{background:"var(--bg-elev)",border:"1px solid var(--danger)",borderRadius:"var(--radius-md)",padding:22,boxShadow:"var(--shadow-xs)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <div style={{width:48,height:48,borderRadius:12,background:"var(--danger-soft)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="trash" size={22} color="var(--danger)"/>
        </div>
        <div><h3 style={{fontSize:15,fontWeight:700,marginBottom:2,color:"var(--danger)"}}>Cancella database</h3><p style={{fontSize:12,color:"var(--fg-muted)"}}>Elimina tutti i dati. Operazione irreversibile.</p></div>
      </div>
      <button className="btn" onClick={clearDb} style={{width:"100%",justifyContent:"center",display:"flex",alignItems:"center",gap:6,background:"transparent",border:"1.5px solid var(--danger)",color:"var(--danger)"}}><Icon name="trash" size={14} color="var(--danger)"/>Cancella database</button>
    </div>}
  </div>);
}
