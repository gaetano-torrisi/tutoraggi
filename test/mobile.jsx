/* eslint-disable */
/* ════════════════════════════════════════════════════════════════════
   MOBILE — versione smartphone (≤768px), SOLA CONSULTAZIONE.
   Albero React separato e autosufficiente: il desktop (App in app.jsx)
   resta identico e intoccato. <MobileApp> riceve in props i dati già
   caricati da App e li mostra in lettura, riusando le util globali
   (MONTHS, fmtOreMin, hexToRgba, Icon, ...).

   Editing, drag, AI Import, Verifica e impostazioni avanzate restano
   esclusivi del desktop — coerente col mockup condiviso.

   Per aggiungere/spostare schermate in futuro basta intervenire qui:
   è tutto isolato in questo file + mobile.css.
   ════════════════════════════════════════════════════════════════════ */

const M_DOW_FULL=["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
function mInitials(t){return`${(t.cognome||"")[0]||""}${(t.nome||"")[0]||""}`.toUpperCase()||"–";}
function mTutLabel(t){return`${t.cognome||""} ${t.nome||""}`.trim();}
function mSafeColor(c){return(c&&c.startsWith("#"))?c:"var(--accent)";}

// ── VerifiedBadge (mobile) ──
function MVerified(){return(
  <span className="m-verified" title="Verificato">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
  </span>);}

// ── Account bottom sheet ──
function MAccountSheet({user,role,theme,setTheme,onClose}){
  const initials=(user?.email||"").slice(0,2).toUpperCase();
  return(<div className="m-sheet-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="m-sheet">
      <div className="m-sheet-grip"/>
      <div className="m-sheet-head">
        <div className="m-avatar" style={{cursor:"default"}}>{initials}</div>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,color:"var(--fg)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.displayName||user?.email}</div>
          <div style={{fontSize:11.5,fontWeight:700,color:ROLE_COLOR[role]||"var(--fg-subtle)",display:"flex",alignItems:"center",gap:4,marginTop:2}}>
            <Icon name={ROLE_ICON[role]||"user"} size={11} color={ROLE_COLOR[role]||"var(--fg-subtle)"}/>{ROLE_LABEL[role]||role}
          </div>
        </div>
      </div>
      <div className="m-theme-row">
        <button className={`m-theme-btn${theme==="light"?" on":""}`} onClick={()=>setTheme("light")}><Icon name="sun" size={14}/>Light</button>
        <button className={`m-theme-btn${theme==="dark"?" on":""}`} onClick={()=>setTheme("dark")}><Icon name="moon" size={14}/>Dark</button>
      </div>
      <button className="m-sheet-item" style={{color:"var(--danger)"}} onClick={()=>{if(confirm("Disconnettersi dall'applicazione?"))firebase.auth().signOut();}}>
        <Icon name="logout" size={18} color="var(--danger)"/>Disconnetti
      </button>
    </div>
  </div>);
}

// ── Calendario (agenda) ──
function MCalendar({month,monthIdx,setMonthIdx,monthTutEvents,monthCorsoEvents,tutorsById}){
  const[calMode,setCalMode]=useState("tutoraggio");
  const[day,setDay]=useState(1);
  const selDayRef=useRef(null);
  useEffect(()=>{const now=new Date();setDay(now.getFullYear()===month.year&&now.getMonth()===month.month?now.getDate():1);},[monthIdx]);
  useEffect(()=>{selDayRef.current&&selDayRef.current.scrollIntoView({inline:"center",block:"nearest"});},[day,monthIdx]);
  const isWE=d=>[0,6].includes(new Date(month.year,month.month,d).getDay());
  const evsByDay=useMemo(()=>{const b={};const src=calMode==="tutoraggio"?monthTutEvents:monthCorsoEvents;for(const e of src)(b[e.day]=b[e.day]||[]).push(e);return b;},[calMode,monthTutEvents,monthCorsoEvents]);
  const dayEvs=useMemo(()=>[...(evsByDay[day]||[])].sort((a,b)=>a.start-b.start),[evsByDay,day]);
  const dayOre=dayEvs.reduce((s,e)=>s+(e.ore||0),0);
  const dow=new Date(month.year,month.month,day).getDay();
  return(<>
    <div className="m-monthnav">
      <button className="m-navbtn" disabled={monthIdx===0} onClick={()=>setMonthIdx(i=>Math.max(0,i-1))}><Icon name="chevLeft" size={16}/></button>
      <div className="m-monthnav-label">{month.label}</div>
      <button className="m-navbtn" disabled={monthIdx===MONTHS.length-1} onClick={()=>setMonthIdx(i=>Math.min(MONTHS.length-1,i+1))}><Icon name="chevRight" size={16}/></button>
    </div>
    <div className="m-period" style={{marginBottom:12}}>
      <button className={calMode==="tutoraggio"?"on":""} onClick={()=>setCalMode("tutoraggio")}>Tutoraggi</button>
      <button className={calMode==="corso"?"on":""} onClick={()=>setCalMode("corso")}>Corsi</button>
    </div>
    <div className="m-daystrip">
      {Array.from({length:month.days},(_,i)=>i+1).map(d=>(
        <button key={d} ref={d===day?selDayRef:null} className={`m-day${d===day?" on":""}${isWE(d)?" we":""}`} onClick={()=>setDay(d)}>
          <div className="m-day-dow">{DAY_NAMES[new Date(month.year,month.month,d).getDay()]}</div>
          <div className="m-day-num">{d}</div>
          {(evsByDay[d]||[]).length>0&&<div className="m-day-dot"/>}
        </button>
      ))}
    </div>
    <div className="m-agenda-head"><b>{M_DOW_FULL[dow]} {day}</b> · {dayEvs.length} session{dayEvs.length===1?"e":"i"}{dayOre>0?` · ${fmtOreMin(dayOre)}`:""}</div>
    {dayEvs.length===0
      ?<div className="m-empty"><div className="m-empty-ic"><Icon name="calendar" size={24} color="var(--fg-subtle)"/></div><div className="m-empty-txt">Nessuna sessione in questo giorno</div></div>
      :dayEvs.map((e,i)=>{
        const color=calMode==="tutoraggio"?mSafeColor(tutorsById[e.tutorId]?.color):mSafeColor(e.color);
        const title=calMode==="tutoraggio"?(e.name||"—"):(e.corsoName||"—");
        const sub=calMode==="tutoraggio"?(tutorsById[e.tutorId]?mTutLabel(tutorsById[e.tutorId]):""):"Corso";
        return(<div key={i} className="m-session">
          <div className="m-session-bar" style={{background:color}}/>
          <div className="m-session-body">
            <div className="m-session-name">{e.verified&&<MVerified/>}{title}</div>
            <div className="m-session-meta">{sub&&<span style={{display:"inline-flex",alignItems:"center",gap:4}}><Icon name={calMode==="tutoraggio"?"user":"briefcase"} size={12} color="var(--fg-subtle)"/>{sub}</span>}</div>
          </div>
          <div>
            <div className="m-session-time">{fmt(e.start)}–{fmt(e.end)}</div>
            <div className="m-session-dur" style={{textAlign:"right"}}>{fmtDurata(e.ore||(e.end-e.start))}</div>
          </div>
        </div>);
      })}
  </>);
}

// ── Tutor (lista + dettaglio) ──
function MTutors({tutors,tutEvents}){
  const[sel,setSel]=useState(null);
  const tutTot=useMemo(()=>{const o={};tutors.forEach(t=>{let s=0;const td=tutEvents[t.id]||{};for(const evs of Object.values(td))for(const e of evs)s+=e.ore||0;o[t.id]=s;});return o;},[tutors,tutEvents]);
  if(sel){
    const t=sel;const td=tutEvents[t.id]||{};
    const byCorso={};for(const evs of Object.values(td))for(const e of evs){byCorso[e.name]=(byCorso[e.name]||0)+(e.ore||0);}
    const corsiList=Object.entries(byCorso).sort((a,b)=>b[1]-a[1]);
    return(<>
      <div className="m-detail-head">
        <button className="m-back" onClick={()=>setSel(null)}><Icon name="arrowLeft" size={18}/></button>
        <div className="m-detail-title">{mTutLabel(t)}</div>
      </div>
      <div className="m-card">
        <div className="m-kv"><span className="m-kv-k">Azienda</span><span className="m-kv-v">{t.azienda||"—"}</span></div>
        <div className="m-kv"><span className="m-kv-k">Codice fiscale</span><span className="m-kv-v">{t.cf||"—"}</span></div>
        <div className="m-kv"><span className="m-kv-k">Ore totali</span><span className="m-kv-v">{fmtOreMin(tutTot[t.id]||0)}</span></div>
      </div>
      <div className="m-section-h">Corsi seguiti</div>
      {corsiList.length===0
        ?<div className="m-empty"><div className="m-empty-txt">Nessuna sessione assegnata</div></div>
        :<div className="m-card">{corsiList.map(([nome,ore],i)=>(
          <div key={i} className="m-kv"><span className="m-kv-k">{nome}</span><span className="m-kv-v">{fmtOreMin(ore)}</span></div>
        ))}</div>}
    </>);
  }
  const sorted=[...tutors].sort((a,b)=>(a.cognome||"").localeCompare(b.cognome||""));
  if(sorted.length===0)return<div className="m-empty"><div className="m-empty-ic"><Icon name="users" size={24} color="var(--fg-subtle)"/></div><div className="m-empty-txt">Nessun tutor in anagrafica</div></div>;
  return(<>{sorted.map(t=>(
    <button key={t.id} className="m-row" onClick={()=>setSel(t)}>
      <div className="m-row-avatar" style={{background:mSafeColor(t.color)}}>{mInitials(t)}</div>
      <div className="m-row-body">
        <div className="m-row-title">{mTutLabel(t)}</div>
        <div className="m-row-sub">{t.azienda||"—"}</div>
      </div>
      <div className="m-row-val">{fmtOreMin(tutTot[t.id]||0)}</div>
      <Icon name="chevRight" size={16} color="var(--fg-subtle)"/>
    </button>
  ))}</>);
}

// ── Corsi (lista + dettaglio) ──
function MCorsi({anagraficaCorsi,corsiById,avvisi,tutors,tutEvents}){
  const[sel,setSel]=useState(null);
  const oreSched=id=>{const co=corsiById[id];return co?co.events.reduce((s,e)=>s+(e.ore||0),0):0;};
  if(sel){
    const a=sel;const co=corsiById[a.id];const ore=oreSched(a.id);const nSess=co?co.events.length:0;
    const tone=STATO_TONES[a.stato]||"info";
    const avviso=avvisi.find(av=>av.id===a.avvisoId);
    const tuts=tutors.filter(t=>{const td=tutEvents[t.id]||{};return Object.values(td).some(evs=>evs.some(e=>e.name===a.nome));}).sort((x,y)=>(x.cognome||"").localeCompare(y.cognome||""));
    return(<>
      <div className="m-detail-head">
        <button className="m-back" onClick={()=>setSel(null)}><Icon name="arrowLeft" size={18}/></button>
        <div className="m-detail-title">{a.nome}</div>
      </div>
      <div className="m-card">
        <div className="m-kv"><span className="m-kv-k">Codice</span><span className="m-kv-v">{a.codice||"—"}</span></div>
        <div className="m-kv"><span className="m-kv-k">Stato</span><span className="m-kv-v"><span className={`m-badge ${tone}`}>{a.stato||"—"}</span></span></div>
        {avviso&&<div className="m-kv"><span className="m-kv-k">Avviso/Progetto</span><span className="m-kv-v">{avviso.nome}</span></div>}
        <div className="m-kv"><span className="m-kv-k">Periodo</span><span className="m-kv-v">{a.dataInizio||"—"} → {a.dataFine||"—"}</span></div>
        <div className="m-kv"><span className="m-kv-k">Durata prevista</span><span className="m-kv-v">{a.durataOre?`${a.durataOre} h`:"—"}</span></div>
        <div className="m-kv"><span className="m-kv-k">Ore pianificate</span><span className="m-kv-v">{fmtOreMin(ore)}</span></div>
        <div className="m-kv"><span className="m-kv-k">Sessioni</span><span className="m-kv-v">{nSess}</span></div>
      </div>
      {a.note&&<div className="m-card" style={{fontSize:13.5,color:"var(--fg-muted)",lineHeight:1.55}}>{a.note}</div>}
      <div className="m-section-h">Tutor coinvolti</div>
      {tuts.length===0
        ?<div className="m-empty"><div className="m-empty-txt">Nessun tutor assegnato</div></div>
        :tuts.map(t=>(
          <div key={t.id} className="m-row" style={{cursor:"default"}}>
            <div className="m-row-avatar" style={{background:mSafeColor(t.color),width:36,height:36,fontSize:13}}>{mInitials(t)}</div>
            <div className="m-row-body"><div className="m-row-title">{mTutLabel(t)}</div></div>
          </div>
        ))}
    </>);
  }
  const sorted=[...anagraficaCorsi].sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
  if(sorted.length===0)return<div className="m-empty"><div className="m-empty-ic"><Icon name="graduationCap" size={24} color="var(--fg-subtle)"/></div><div className="m-empty-txt">Nessun corso in anagrafica</div></div>;
  return(<>{sorted.map(a=>{
    const tone=STATO_TONES[a.stato]||"info";
    return(<button key={a.id} className="m-row" onClick={()=>setSel(a)}>
      <div className="m-row-swatch" style={{background:mSafeColor(a.colore)}}/>
      <div className="m-row-body">
        <div className="m-row-title">{a.nome}</div>
        <div className="m-row-sub">{a.codice||"—"}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
        <span className="m-row-val">{fmtOreMin(oreSched(a.id))}</span>
        {a.stato&&<span className={`m-badge ${tone}`}>{a.stato}</span>}
      </div>
    </button>);
  })}</>);
}

// ── Insights ──
function MInsights({month,anagraficaCorsi,corsiById,tutors,tutEvents}){
  const[period,setPeriod]=useState("month");
  const mks=useMemo(()=>period==="month"?[month.key]:MONTHS.filter(m=>m.year===month.year).map(m=>m.key),[period,month]);
  const tutOre=tId=>{let s=0;const td=tutEvents[tId]||{};for(const mk of mks)for(const e of(td[mk]||[]))s+=e.ore||0;return s;};
  const avOre=id=>{const co=corsiById[id];return co?co.events.filter(e=>mks.includes(e.month)).reduce((s,e)=>s+(e.ore||0),0):0;};
  const totOre=tutors.reduce((s,t)=>s+tutOre(t.id),0);
  const totSlots=tutors.reduce((s,t)=>s+mks.reduce((s2,mk)=>s2+((tutEvents[t.id]||{})[mk]||[]).length,0),0)
    +anagraficaCorsi.reduce((s,a)=>s+((corsiById[a.id]?.events)||[]).filter(e=>mks.includes(e.month)).length,0);
  const activeTutors=tutors.filter(t=>tutOre(t.id)>0).length;
  const activeCorsi=anagraficaCorsi.filter(a=>avOre(a.id)>0).length;
  const rank=[...tutors].map(t=>({t,ore:tutOre(t.id)})).filter(x=>x.ore>0).sort((a,b)=>b.ore-a.ore).slice(0,8);
  const maxOre=rank.length?rank[0].ore:0;
  const KPIS=[
    {lbl:"Ore pianificate",val:fmtOreMin(totOre),ic:"clock",bg:"var(--accent-soft)",fg:"var(--accent-strong)"},
    {lbl:"Sessioni",val:totSlots,ic:"calendar",bg:"var(--info-soft)",fg:"var(--info)"},
    {lbl:"Tutor attivi",val:activeTutors,ic:"users",bg:"var(--success-soft)",fg:"var(--success)"},
    {lbl:"Corsi attivi",val:activeCorsi,ic:"graduationCap",bg:"var(--warning-soft)",fg:"var(--warning)"},
  ];
  return(<>
    <div className="m-period">
      <button className={period==="month"?"on":""} onClick={()=>setPeriod("month")}>{month.label}</button>
      <button className={period==="year"?"on":""} onClick={()=>setPeriod("year")}>Anno {month.year}</button>
    </div>
    <div className="m-kpi-grid">
      {KPIS.map(k=>(<div key={k.lbl} className="m-kpi">
        <div className="m-kpi-ic" style={{background:k.bg,color:k.fg}}><Icon name={k.ic} size={17} color={k.fg}/></div>
        <div className="m-kpi-lbl">{k.lbl}</div>
        <div className="m-kpi-val">{k.val}</div>
      </div>))}
    </div>
    <div className="m-section-h">Top tutor per ore</div>
    {rank.length===0
      ?<div className="m-empty"><div className="m-empty-txt">Nessun dato nel periodo</div></div>
      :<div className="m-card">{rank.map(({t,ore},i)=>(
        <div key={t.id} className="m-rank-row">
          <div className="m-rank-n">{i+1}</div>
          <div className="m-rank-bar-wrap">
            <div className="m-rank-name">{mTutLabel(t)}</div>
            <div className="m-rank-bar-bg"><div className="m-rank-bar-fill" style={{width:`${maxOre?Math.max(6,ore/maxOre*100):0}%`,background:mSafeColor(t.color)}}/></div>
          </div>
          <div className="m-rank-val">{fmtOreMin(ore)}</div>
        </div>
      ))}</div>}
    <div className="m-note">Disponibili solo da desktop: <b>Verifica coerenza</b>, <b>AI Import</b>, impostazioni avanzate e l'editing del calendario (creazione, modifica e trascinamento delle sessioni).</div>
  </>);
}

// ── MOBILE APP SHELL ──
function MobileApp({loading,user,role,perms={},theme,setTheme,corsi=[],anagraficaCorsi=[],avvisi=[],tutors=[],tutEvents={},settings={},monthIdx,setMonthIdx}){
  const[tab,setTab]=useState("cal");
  const[showAccount,setShowAccount]=useState(false);
  const month=MONTHS[monthIdx]||MONTHS[0];
  const monthKey=month.key;
  const tutorsById=useMemo(()=>{const o={};tutors.forEach(t=>o[t.id]=t);return o;},[tutors]);
  const corsiById=useMemo(()=>{const o={};corsi.forEach(co=>o[co.id]=co);return o;},[corsi]);
  const monthTutEvents=useMemo(()=>tutors.flatMap(t=>((tutEvents[t.id]||{})[monthKey]||[]).map(e=>({...e,tutorId:e.tutorId||t.id}))),[tutors,tutEvents,monthKey]);
  const monthCorsoEvents=useMemo(()=>anagraficaCorsi.flatMap(a=>{const co=corsiById[a.id];if(!co)return[];return co.events.filter(e=>e.month===monthKey).map(e=>({...e,corsoName:a.nome,color:a.colore}));}),[anagraficaCorsi,corsiById,monthKey]);

  const showInsights=perms.useInsights!==false; // viewer/role senza insights → tab nascosta
  const TABS=[
    {id:"cal",label:"Calendario",icon:"calendar"},
    {id:"tutor",label:"Tutor",icon:"users"},
    {id:"corsi",label:"Corsi",icon:"graduationCap"},
    ...(showInsights?[{id:"insights",label:"Insights",icon:"barchart"}]:[]),
  ];
  const TITLES={cal:"Calendario",tutor:"Tutor",corsi:"Corsi",insights:"Insights"};
  const initials=(user?.email||"").slice(0,2).toUpperCase();

  if(loading)return(<div className="m-app"><div className="m-loading"><div className="m-spinner"/><div>Caricamento…</div></div></div>);

  return(<div className="m-app">
    <header className="m-topbar">
      <img className="m-topbar-logo" src={settings.logoBase64||"assets/appmark-color.png"} alt="TutorIA"/>
      <div className="m-topbar-title">{TITLES[tab]}</div>
      <button className="m-avatar" onClick={()=>setShowAccount(true)}>{initials}</button>
    </header>

    <main className="m-body" key={tab}>
      {tab==="cal"&&<MCalendar month={month} monthIdx={monthIdx} setMonthIdx={setMonthIdx} monthTutEvents={monthTutEvents} monthCorsoEvents={monthCorsoEvents} tutorsById={tutorsById}/>}
      {tab==="tutor"&&<MTutors tutors={tutors} tutEvents={tutEvents}/>}
      {tab==="corsi"&&<MCorsi anagraficaCorsi={anagraficaCorsi} corsiById={corsiById} avvisi={avvisi} tutors={tutors} tutEvents={tutEvents}/>}
      {tab==="insights"&&showInsights&&<MInsights month={month} anagraficaCorsi={anagraficaCorsi} corsiById={corsiById} tutors={tutors} tutEvents={tutEvents}/>}
    </main>

    <nav className="m-tabbar">
      {TABS.map(t=>(
        <button key={t.id} className={`m-tab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
          <Icon name={t.icon} size={22} color={tab===t.id?"var(--accent)":"var(--fg-subtle)"}/>
          <span className="m-tab-lab">{t.label}</span>
        </button>
      ))}
    </nav>

    {showAccount&&<MAccountSheet user={user} role={role} theme={theme} setTheme={setTheme} onClose={()=>setShowAccount(false)}/>}
  </div>);
}
