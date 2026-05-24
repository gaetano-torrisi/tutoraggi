/* eslint-disable */
// ── VERIFICA ──────────────────────────────────────────────────────────────
function runVerifica(avvisi,anagraficaAv,tutors,tutEvents){
  const errors=[],avById={},avByName={};
  avvisi.forEach(av=>avById[av.id]=av);anagraficaAv.forEach(a=>{if(avById[a.id])avByName[a.nome]=avById[a.id];});
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){for(const ev of evs){if(!avByName[ev.name]){const t=tutors.find(x=>x.id===tid);errors.push({type:"orfano",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" non in anagrafica.`,detail:"Slot orfano: l'avviso non esiste in anagrafica."});}}}}
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){for(const ev of evs){const av=avByName[ev.name];if(!av)continue;const avDay=av.events.find(e=>e.month===mk&&e.day===ev.day);const t=tutors.find(x=>x.id===tid);if(!avDay)errors.push({type:"fuori_giorno",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" il ${ev.day} ${mk} non corrisponde ad alcuna sessione.`,detail:"Nessuna sessione avviso in questo giorno."});else if(ev.start<avDay.start||ev.end>avDay.end)errors.push({type:"fuori_orario",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot il ${ev.day} ${mk} fuori orario (${fmt(ev.start)}–${fmt(ev.end)}).`,detail:`Orario sessione: ${fmt(avDay.start)}–${fmt(avDay.end)}`});}}}
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){const t=tutors.find(x=>x.id===tid);for(let i=0;i<evs.length;i++)for(let j=i+1;j<evs.length;j++){const a=evs[i],b=evs[j];if(a.day===b.day&&a.start<b.end&&b.start<a.end)errors.push({type:"sovrapposizione",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": sovrapposizione il ${a.day} ${mk} tra "${a.name}" e "${b.name}".`,detail:`${fmt(a.start)}–${fmt(a.end)} vs ${fmt(b.start)}–${fmt(b.end)}`});}}}
  for(const ana of anagraficaAv){const av=avById[ana.id];const totAv=av?av.events.reduce((s,e)=>s+(e.ore||0),0):0;let totTut=0;for(const[,ms]of Object.entries(tutEvents))for(const[,evs]of Object.entries(ms))for(const ev of evs)if(ev.name===ana.nome)totTut+=(ev.ore||0);if(totTut>totAv)errors.push({type:"eccedenza",monthKey:null,msg:`Avviso "${ana.nome}": ore tutoraggio (${totTut}h) superano ore avviso (${totAv}h).`,detail:`Eccedenza: ${totTut-totAv}h`});if(ana.durataOre&&totAv!==ana.durataOre)errors.push({type:"durata",monthKey:null,msg:`Avviso "${ana.nome}": ore nel calendario (${totAv}h) ≠ durata da bando (${ana.durataOre}h).`,detail:`Differenza: ${Math.abs(totAv-ana.durataOre)}h`});}
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){const t=tutors.find(x=>x.id===tid);const byDay={};for(const ev of evs){if(!byDay[ev.day])byDay[ev.day]=0;byDay[ev.day]+=ev.ore||0;}for(const[day,totH]of Object.entries(byDay)){if(totH>8)errors.push({type:"giornata8h",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": giornata >8h il ${day} ${mk} (${totH}h).`,detail:"Superato limite giornaliero consigliato."});}}}
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){const mObj=MONTHS.find(m=>m.key===mk);if(!mObj)continue;const t=tutors.find(x=>x.id===tid);for(const ev of evs){const d=new Date(mObj.year,mObj.month,ev.day).getDay();if(d===0||d===6)errors.push({type:"weekend",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot nel weekend il ${ev.day} ${mk}.`,detail:"Giorno festivo o weekend."});}}}
  for(const t of tutors){let hasSlot=false;for(const[,ms]of Object.entries(tutEvents[t.id]||{}))if(Object.values(ms).some(evs=>evs.length>0)){hasSlot=true;break;}if(!hasSlot)errors.push({type:"tutor_senza_slot",monthKey:null,msg:`Tutor "${t.cognome} ${t.nome}" non ha nessuno slot assegnato.`,detail:"Tutor presente in anagrafica ma senza sessioni."});}
  for(const ana of anagraficaAv){const av=avById[ana.id];if(!av||!av.events.length)errors.push({type:"avviso_senza_sessioni",monthKey:null,msg:`Avviso "${ana.nome}" non ha sessioni nel calendario.`,detail:"Nessuna data inserita per questo avviso."});}
  return errors;
}

const VERIFICA_CATS=[
  {type:"sovrapposizione",label:"Sovrapposizioni",icon:"zap",tone:"danger"},
  {type:"fuori_orario",label:"Fuori orario",icon:"clock",tone:"warning"},
  {type:"fuori_giorno",label:"Fuori giorno",icon:"calendar",tone:"warning"},
  {type:"eccedenza",label:"Ore eccedenti",icon:"trending",tone:"warning"},
  {type:"durata",label:"Durata non corrispondente",icon:"clipboard",tone:"info"},
  {type:"orfano",label:"Slot orfani",icon:"user",tone:"warning"},
  {type:"weekend",label:"Slot nel weekend",icon:"sun",tone:"info"},
  {type:"tutor_senza_slot",label:"Tutor senza slot",icon:"users",tone:"info"},
  {type:"avviso_senza_sessioni",label:"Avviso senza sessioni",icon:"briefcase",tone:"info"},
  {type:"giornata8h",label:"Giornata >8h",icon:"alert",tone:"warning"},
];

function VerificaScreen({errors,onClose,onNavigate}){
  const[activeCats,setActiveCats]=useState(new Set(VERIFICA_CATS.map(c=>c.type)));
  const[catExpanded,setCatExpanded]=useState(false);
  const[lastRun]=useState(new Date());
  const ok=errors.length===0;
  const filtered=errors.filter(e=>activeCats.has(e.type));
  function toggleCat(type){setActiveCats(p=>{const n=new Set(p);n.has(type)?n.delete(type):n.add(type);return n;});}
  return(<div className="drawer-overlay">
    <div className="drawer-backdrop" onClick={onClose}/>
    <div style={{width:"88%",maxWidth:900,background:"var(--bg-elev)",borderLeft:"1px solid var(--border)",boxShadow:"var(--shadow-lg)",display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:16,color:"var(--fg)"}}>Verifica coerenza</div><div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:2}}>Ultimo controllo: {fmtTs(lastRun)}</div></div>
        <button onClick={()=>{}} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="refresh" size={13} color="#fff"/>Riesegui</button>
        <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="x" size={16}/></button>
      </div>
      <div style={{padding:"10px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <button onClick={()=>setCatExpanded(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--bg-sunken)",border:"1px solid var(--border)",borderRadius:"var(--radius)",cursor:"pointer",textAlign:"left"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            {[...activeCats].slice(0,5).map(t=>{const c=VERIFICA_CATS.find(x=>x.type===t);return c?<span key={t} className="badge" data-tone={c.tone} style={{fontSize:10}}>{c.label}</span>:null;})}
            {activeCats.size>5&&<span style={{fontSize:11,color:"var(--fg-subtle)"}}>+{activeCats.size-5}</span>}
            <span style={{fontSize:11,color:"var(--fg-subtle)",marginLeft:"auto"}}>{activeCats.size} di {VERIFICA_CATS.length} selezionate</span>
          </div>
          <Icon name={catExpanded?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
        </button>
        {catExpanded&&<div style={{marginTop:8,padding:12,background:"var(--bg-sunken)",border:"1px solid var(--border)",borderRadius:"var(--radius)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6,marginBottom:10}}>
            {VERIFICA_CATS.map(c=>{const cnt=errors.filter(e=>e.type===c.type).length;const checked=activeCats.has(c.type);return(<label key={c.type} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:"var(--radius)",background:checked?"var(--bg-elev)":"transparent",border:`1px solid ${checked?"var(--border)":"transparent"}`,cursor:"pointer"}}>
              <input type="checkbox" checked={checked} onChange={()=>toggleCat(c.type)} style={{flexShrink:0}}/>
              <Icon name={c.icon} size={13} color={`var(--${c.tone})`}/>
              <span style={{flex:1,fontSize:12,color:"var(--fg)"}}>{c.label}</span>
              {cnt>0&&<span style={{fontSize:10,fontWeight:700,color:`var(--${c.tone})`}}>{cnt}</span>}
            </label>);} )}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setActiveCats(new Set())} className="btn" data-variant="ghost" data-size="sm">Deseleziona tutto</button>
            <button onClick={()=>setActiveCats(new Set(VERIFICA_CATS.map(c=>c.type)))} className="btn" data-variant="outline" data-size="sm">Seleziona tutto</button>
            <button onClick={()=>setCatExpanded(false)} className="btn" data-variant="accent" data-size="sm" style={{marginLeft:"auto"}}>Applica filtri</button>
          </div>
        </div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 24px",background:"var(--bg)"}}>
        <div style={{padding:"14px 18px",borderRadius:"var(--radius-md)",background:ok?"var(--success-soft)":"var(--bg-elev)",border:`1px solid ${ok?"var(--success)":"var(--border)"}`,display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <Icon name={ok?"checkCircle":"alert"} size={22} color={ok?"var(--success)":"var(--danger)"}/>
          <span style={{fontWeight:700,fontSize:14,color:ok?"var(--success)":"var(--fg)"}}>{ok?"Tutto in regola.":filtered.length===0?"Nessun problema nei filtri selezionati.":`${filtered.length} problem${filtered.length===1?"a":"i"} rilevat${filtered.length===1?"o":"i"} · Clicca su un problema per navigare al mese`}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map((e,i)=>{const cat=VERIFICA_CATS.find(c=>c.type===e.type)||{icon:"alert",tone:"warning",label:e.type};return(<div key={i} onClick={()=>e.monthKey&&onNavigate(e.monthKey)} style={{padding:"12px 16px",borderRadius:"var(--radius-md)",border:"1px solid var(--border)",background:"var(--bg-elev)",display:"flex",gap:12,alignItems:"flex-start",cursor:e.monthKey?"pointer":"default",transition:"background .1s"}} onMouseEnter={ev=>{if(e.monthKey)ev.currentTarget.style.background="var(--bg-hover)";}} onMouseLeave={ev=>ev.currentTarget.style.background="var(--bg-elev)"}>
            <div style={{width:34,height:34,borderRadius:8,flexShrink:0,background:`var(--${cat.tone}-soft)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name={cat.icon} size={16} color={`var(--${cat.tone})`}/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span className="badge" data-tone={cat.tone} style={{fontSize:10}}>{cat.label}</span>
                {e.monthKey&&<span style={{fontSize:10,color:"var(--info)",fontWeight:600,display:"flex",alignItems:"center",gap:3,marginLeft:"auto"}}><Icon name="calendar" size={11} color="var(--info)"/>Vai a {MONTHS.find(m=>m.key===e.monthKey)?.label||e.monthKey}</span>}
              </div>
              <div style={{fontSize:13,color:"var(--fg)",lineHeight:1.5}}>{e.msg}</div>
              {e.detail&&<div style={{fontSize:11,color:"var(--fg-muted)",marginTop:3}}>{e.detail}</div>}
            </div>
          </div>);})}
          {filtered.length===0&&!ok&&<p style={{color:"var(--fg-subtle)",textAlign:"center",padding:20,fontSize:13}}>Nessun errore nei filtri selezionati.</p>}
        </div>
      </div>
    </div>
  </div>);
}

// ── ANAGRAFICA TUTOR SCREEN ───────────────────────────────────────────────
function AnaTutorsScreen({tutors,tutEvents,anagraficaAv,onSaveTutor,canEdit}){
  const[q,setQ]=useState("");const[selected,setSelected]=useState(null);const[editing,setEditing]=useState(false);const[form,setForm]=useState({});const[saving,setSaving]=useState(false);
  function getTutOre(tId){let o=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)o+=(ev.ore||0);return o;}
  function getTutSlots(tId){let s=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))s+=evs.length;return s;}
  function getTutAvvisiSet(tId){const n=new Set();const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)n.add(ev.name);return n;}
  const avOreByName={};anagraficaAv.forEach(a=>{let t=0;for(const[,ms]of Object.entries(tutEvents))for(const[,evs]of Object.entries(ms))for(const ev of evs)if(ev.name===a.nome)t+=ev.ore||0;avOreByName[a.nome]=t;});
  const filtered=[...tutors].filter(t=>`${t.nome} ${t.cognome} ${t.cf||""} ${t.azienda||""}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.cognome.localeCompare(b.cognome));
  useEffect(()=>{if(tutors.length>0&&!selected)setSelected(tutors[0]);},[tutors]);
  function startEdit(){setForm({...selected});setEditing(true);}
  async function saveEdit(){if(!form.nome||!form.cognome)return;setSaving(true);const newList=tutors.map(t=>t.id===form.id?form:t);await onSaveTutor(newList,"edit",form);setEditing(false);setSelected(form);setSaving(false);}
  async function addNew(){const usedColors=tutors.map(t=>t.color).filter(Boolean);const freeColor=PALETTE.find(c=>!usedColors.includes(c))||PALETTE[0];const newItem={id:`tutor-${Date.now()}`,nome:"Nuovo",cognome:"Tutor",cf:"",azienda:"",color:freeColor};const newList=[...tutors,newItem];await onSaveTutor(newList,"add",newItem);setSelected(newItem);setForm({...newItem});setEditing(true);}
  async function deleteSelected(){if(!selected||!confirm(`Eliminare "${selected.cognome} ${selected.nome}"?`))return;const newList=tutors.filter(t=>t.id!==selected.id);await onSaveTutor(newList,"delete",selected);setSelected(newList[0]||null);}
  const usedColors=tutors.filter(t=>t.id!==selected?.id).map(t=>t.color).filter(Boolean);
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
          {filtered.map(t=>{const isSel=selected?.id===t.id;const ore=getTutOre(t.id);const avvN=getTutAvvisiSet(t.id).size;const durataMax=anagraficaAv.filter(a=>[...getTutAvvisiSet(t.id)].includes(a.nome)).reduce((s,a)=>s+(a.durataOre||0),0);const pct=durataMax?Math.round(ore/durataMax*100):0;return(<button key={t.id} className={`list-item${isSel?" active":""}`} onClick={()=>{setSelected(t);setEditing(false);}}>
            {isSel&&<span style={{position:"absolute",left:0,top:12,bottom:12,width:3,background:t.color||"var(--accent)",borderRadius:"0 3px 3px 0"}}/>}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:36,height:36,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13.5,color:"var(--fg)"}}>{t.cognome} {t.nome}</div>
                <div style={{fontSize:11,color:"var(--fg-subtle)"}}>{t.azienda||"—"}</div>
              </div>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:700,fontSize:12,color:"var(--fg)"}}>{fmtOreMin(ore)}</span>
            </div>
            {durataMax>0&&<div className="progress-bar-track" style={{height:3}}><div className="progress-bar-fill" style={{width:`${Math.min(100,pct)}%`,background:pct>100?"var(--danger)":t.color||"var(--accent)"}}/></div>}
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
            {canEdit&&<div style={{display:"flex",gap:8,flexShrink:0}}>
              <button className="btn" data-variant="outline" onClick={startEdit} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="edit" size={13}/>Modifica</button>
              <button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={13} color="var(--danger)"/>Elimina</button>
            </div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {[{label:"Slot totali",value:getTutSlots(selected.id),icon:"mapPin"},{label:"Ore totali",value:fmtOreMin(getTutOre(selected.id)),icon:"clock"},{label:"Avvisi",value:getTutAvvisiSet(selected.id).size,icon:"briefcase"},{label:"Azienda",value:selected.azienda||"—",icon:"building"}].map(k=><div key={k.label} className="kpi-card"><div className="kpi-icon"><Icon name={k.icon} size={16} color="var(--accent)"/></div><div><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{fontSize:k.label==="Azienda"?13:20,color:"var(--fg)"}}>{k.value}</div></div></div>)}
          </div>
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Dettagli</div>
            <dl style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:"10px 16px",margin:0,fontSize:13}}>
              <dt style={{color:"var(--fg-subtle)"}}>Codice Fiscale</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.cf||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Colore</dt><dd style={{margin:0,display:"flex",alignItems:"center",gap:8}}><span style={{width:16,height:16,borderRadius:4,background:selected.color||"var(--accent)"}}/><span style={{fontFamily:'"JetBrains Mono",monospace',color:"var(--fg-muted)",fontSize:12}}>{(selected.color||"").toLowerCase()}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Avvisi seguiti</dt><dd style={{margin:0,color:"var(--fg)"}}>{[...getTutAvvisiSet(selected.id)].join(", ")||"—"}</dd>
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
            <button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina tutor</button>
            <div style={{display:"flex",gap:8}}><button className="btn" data-variant="outline" onClick={()=>setEditing(false)}>Annulla</button><button className="btn" data-variant="accent" onClick={saveEdit} disabled={saving} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={14} color="#fff"/>Salvataggio...</>:<><Icon name="check" size={14} color="#fff"/>Salva modifiche</>}</button></div>
          </div>
        </div>)}
      </div>):(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-subtle)"}}>Seleziona un tutor a sinistra</div>)}
    </div>
  </div>);
}

// ── ANAGRAFICA AVVISI SCREEN ──────────────────────────────────────────────
function AnaAvvisiScreen({avvisi,anagraficaAv,onSaveAna,canEdit}){
  const[q,setQ]=useState("");const[statoFilter,setStatoFilter]=useState("all");const[selected,setSelected]=useState(null);const[editing,setEditing]=useState(false);const[form,setForm]=useState({});const[saving,setSaving]=useState(false);
  const avById={};avvisi.forEach(av=>avById[av.id]=av);
  function getOre(ana){const av=avById[ana.id];return av?av.events.reduce((s,e)=>s+(e.ore||0),0):0;}
  function pct(ana){const ore=getOre(ana);return ana.durataOre?Math.round(ore/ana.durataOre*100):0;}
  const filtered=[...anagraficaAv].filter(a=>(statoFilter==="all"||a.stato===statoFilter)&&`${a.nome} ${a.codice||""}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.nome.localeCompare(b.nome));
  useEffect(()=>{if(anagraficaAv.length>0&&!selected)setSelected(anagraficaAv[0]);},[anagraficaAv]);
  function startEdit(){setForm({...selected});setEditing(true);}
  async function saveEdit(){if(!form.nome)return;setSaving(true);const newList=anagraficaAv.map(a=>a.id===form.id?form:a);await onSaveAna(newList,"edit",form);setEditing(false);setSelected(form);setSaving(false);}
  async function addNew(){const free=PALETTE.find(c=>!anagraficaAv.map(a=>a.colore).includes(c))||PALETTE[0];const newItem={id:`av-${Date.now()}`,nome:"Nuovo avviso",codice:"",colore:free,durataOre:400,stato:"In corso",dataInizio:"",dataFine:"",note:""};const newList=[...anagraficaAv,newItem];await onSaveAna(newList,"add",newItem);setSelected(newItem);setForm({...newItem});setEditing(true);}
  async function deleteSelected(){if(!selected||!confirm(`Eliminare "${selected.nome}"?`))return;const newList=anagraficaAv.filter(a=>a.id!==selected.id);await onSaveAna(newList,"delete",selected);setSelected(newList[0]||null);}
  const usedColors=anagraficaAv.filter(a=>a.id!==selected?.id).map(a=>a.colore).filter(Boolean);
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header" style={{flexWrap:"wrap",gap:12}}>
      <div><div className="page-breadcrumb">Anagrafiche · {anagraficaAv.length} progetti</div><h1 className="page-title">Avvisi / Progetti</h1><p className="page-desc">Bandi, avvisi pubblici e progetti formativi.</p></div>
      {canEdit&&<div style={{display:"flex",gap:8}}>
        <button className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="download" size={14}/>Esporta</button>
        <button className="btn" data-variant="accent" onClick={addNew} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={14} color="#fff"/>Nuovo avviso</button>
      </div>}
    </div>
    <div className="list-detail" style={{flex:1,minHeight:0}}>
      <div className="list-pane">
        <div className="list-pane-toolbar">
          <div style={{position:"relative",marginBottom:10}}><Icon name="search" size={14} color="var(--fg-faint)" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/><input className="input" placeholder="Cerca avviso o codice…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32}}/></div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{v:"all",label:"Tutti",count:anagraficaAv.length},{v:"In corso",label:"In corso",count:anagraficaAv.filter(a=>a.stato==="In corso").length},{v:"Sospeso",label:"Sospesi",count:anagraficaAv.filter(a=>a.stato==="Sospeso").length},{v:"Concluso",label:"Conclusi",count:anagraficaAv.filter(a=>a.stato==="Concluso").length}].map(o=><button key={o.v} onClick={()=>setStatoFilter(o.v)} style={{padding:"5px 10px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:5,background:statoFilter===o.v?"var(--bg-elev)":"transparent",color:statoFilter===o.v?"var(--fg)":"var(--fg-muted)",border:`1px solid ${statoFilter===o.v?"var(--border)":"transparent"}`}}>{o.label}<span style={{fontSize:10,color:"var(--fg-subtle)",fontFamily:'"JetBrains Mono",monospace'}}>{o.count}</span></button>)}
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
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11.5,color:"var(--fg-muted)",marginBottom:8}}>
              <span>{a.dataInizio||"—"}{a.dataFine?` → ${a.dataFine}`:""}</span>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:600,color:p>100?"var(--danger)":"var(--fg)"}}>{ore}/{a.durataOre||"?"}h</span>
            </div>
            <div className="progress-bar-track" style={{height:4}}>
              <div className="progress-bar-fill" style={{width:`${Math.min(100,p)}%`,background:p>100?"var(--danger)":a.colore||"var(--accent)"}}/>
            </div>
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
            {canEdit&&<div style={{display:"flex",gap:8,flexShrink:0}}>
              <button className="btn" data-variant="outline" onClick={startEdit} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="edit" size={13}/>Modifica</button>
              <button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={13} color="var(--danger)"/>Elimina</button>
            </div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
            {[{label:"Da bando",value:`${selected.durataOre||"?"}h`,icon:"file"},{label:"Calendario",value:`${getOre(selected)}h`,icon:"calendar",warn:getOre(selected)>selected.durataOre},{label:"Tutor",value:"—",icon:"user"},{label:"Slot",value:(avById[selected.id]?.events?.length||0),icon:"clock"}].map(k=><div key={k.label} className="kpi-card"><div className="kpi-icon"><Icon name={k.icon} size={16} color={k.warn?"var(--danger)":"var(--accent)"}/></div><div><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{color:k.warn?"var(--danger)":"var(--fg)",fontSize:22}}>{k.value}</div></div></div>)}
          </div>
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,marginBottom:20,boxShadow:"var(--shadow-xs)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Avanzamento ore</div>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:13,fontWeight:700,color:pct(selected)>100?"var(--danger)":"var(--fg)"}}>{pct(selected)}% · {getOre(selected)}/{selected.durataOre||"?"}h</span>
            </div>
            <div className="progress-bar-track" style={{height:10}}>
              <div className="progress-bar-fill" style={{width:`${Math.min(100,pct(selected))}%`,background:`linear-gradient(90deg,${selected.colore||"var(--accent)"}aa,${selected.colore||"var(--accent)"})`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:"var(--fg-subtle)"}}><span>{selected.dataInizio||"—"}</span><span>{selected.dataFine||"—"}</span></div>
          </div>
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Dettagli</div>
            <dl style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:"10px 16px",margin:0,fontSize:13}}>
              <dt style={{color:"var(--fg-subtle)"}}>Codice avviso</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.codice||"—"}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Stato</dt><dd style={{margin:0}}><span className="badge" data-tone={STATO_TONES[selected.stato]||"info"}>{selected.stato}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Periodo</dt><dd style={{margin:0,color:"var(--fg)"}}>{selected.dataInizio||"—"}{selected.dataFine?` → ${selected.dataFine}`:""}</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Durata da bando</dt><dd style={{margin:0,fontFamily:'"JetBrains Mono",monospace',color:"var(--fg)"}}>{selected.durataOre||"?"}h</dd>
              <dt style={{color:"var(--fg-subtle)"}}>Colore</dt><dd style={{margin:0,display:"flex",alignItems:"center",gap:8}}><span style={{width:16,height:16,borderRadius:4,background:selected.colore||"var(--accent)"}}/><span style={{fontFamily:'"JetBrains Mono",monospace',color:"var(--fg-muted)",fontSize:12}}>{(selected.colore||"").toLowerCase()}</span></dd>
              <dt style={{color:"var(--fg-subtle)"}}>Note</dt><dd style={{margin:0,color:"var(--fg)",lineHeight:1.55}}>{selected.note||"—"}</dd>
            </dl>
          </div></>
        ):(
          <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:24,boxShadow:"var(--shadow-xs)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:16}}>Modifica avviso</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Nome *</label><input className="input" value={form.nome||""} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}/></div><div><label className="label">Codice</label><input className="input mono" value={form.codice||""} onChange={e=>setForm(f=>({...f,codice:e.target.value}))}/></div></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Durata (ore)</label><input className="input mono" type="number" min="0" value={form.durataOre||""} onChange={e=>setForm(f=>({...f,durataOre:e.target.value===""?"":Number(e.target.value)}))}/></div><div><label className="label">Stato</label><select className="select" value={form.stato||"In corso"} onChange={e=>setForm(f=>({...f,stato:e.target.value}))}>{AV_STATI.map(s=><option key={s} value={s}>{s}</option>)}</select></div><div><label className="label">Colore</label><ColorPicker value={form.colore||PALETTE[0]} onChange={c=>setForm(f=>({...f,colore:c}))} usedColors={usedColors}/></div></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><div><label className="label">Data inizio</label><input className="input" value={form.dataInizio||""} onChange={e=>setForm(f=>({...f,dataInizio:e.target.value}))}/></div><div><label className="label">Data fine</label><input className="input" value={form.dataFine||""} onChange={e=>setForm(f=>({...f,dataFine:e.target.value}))}/></div></div>
            <div style={{marginBottom:14}}><label className="label">Note</label><textarea className="textarea" value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={3}/></div>
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid var(--divider)",paddingTop:14}}>
              <button className="btn" data-variant="danger" onClick={deleteSelected} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina avviso</button>
              <div style={{display:"flex",gap:8}}><button className="btn" data-variant="outline" onClick={()=>setEditing(false)}>Annulla</button><button className="btn" data-variant="accent" onClick={saveEdit} disabled={saving} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<><Icon name="loader" size={14} color="#fff"/>Salvataggio...</>:<><Icon name="check" size={14} color="#fff"/>Salva modifiche</>}</button></div>
            </div>
          </div>
        )}
      </div>):(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--fg-subtle)"}}>Seleziona un avviso a sinistra</div>)}
    </div>
  </div>);
}

// ── INSIGHTS SCREEN ───────────────────────────────────────────────────────
function InsightsScreen({avvisi,anagraficaAv,tutors,tutEvents,currentMonthKey,onClose,onNavigate}){
  const[viewMode,setViewMode]=useState("tutor");
  const[selMonthKey,setSelMonthKey]=useState(currentMonthKey);
  const[expandedTut,setExpandedTut]=useState({});
  const[expandedTutAv,setExpandedTutAv]=useState({});
  const[expandedAv,setExpandedAv]=useState({});
  const[expandedAvTut,setExpandedAvTut]=useState({});
  const avById={};avvisi.forEach(av=>avById[av.id]=av);
  function getTutOreAnno(tId,avName){let t=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)if(ev.name===avName)t+=(ev.ore||0);return t;}
  function getTutOreMese(tId,mk){let t=0;const td=tutEvents[tId]||{};return(td[mk]||[]).reduce((s,e)=>s+e.ore,0);}
  function getTutOreAvMese(tId,avName,mk){let t=0;const td=tutEvents[tId]||{};return(td[mk]||[]).filter(e=>e.name===avName).reduce((s,e)=>s+e.ore,0);}
  function getTutAvvisiMese(tId,mk){const n=new Set();(tutEvents[tId]?.[mk]||[]).forEach(e=>n.add(e.name));return[...n].sort();}
  function getTutTotOre(tId){let t=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)t+=ev.ore||0;return t;}
  function getAvOreMese(anaId,mk){const av=avById[anaId];if(!av)return 0;return av.events.filter(e=>e.month===mk).reduce((s,e)=>s+e.ore,0);}
  function getAvTotOre(anaId){const av=avById[anaId];if(!av)return 0;return av.events.reduce((s,e)=>s+e.ore,0);}
  function getTutsForAvMese(avName,mk){return[...tutors].filter(t=>(tutEvents[t.id]?.[mk]||[]).some(e=>e.name===avName)).sort((a,b)=>a.cognome.localeCompare(b.cognome));}
  function getSlotsForTutAvMese(tId,avName,mk){return(tutEvents[tId]?.[mk]||[]).filter(e=>e.name===avName).sort((a,b)=>a.day-b.day||a.start-b.start);}
  const pctBadge=(ore,max)=>{if(!max)return null;const p=ore/max*100;return<span className="badge" data-tone={p>100?"danger":p>=80?"success":"info"}>{Math.round(p)}%</span>;};
  const allMonths=MONTHS.filter(m=>{const mk=m.key;const hasTut=tutors.some(t=>(tutEvents[t.id]?.[mk]||[]).length>0);const hasAv=anagraficaAv.some(a=>(avById[a.id]?.events||[]).some(e=>e.month===mk));return hasTut||hasAv;});
  const selMonth=MONTHS.find(m=>m.key===selMonthKey)||MONTHS[2];
  const totTutOre=tutors.reduce((s,t)=>s+getTutOreMese(t.id,selMonthKey),0);
  const totAvOre=anagraficaAv.reduce((s,a)=>s+getAvOreMese(a.id,selMonthKey),0);
  const activeTutors=tutors.filter(t=>getTutOreMese(t.id,selMonthKey)>0);
  const activeAvvisi=anagraficaAv.filter(a=>getAvOreMese(a.id,selMonthKey)>0);
  function toggleTut(id){setExpandedTut(p=>({...p,[id]:!p[id]}))}
  function toggleTutAv(key){setExpandedTutAv(p=>({...p,[key]:!p[key]}))}
  function toggleAv(id){setExpandedAv(p=>({...p,[id]:!p[id]}))}
  function toggleAvTut(key){setExpandedAvTut(p=>({...p,[key]:!p[key]}))}
  return(<div className="drawer-overlay">
    <div className="drawer-backdrop" onClick={onClose}/>
    <div style={{width:"88%",maxWidth:900,background:"var(--bg-elev)",borderLeft:"1px solid var(--border)",boxShadow:"var(--shadow-lg)",display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"var(--bg-elev)"}}>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:16,color:"var(--fg)"}}>Insights & Riepiloghi</div><div style={{fontSize:11,color:"var(--fg-subtle)",marginTop:2}}>{selMonth.label}</div></div>
        <button onClick={()=>{const d={};try{d.avvisi=avvisi;d.tutors=tutors;d.tutEvents=tutEvents;d.anagraficaAv=anagraficaAv;}catch(e){}const b=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`insights_${selMonthKey}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);}} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="download" size={13}/>Esporta JSON</button>
        <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="x" size={16}/></button>
      </div>
      <div style={{padding:"10px 24px",borderBottom:"1px solid var(--border)",display:"flex",gap:10,alignItems:"center",flexShrink:0,background:"var(--bg-elev)"}}>
        <div className="tab-strip">
          <button className={`tab-strip-btn${viewMode==="tutor"?" active":""}`} onClick={()=>setViewMode("tutor")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="user" size={12}/>Per tutor</button>
          <button className={`tab-strip-btn${viewMode==="avviso"?" active":""}`} onClick={()=>setViewMode("avviso")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="clipboard" size={12}/>Per avviso</button>
        </div>
        <select className="select" value={selMonthKey} onChange={e=>setSelMonthKey(e.target.value)} style={{minWidth:160}}>{allMonths.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select>
        <div style={{flex:1}}/>
      </div>
      <div style={{display:"flex",gap:12,padding:"14px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        {[{label:"Tutor attivi",val:activeTutors.length,icon:"users"},{label:"Ore periodo",val:fo(viewMode==="tutor"?totTutOre:totAvOre),icon:"clock"},{label:"Avvisi attivi",val:activeAvvisi.length,icon:"briefcase"}].map(k=><div key={k.label} className="kpi-card" style={{flex:1}}><div className="kpi-icon"><Icon name={k.icon} size={15} color="var(--accent)"/></div><div><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{fontSize:18}}>{k.val}</div></div></div>)}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 24px",background:"var(--bg)"}}>
        {viewMode==="tutor"&&[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=>{
          const ore=getTutOreMese(t.id,selMonthKey);const avNames=getTutAvvisiMese(t.id,selMonthKey);const totOre=getTutTotOre(t.id);
          if(!ore&&!avNames.length)return null;
          const exp=expandedTut[t.id];
          return(<div key={t.id} style={{marginBottom:8,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)"}}>
            <button onClick={()=>toggleTut(t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
              <div style={{width:32,height:32,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{t.cognome} {t.nome}</div><div style={{fontSize:11,color:"var(--fg-subtle)"}}>{avNames.length} avvisi · {totOre.toFixed(1)}h totali</div></div>
              <span style={{fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace',fontSize:13}}>{fo(ore)}</span>
              <Icon name={exp?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
            </button>
            {exp&&<div style={{padding:"8px 14px",borderTop:"1px solid var(--divider)"}}>
              {avNames.map(avName=>{const oreAv=getTutOreAvMese(t.id,avName,selMonthKey);const oreAnno=getTutOreAnnoPerAv(t.id,avName);const ana=anagraficaAv.find(a=>a.nome===avName);const avKey=`${t.id}-${avName}`;const expAv=expandedTutAv[avKey];
                return(<div key={avName} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleTutAv(avKey)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <span style={{width:8,height:8,borderRadius:2,background:ana?.colore||"var(--accent)",flexShrink:0}}/>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>{avName}</span>
                    {pctBadge(oreAnno,ana?.durataOre)}
                    <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:"var(--fg)"}}>{fo(oreAv)}</span>
                    <Icon name={expAv?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expAv&&<div style={{padding:"6px 12px",borderTop:"1px solid var(--divider)",display:"flex",flexWrap:"wrap",gap:4}}>
                    {getSlotsForTutAvMese(t.id,avName,selMonthKey).map((sl,i)=>(
                      <button key={i} onClick={()=>{onNavigate&&onNavigate(selMonthKey,sl.day);}} style={{fontSize:10,padding:"3px 8px",borderRadius:4,background:"var(--bg-sunken)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--fg-muted)",fontFamily:'"JetBrains Mono",monospace'}}>{sl.day} · {fmt(sl.start)}–{fmt(sl.end)}</button>
                    ))}
                  </div>}
                </div>);
              })}
            </div>}
          </div>);
        })}
        {viewMode==="avviso"&&[...anagraficaAv].sort((a,b)=>a.nome.localeCompare(b.nome)).map(ana=>{
          const oreAv=getAvOreMese(ana.id,selMonthKey);const tuts=getTutsForAvMese(ana.nome,selMonthKey);
          if(!oreAv&&!tuts.length)return null;
          const exp=expandedAv[ana.id];const totOre=getAvTotOre(ana.id);const pct=ana.durataOre?Math.round(totOre/ana.durataOre*100):null;
          return(<div key={ana.id} style={{marginBottom:8,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)"}}>
            <button onClick={()=>toggleAv(ana.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
              <span style={{width:10,height:10,borderRadius:3,background:ana.colore||"var(--accent)",flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{ana.nome}</div><div style={{fontSize:11,color:"var(--fg-subtle)"}}>{tuts.length} tutor{ana.durataOre?` · ${totOre.toFixed(1)}/${ana.durataOre}h`:""}</div></div>
              {pct!=null&&<span className="badge" data-tone={pct>100?"danger":pct>=80?"success":"info"}>{pct}%</span>}
              <span style={{fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace',fontSize:13}}>{fo(oreAv)}</span>
              <Icon name={exp?"chevUp":"chevDown"} size={14} color="var(--fg-subtle)"/>
            </button>
            {exp&&<div style={{padding:"8px 14px",borderTop:"1px solid var(--divider)"}}>
              {tuts.map(t=>{const oreT=getSlotsForTutAvMese(t.id,ana.nome,selMonthKey).reduce((s,e)=>s+e.ore,0);const avKey=`${ana.id}-${t.id}`;const expT=expandedAvTut[avKey];
                return(<div key={t.id} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                  <button onClick={()=>toggleAvTut(avKey)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                    <div style={{width:22,height:22,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div>
                    <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--fg)"}}>{t.cognome} {t.nome}</span>
                    <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,fontWeight:700,color:"var(--fg)"}}>{fo(oreT)}</span>
                    <Icon name={expT?"chevUp":"chevDown"} size={12} color="var(--fg-subtle)"/>
                  </button>
                  {expT&&<div style={{padding:"6px 12px",borderTop:"1px solid var(--divider)",display:"flex",flexWrap:"wrap",gap:4}}>
                    {getSlotsForTutAvMese(t.id,ana.nome,selMonthKey).map((sl,i)=>(
                      <button key={i} onClick={()=>{onNavigate&&onNavigate(selMonthKey,sl.day);}} style={{fontSize:10,padding:"3px 8px",borderRadius:4,background:"var(--bg-sunken)",border:"1px solid var(--border)",cursor:"pointer",color:"var(--fg-muted)",fontFamily:'"JetBrains Mono",monospace'}}>{sl.day} · {fmt(sl.start)}–{fmt(sl.end)}</button>
                    ))}
                  </div>}
                </div>);
              })}
            </div>}
          </div>);
        })}
      </div>
    </div>
  </div>);
}
function getTutOreAnnoPerAv(tId,avName,tutEvents){let t=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)if(ev.name===avName)t+=(ev.ore||0);return t;}

// ── CUSTOMIZE PANEL ───────────────────────────────────────────────────────
function CustomizePanel({settings,theme,setTheme,onSaveSettings}){
  const[logoB64,setLogoB64]=useState(settings.logoBase64||"");
  const[appSubtitle,setAppSubtitle]=useState(settings.appSubtitle||"");
  const[primaryColor,setPrimaryState]=useState(settings.brandNavy||"#1E2248");
  const[primaryInput,setPrimaryInput]=useState(settings.brandNavy||"#1E2248");
  const[accentColor,setAccentState]=useState(settings.accentColor||"#EC7A26");
  const[accentInput,setAccentInput]=useState(settings.accentColor||"#EC7A26");
  const[bgColor,setBgState]=useState(settings.bgColor||"");
  const[bgInput,setBgInput]=useState(settings.bgColor||"");
  const[density,setDensityState]=useState(settings.density||"cozy");
  const[defaultCalView,setDefaultCalView]=useState(settings.defaultCalView||"day");
  const[startHour,setStartHour]=useState(settings.startHour||8);
  const[defaultZoom,setDefaultZoom]=useState(settings.defaultZoom??2);
  const[saved,setSaved]=useState(false);
  function applyAccent(c){if(!/^#[0-9A-Fa-f]{6}$/.test(c))return;document.documentElement.style.setProperty("--accent",c);document.documentElement.style.setProperty("--accent-strong",darkenHex(c,.15));document.documentElement.style.setProperty("--accent-soft",lightenHex(c,.85));}
  function applyPrimary(c){if(!/^#[0-9A-Fa-f]{6}$/.test(c))return;document.documentElement.style.setProperty("--brand-navy",c);}
  function applyBg(c){if(c&&/^#[0-9A-Fa-f]{6}$/.test(c))document.documentElement.style.setProperty("--bg",c);}
  function setAccent(c){setAccentState(c);setAccentInput(c);applyAccent(c);}
  function setPrimary(c){setPrimaryState(c);setPrimaryInput(c);applyPrimary(c);}
  function setBg(c){setBgState(c);setBgInput(c);applyBg(c);}
  function setDensity(v){setDensityState(v);document.documentElement.setAttribute("data-density",v);}
  function handleLogoFile(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setLogoB64(ev.target.result);r.readAsDataURL(f);e.target.value="";}
  async function handleSave(){
    const prefs={accentColor,brandNavy:primaryColor,bgColor,density,defaultCalView,startHour,defaultZoom,theme,logoBase64:logoB64,appSubtitle};
    await onSaveSettings(prefs);applyAccent(accentColor);applyPrimary(primaryColor);if(bgColor)applyBg(bgColor);document.documentElement.setAttribute("data-density",density);setSaved(true);setTimeout(()=>setSaved(false),2000);
  }
  const colorRows=[
    {label:"Primario (Navy)",val:primaryColor,input:primaryInput,setInput:setPrimaryInput,set:setPrimary,default:"#1E2248"},
    {label:"Secondario / Accento",val:accentColor,input:accentInput,setInput:setAccentInput,set:setAccent,default:"#EC7A26"},
    {label:"Sfondo",val:bgColor,input:bgInput,setInput:setBgInput,set:setBg,default:""},
  ];
  return(<div style={{maxWidth:680}}>
    <h2 style={{fontSize:18,fontWeight:600,marginBottom:4,color:"var(--fg)"}}>Personalizza</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:24}}>Logo, colori, densità e preferenze calendario.</p>
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:20,boxShadow:"var(--shadow-xs)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Logo</div>
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          {[{bg:"#F5F4EF",label:"Chiaro"},{bg:"#1A1F4D",label:"Scuro"}].map(({bg,label})=>(
            <div key={bg} style={{flex:1,background:bg,borderRadius:"var(--radius)",padding:16,display:"flex",flexDirection:"column",alignItems:"center",gap:8,border:"1px solid var(--border)"}}>
              {logoB64?<img src={logoB64} alt="Logo" style={{width:80,height:40,objectFit:"contain"}}/>:<img src={bg==="#F5F4EF"?"assets/appmark-color.png":"assets/appmark-white.png"} alt="Logo" style={{width:40,height:40,objectFit:"contain"}}/>}
              <span style={{fontSize:10,color:bg==="#F5F4EF"?"#888":"rgba(255,255,255,.5)"}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <label className="btn" data-variant="outline" style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Icon name="upload" size={13}/>Carica logo<input type="file" accept=".png,.svg" style={{display:"none"}} onChange={handleLogoFile}/></label>
          {logoB64&&<button className="btn" data-variant="ghost" onClick={()=>setLogoB64("")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="x" size={13}/>Reset</button>}
        </div>
        <div><label className="label">Sottotitolo app (login)</label><input className="input" value={appSubtitle} onChange={e=>setAppSubtitle(e.target.value)} placeholder="EHT — A Harmonic Innovation Group Company"/></div>
      </div>
      <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:20,boxShadow:"var(--shadow-xs)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Colori</div>
        {colorRows.map(c=>(
          <div key={c.label} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(c.val)?c.val:"#cccccc"} onChange={e=>c.set(e.target.value)} style={{width:40,height:40,borderRadius:8,border:"1px solid var(--border)",cursor:"pointer",padding:2}}/>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"var(--fg)",marginBottom:4}}>{c.label}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input className="input mono" value={c.input} onChange={e=>{c.setInput(e.target.value);if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value))c.set(e.target.value);}} placeholder={c.default||"#ffffff"} maxLength={7} style={{width:120,fontSize:12}}/>
                {c.input&&!/^#[0-9A-Fa-f]{6}$/.test(c.input)&&<span style={{fontSize:10,color:"var(--danger)"}}>Formato non valido</span>}
              </div>
            </div>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:8,padding:"8px 12px",borderRadius:"var(--radius)",background:"var(--bg-sunken)",border:"1px solid var(--border)",flexWrap:"wrap",alignItems:"center"}}>
          <button className="btn" data-variant="primary" style={{fontSize:11}}>Pulsante primario</button>
          <button className="btn" data-variant="accent" style={{fontSize:11}}>Pulsante secondario</button>
          <span className="badge" data-tone="accent" style={{alignSelf:"center"}}>Badge</span>
          <span className="badge" style={{alignSelf:"center",background:"var(--brand-navy)",color:"#fff",border:"none"}}>Navy</span>
        </div>
      </div>
      <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:20,boxShadow:"var(--shadow-xs)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Preferenze</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div><div style={{fontSize:12,fontWeight:600,color:"var(--fg)",marginBottom:8}}>Tema</div>
            <div style={{display:"flex",gap:6,padding:3,background:"var(--bg-sunken)",borderRadius:"var(--radius)",border:"1px solid var(--border)",width:"fit-content"}}>
              <button onClick={()=>setTheme("light")} className={`theme-btn${theme==="light"?" active":""}`} style={{display:"flex",alignItems:"center",gap:5}}><Icon name="sun" size={12}/>Light</button>
              <button onClick={()=>setTheme("dark")} className={`theme-btn${theme==="dark"?" active":""}`} style={{display:"flex",alignItems:"center",gap:5}}><Icon name="moon" size={12}/>Dark</button>
            </div>
          </div>
          <div><div style={{fontSize:12,fontWeight:600,color:"var(--fg)",marginBottom:8}}>Densità</div>
            <div style={{display:"flex",gap:6}}>
              {[{v:"cozy",label:"Comodo"},{v:"compact",label:"Compatto"}].map(o=><button key={o.v} onClick={()=>setDensity(o.v)} style={{padding:"6px 14px",borderRadius:"var(--radius)",border:`1.5px solid ${density===o.v?"var(--accent)":"var(--border)"}`,background:density===o.v?"var(--accent-soft)":"var(--bg-elev)",color:density===o.v?"var(--accent-strong)":"var(--fg)",fontWeight:600,fontSize:12,cursor:"pointer"}}>{o.label}</button>)}
            </div>
          </div>
          <div><div style={{fontSize:12,fontWeight:600,color:"var(--fg)",marginBottom:8}}>Vista default</div>
            <div style={{display:"flex",gap:6}}>
              {[{v:"month",label:"Mese"},{v:"week",label:"Sett."},{v:"day",label:"Giorno"}].map(o=><button key={o.v} onClick={()=>setDefaultCalView(o.v)} style={{padding:"6px 12px",borderRadius:"var(--radius)",border:`1.5px solid ${defaultCalView===o.v?"var(--accent)":"var(--border)"}`,background:defaultCalView===o.v?"var(--accent-soft)":"var(--bg-elev)",color:defaultCalView===o.v?"var(--accent-strong)":"var(--fg)",fontWeight:600,fontSize:12,cursor:"pointer"}}>{o.label}</button>)}
            </div>
          </div>
          <div><div style={{fontSize:12,fontWeight:600,color:"var(--fg)",marginBottom:8}}>Orario inizio</div>
            <select className="select" value={startHour} onChange={e=>setStartHour(Number(e.target.value))}>{[7,8,9].map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}</select>
          </div>
          <div><div style={{fontSize:12,fontWeight:600,color:"var(--fg)",marginBottom:8}}>Zoom default</div>
            <select className="select" value={defaultZoom} onChange={e=>setDefaultZoom(Number(e.target.value))}>{ZOOM_LEVELS.map((z,i)=><option key={i} value={i}>{Math.round(z*100)}%</option>)}</select>
          </div>
        </div>
      </div>
      <button className="btn" data-variant={saved?"accent":"primary"} onClick={handleSave} style={{display:"flex",alignItems:"center",gap:6,width:"fit-content"}}>{saved?<><Icon name="check" size={14} color="#fff"/>Salvato</>:<><Icon name="save" size={14} color="#fff"/>Salva preferenze</>}</button>
    </div>
  </div>);
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────────────
function SettingsScreen({role,settings,avvisi,tutors,tutEvents,anagraficaAv,onSaveSettings,isSuperAdmin,isAdmin,isUser,theme,setTheme}){
  const[section,setSection]=useState("personalizza");
  const SUB=[
    {id:"personalizza",label:"Personalizza",icon:"palette",desc:"Tema, colori, densità e preferenze."},
    isAdmin&&{id:"users",label:"Utenti & Permessi",icon:"key",desc:"Chi può accedere e cosa può fare."},
    isSuperAdmin&&{id:"api",label:"API & AI",icon:"sparkles",desc:"Chiavi Gemini, OpenAI e provider attivo."},
    isUser&&{id:"backup",label:"Backup",icon:"save",desc:"Snapshot del database, import/export."},
    isUser&&{id:"log",label:"Log attività",icon:"clock",desc:"Storico delle modifiche per utente."},
    isAdmin&&{id:"demo",label:"Dati demo",icon:"dice",desc:"Carica dati di esempio o resetta tutto."},
  ].filter(Boolean);
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header"><div><div className="page-breadcrumb">Sistema</div><h1 className="page-title">Impostazioni</h1></div></div>
    <div style={{flex:1,display:"flex",minHeight:0}}>
      <aside style={{width:240,flexShrink:0,padding:"18px 14px",borderRight:"1px solid var(--border)",background:"var(--bg)"}}>
        {SUB.map(s=>{const active=section===s.id;return(<button key={s.id} onClick={()=>setSection(s.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",background:active?"var(--bg-elev)":"transparent",border:`1px solid ${active?"var(--border)":"transparent"}`,borderRadius:"var(--radius)",cursor:"pointer",textAlign:"left",marginBottom:4,boxShadow:active?"var(--shadow-xs)":"none"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.background="var(--bg-hover)";}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
          <div style={{width:32,height:32,borderRadius:8,background:active?"var(--accent-soft)":"var(--bg-sunken)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name={s.icon} size={15} color={active?"var(--accent-strong)":"var(--fg-muted)"}/>
          </div>
          <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:active?700:600,color:"var(--fg)"}}>{s.label}</div><div style={{fontSize:11,color:"var(--fg-subtle)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.desc}</div></div>
        </button>);})}
      </aside>
      <div style={{flex:1,overflowY:"auto",padding:32,background:"var(--bg)"}}>
        {section==="personalizza"&&<CustomizePanel settings={settings} theme={theme} setTheme={setTheme} onSaveSettings={onSaveSettings}/>}
        {section==="users"&&<UsersPanel isSuperAdmin={isSuperAdmin}/>}
        {section==="api"&&<ApiPanel settings={settings} onSave={onSaveSettings}/>}
        {section==="backup"&&<BackupPanel avvisi={avvisi} tutors={tutors} tutEvents={tutEvents} anagraficaAv={anagraficaAv}/>}
        {section==="log"&&<LogPanel/>}
        {section==="demo"&&<DemoPanel isSuperAdmin={isSuperAdmin}/>}
      </div>
    </div>
  </div>);
}

// ── SETTINGS SUB-PANELS ───────────────────────────────────────────────────
function UsersPanel({isSuperAdmin}){
  const[emails,setEmails]=useState([]);const[newEmail,setNewEmail]=useState("");const[newRole,setNewRole]=useState("user");const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[editingRole,setEditingRole]=useState({});
  useEffect(()=>{db.collection("authorizedEmails").get().then(snap=>{setEmails(snap.docs.map(d=>({email:d.id,...d.data()})));setLoading(false);});},[]);
  async function handleAdd(){if(!newEmail.trim())return;setSaving(true);await db.collection("authorizedEmails").doc(newEmail.trim().toLowerCase()).set({role:newRole});const snap=await db.collection("authorizedEmails").get();setEmails(snap.docs.map(d=>({email:d.id,...d.data()})));setNewEmail("");setSaving(false);}
  async function handleRemove(email){if(!confirm(`Rimuovere ${email}?`))return;await db.collection("authorizedEmails").doc(email).delete();setEmails(p=>p.filter(e=>e.email!==email));}
  async function handleRoleChange(email,r){await db.collection("authorizedEmails").doc(email).update({role:r});setEmails(p=>p.map(e=>e.email===email?{...e,role:r}:e));setEditingRole(p=>({...p,[email]:false}));}
  const roleOptions=isSuperAdmin?["user","admin","viewer","superadmin"]:["user","admin","viewer"];
  return(<div style={{maxWidth:880}}>
    <h2 style={{fontSize:18,fontWeight:600,marginBottom:4,color:"var(--fg)"}}>Utenti & permessi</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Aggiungi gli indirizzi email autorizzati.</p>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,marginBottom:22,boxShadow:"var(--shadow-xs)"}}>
      <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>Invita un nuovo utente</div>
      <div style={{display:"flex",gap:10}}><input className="input" placeholder="email@azienda.it" value={newEmail} onChange={e=>setNewEmail(e.target.value)} style={{flex:2}}/><select className="select" value={newRole} onChange={e=>setNewRole(e.target.value)} style={{flex:1}}>{roleOptions.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select><button className="btn" data-variant="accent" onClick={handleAdd} disabled={saving} style={{display:"flex",alignItems:"center",gap:6}}>{saving?<Icon name="loader" size={14} color="#fff"/>:<Icon name="plus" size={14} color="#fff"/>}Aggiungi</button></div>
    </div>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",overflow:"hidden",boxShadow:"var(--shadow-xs)"}}>
      <div style={{padding:"10px 18px",background:"var(--bg-sunken)",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Utenti autorizzati · {emails.length}</span></div>
      {loading?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,display:"flex",alignItems:"center",gap:8}}><Icon name="loader" size={14} color="var(--fg-subtle)"/>Caricamento...</p>:emails.map(e=>{const iconName=ROLE_ICON[e.role]||"user";const col=ROLE_COLOR[e.role]||"var(--fg-subtle)";return(<div key={e.email} style={{padding:"14px 18px",borderBottom:"1px solid var(--divider)",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:36,height:36,borderRadius:999,background:"var(--bg-sunken)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={iconName} size={16} color={col}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,fontWeight:600,color:"var(--fg)"}}>{e.email}</div>
          {editingRole[e.email]?<div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}><select defaultValue={e.role} id={`role-${e.email}`} className="select" style={{height:28,fontSize:12}}>{roleOptions.map(r=><option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select><button onClick={()=>handleRoleChange(e.email,document.getElementById(`role-${e.email}`).value)} className="btn" data-variant="accent" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}><Icon name="check" size={12} color="#fff"/>Salva</button><button onClick={()=>setEditingRole(p=>({...p,[e.email]:false}))} className="btn" data-variant="ghost" data-size="sm"><Icon name="x" size={12}/></button></div>
          :<div style={{fontSize:11,color:col,fontWeight:600,marginTop:2,display:"flex",alignItems:"center",gap:4}}><Icon name={iconName} size={11} color={col}/>{ROLE_LABEL[e.role]||e.role}</div>}
        </div>
        <button onClick={()=>setEditingRole(p=>({...p,[e.email]:true}))} className="btn" data-variant="outline" data-size="icon-sm"><Icon name="edit" size={13} color="var(--fg-muted)"/></button>
        <button onClick={()=>handleRemove(e.email)} className="btn" data-variant="danger" data-size="icon-sm"><Icon name="trash" size={13} color="var(--danger)"/></button>
      </div>);})}
    </div>
  </div>);
}

function ApiPanel({settings,onSave}){
  const[aiProvider,setAiProvider]=useState(settings.aiProvider||"gemini");const[geminiKey,setGeminiKey]=useState(settings.geminiApiKey||"");const[openaiKey,setOpenaiKey]=useState(settings.openaiApiKey||"");const[saved,setSaved]=useState(false);
  const[testG,setTestG]=useState(null);const[testO,setTestO]=useState(null);const[cdG,setCdG]=useState(0);const[cdO,setCdO]=useState(0);
  useEffect(()=>{if(cdG<=0)return;const t=setInterval(()=>setCdG(c=>Math.max(0,c-1)),1000);return()=>clearInterval(t);},[cdG]);
  useEffect(()=>{if(cdO<=0)return;const t=setInterval(()=>setCdO(c=>Math.max(0,c-1)),1000);return()=>clearInterval(t);},[cdO]);
  async function handleSave(){await onSave({aiProvider,geminiApiKey:geminiKey,openaiApiKey:openaiKey});setSaved(true);setTimeout(()=>setSaved(false),2000);}
  async function testGemini(){if(!geminiKey){setTestG({ok:false,msg:"Chiave non inserita"});return;}setTestG(null);try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"OK"}]}]})});setTestG(r.ok?{ok:true,msg:"Connessione riuscita"}:r.status===429?{ok:false,msg:"Quota esaurita"}:r.status===401?{ok:false,msg:"Chiave non valida"}:{ok:false,msg:`Errore ${r.status}`});}catch{setTestG({ok:false,msg:"Errore di rete"});}setCdG(60);}
  async function testOpenai(){if(!openaiKey){setTestO({ok:false,msg:"Chiave non inserita"});return;}setTestO(null);try{const r=await fetch("https://api.openai.com/v1/models",{headers:{"Authorization":`Bearer ${openaiKey}`}});setTestO(r.ok?{ok:true,msg:"Connessione riuscita"}:r.status===429?{ok:false,msg:"Quota esaurita"}:r.status===401?{ok:false,msg:"Chiave non valida"}:{ok:false,msg:`Errore ${r.status}`});}catch{setTestO({ok:false,msg:"Errore di rete"});}setCdO(60);}
  return(<div style={{maxWidth:720}}>
    <h2 style={{fontSize:18,fontWeight:600,marginBottom:4,color:"var(--fg)"}}>API & AI</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Chiavi per l'assistente di import. Salvate cifrate su Firestore.</p>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:18,marginBottom:14,boxShadow:"var(--shadow-xs)"}}>
      <div style={{fontSize:11,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>Provider attivo</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{v:"gemini",label:"Google Gemini",icon:"sparkles",desc:"gemini-2.0-flash · veloce"},{v:"openai",label:"OpenAI",icon:"zap",desc:"gpt-4o-mini · ottima sui PDF"}].map(o=><button key={o.v} onClick={()=>setAiProvider(o.v)} style={{textAlign:"left",padding:14,borderRadius:"var(--radius)",cursor:"pointer",background:aiProvider===o.v?"var(--bg-sunken)":"var(--bg-elev)",border:`1.5px solid ${aiProvider===o.v?"var(--accent)":"var(--border)"}`}}>
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

function BackupPanel({avvisi,tutors,tutEvents,anagraficaAv}){
  const[backups,setBackups]=useState([]);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[msg,setMsg]=useState(null);
  function fmtSize(b){if(b<1024)return`${b} B`;if(b<1024*1024)return`${(b/1024).toFixed(1)} KB`;return`${(b/1024/1024).toFixed(2)} MB`;}
  async function load(){setLoading(true);setBackups(await fsListBackups());setLoading(false);}
  useEffect(()=>{load();},[]);
  async function doBackup(){setSaving(true);setMsg(null);try{await fsCreateBackup(avvisi,tutors,tutEvents,anagraficaAv);await fsApplyBackupPolicy(await fsListBackups());setMsg({ok:true,text:"Backup creato."});await load();}catch(e){setMsg({ok:false,text:e.message});}setSaving(false);}
  async function doRestore(b){if(!confirm(`Ripristinare il backup del ${fmtTs(b.created)}?`))return;try{const data=JSON.parse(b.data);window.__restoreBackup&&await window.__restoreBackup(data);setMsg({ok:true,text:"Ripristinato."});}catch(e){setMsg({ok:false,text:e.message});}}
  function doDownload(b){const blob=new Blob([b.data],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`backup_${b.created.toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);}
  async function doDelete(b){if(!confirm(`Eliminare il backup del ${fmtTs(b.created)}?`))return;await fsDeleteBackup(b.id);await load();}
  return(<div style={{maxWidth:880}}>
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:22}}>
      <div><h2 style={{fontSize:18,fontWeight:600,marginBottom:4,color:"var(--fg)"}}>Backup</h2><p style={{fontSize:13,color:"var(--fg-muted)"}}>Policy: 7 giornalieri · 4 settimanali · 12 mensili.</p></div>
      <div style={{display:"flex",gap:8}}>
        <label className="btn" data-variant="outline" style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Icon name="upload" size={14}/>Importa JSON<input type="file" accept=".json" style={{display:"none"}} onChange={e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=async ev=>{try{const raw=JSON.parse(ev.target.result);window.__restoreBackup&&await window.__restoreBackup(raw);setMsg({ok:true,text:"Importato."});}catch(err){setMsg({ok:false,text:err.message});}};reader.readAsText(file);e.target.value="";}}/></label>
        <button className="btn" data-variant="outline" onClick={()=>downloadJSON(avvisi,tutors,tutEvents,anagraficaAv)} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="download" size={14}/>Esporta JSON</button>
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

function LogPanel(){
  const[rows,setRows]=useState([]);const[loading,setLoading]=useState(true);const[filterUser,setFilterUser]=useState("");
  useEffect(()=>{fsLoadLog().then(r=>{setRows(r);setLoading(false);});},[]);
  const users=[...new Set(rows.map(r=>r.userEmail))].sort();
  const filtered=rows.filter(r=>!filterUser||r.userEmail===filterUser);
  return(<div style={{maxWidth:980}}>
    <h2 style={{fontSize:18,fontWeight:600,marginBottom:4,color:"var(--fg)"}}>Log attività</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Storico delle modifiche ai dati.</p>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <select className="select" value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={{width:240}}><option value="">— Tutti gli utenti —</option>{users.map(u=><option key={u} value={u}>{u}</option>)}</select>
      <span style={{fontSize:12,color:"var(--fg-subtle)",alignSelf:"center"}}>{filtered.length} record</span>
    </div>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",overflow:"hidden",boxShadow:"var(--shadow-xs)"}}>
      {loading?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="loader" size={14} color="var(--fg-subtle)"/>Caricamento...</p>
      :filtered.length===0?<p style={{padding:24,color:"var(--fg-subtle)",fontSize:13,fontStyle:"italic",textAlign:"center"}}>Nessuna attività registrata.</p>
      :<table className="data-table"><thead><tr><th>Data e ora</th><th>Utente</th><th>Tipo</th><th>Dettaglio</th></tr></thead><tbody>{filtered.map((r,i)=>(<tr key={r.id}><td style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,whiteSpace:"nowrap"}}>{fmtTs(r.ts)}</td><td style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--fg-muted)"}}>{r.userEmail}</td><td style={{whiteSpace:"nowrap"}}>{LOG_TYPE_LABELS[r.type]||r.type}</td><td style={{color:"var(--fg-muted)",lineHeight:1.4}}>{r.detail}</td></tr>))}</tbody></table>}
    </div>
  </div>);
}

function DemoPanel({isSuperAdmin}){
  async function loadDemo(){if(!confirm("Caricare i dati demo? I dati esistenti saranno sovrascritti."))return;window.__loadDemo&&await window.__loadDemo();alert("Dati demo caricati!");}
  async function clearDb(){if(!confirm("Eliminare TUTTI i dati?"))return;if(!confirm("Sei sicuro? Operazione irreversibile."))return;window.__clearDb&&await window.__clearDb();alert("Database svuotato.");}
  return(<div style={{maxWidth:720}}>
    <h2 style={{fontSize:18,fontWeight:600,marginBottom:4,color:"var(--fg)"}}>Dati demo</h2>
    <p style={{fontSize:13,color:"var(--fg-muted)",marginBottom:22}}>Carica dati di esempio o azzera tutto.</p>
    <div style={{background:"var(--bg-elev)",border:"1px solid var(--accent)",borderRadius:"var(--radius-md)",padding:22,marginBottom:14,boxShadow:"var(--shadow-xs)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <div style={{width:48,height:48,borderRadius:12,background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="dice" size={22} color="var(--accent)"/>
        </div>
        <div><h3 style={{fontSize:15,fontWeight:700,marginBottom:2,color:"var(--fg)"}}>Carica dati demo</h3><p style={{fontSize:12,color:"var(--fg-muted)"}}>4 tutor · 5 avvisi · ~280 slot distribuiti su 12 mesi</p></div>
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
