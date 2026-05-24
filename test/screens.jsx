/* eslint-disable */
// ── VERIFICA ──────────────────────────────────────────────────────────────
function runVerifica(avvisi,anagraficaAv,tutors,tutEvents){
  const errors=[],avById={},avByName={};
  avvisi.forEach(av=>avById[av.id]=av);anagraficaAv.forEach(a=>{if(avById[a.id])avByName[a.nome]=avById[a.id];});
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){for(const ev of evs){if(!avByName[ev.name]){const t=tutors.find(x=>x.id===tid);errors.push({type:"orfano",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" non in anagrafica.`});}}}}
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){for(const ev of evs){const av=avByName[ev.name];if(!av)continue;const avDay=av.events.find(e=>e.month===mk&&e.day===ev.day);const t=tutors.find(x=>x.id===tid);if(!avDay)errors.push({type:"fuori_giorno",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot "${ev.name}" il ${ev.day} ${mk} non corrisponde ad alcuna sessione.`});else if(ev.start<avDay.start||ev.end>avDay.end)errors.push({type:"fuori_orario",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": slot il ${ev.day} ${mk} fuori orario.`});}}}
  for(const[tid,months]of Object.entries(tutEvents)){for(const[mk,evs]of Object.entries(months)){const t=tutors.find(x=>x.id===tid);for(let i=0;i<evs.length;i++)for(let j=i+1;j<evs.length;j++){const a=evs[i],b=evs[j];if(a.day===b.day&&a.start<b.end&&b.start<a.end)errors.push({type:"sovrapposizione",monthKey:mk,msg:`Tutor "${t?.cognome} ${t?.nome}": sovrapposizione il ${a.day} ${mk} tra "${a.name}" e "${b.name}".`});}}}
  for(const ana of anagraficaAv){const av=avById[ana.id];const totAv=av?av.events.reduce((s,e)=>s+(e.ore||0),0):0;let totTut=0;for(const[,ms]of Object.entries(tutEvents))for(const[,evs]of Object.entries(ms))for(const ev of evs)if(ev.name===ana.nome)totTut+=(ev.ore||0);if(totTut>totAv)errors.push({type:"eccedenza",monthKey:null,msg:`Avviso "${ana.nome}": ore tutoraggio (${totTut}h) superano ore avviso (${totAv}h).`});if(ana.durataOre&&totAv!==ana.durataOre)errors.push({type:"durata",monthKey:null,msg:`Avviso "${ana.nome}": ore nel calendario (${totAv}h) ≠ durata da bando (${ana.durataOre}h).`});}
  return errors;
}

function VerificaScreen({errors,onNavigate}){
  const icons={orfano:"user",fuori_giorno:"calendar",fuori_orario:"clock",sovrapposizione:"zap",eccedenza:"trending",durata:"clipboard"};
  const labels={orfano:"Avviso inesistente",fuori_giorno:"Fuori giorno",fuori_orario:"Fuori orario",sovrapposizione:"Sovrapposizione",eccedenza:"Ore eccedenti",durata:"Durata non corrispondente"};
  const tones={orfano:"danger",fuori_giorno:"warning",fuori_orario:"warning",sovrapposizione:"danger",eccedenza:"warning",durata:"info"};
  const ok=errors.length===0;
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header">
      <div><div className="page-breadcrumb">Strumenti · Audit</div><h1 className="page-title">Verifica coerenza</h1><p className="page-desc">Controllo automatico di sovrapposizioni, ore eccedenti e slot fuori orario.</p></div>
    </div>
    <div style={{flex:1,overflow:"auto",padding:32,background:"var(--bg)"}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{padding:"20px 22px",borderRadius:14,background:ok?"var(--success-soft)":"var(--bg-elev)",border:`1px solid ${ok?"transparent":"var(--border)"}`,display:"flex",alignItems:"center",gap:20,marginBottom:22}}>
          <div style={{width:56,height:56,borderRadius:14,background:ok?"var(--success)":"var(--danger)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name={ok?"checkCircle":"alert"} size={26} color="#fff"/>
          </div>
          <div style={{flex:1}}><h2 style={{fontSize:20,fontWeight:700,marginBottom:4,color:"var(--fg)"}}>{ok?"Tutto in regola.":`${errors.length} problem${errors.length===1?"a":"i"} trovat${errors.length===1?"o":"i"}`}</h2><p style={{fontSize:13,color:"var(--fg-muted)"}}>{ok?"Nessuna anomalia rilevata.":"Esamina i problemi qui sotto e naviga al mese corrispondente."}</p></div>
        </div>
        {errors.length===0?<p style={{color:"var(--success)",fontWeight:600,textAlign:"center",marginTop:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="checkCircle" size={16} color="var(--success)"/>Tutti i dati sono coerenti.</p>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>{errors.map((e,i)=>(<div key={i} onClick={()=>e.monthKey&&onNavigate(e.monthKey)} style={{padding:"12px 16px",borderRadius:"var(--radius-md)",border:"1px solid var(--border)",background:"var(--bg-elev)",display:"flex",gap:12,alignItems:"flex-start",cursor:e.monthKey?"pointer":"default"}} onMouseEnter={ev=>{if(e.monthKey)ev.currentTarget.style.background="var(--bg-hover)";}} onMouseLeave={ev=>ev.currentTarget.style.background="var(--bg-elev)"}>
          <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:`var(--${tones[e.type]||"warning"}-soft)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name={icons[e.type]||"alert"} size={18} color={`var(--${tones[e.type]||"warning"})`}/>
          </div>
          <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span className="badge" data-tone={tones[e.type]||"warning"}>{labels[e.type]||e.type}</span>{e.monthKey&&<span style={{fontSize:10,color:"var(--info)",fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Icon name="calendar" size={11} color="var(--info)"/>Vai al mese</span>}</div><div style={{fontSize:13,color:"var(--fg)",lineHeight:1.5}}>{e.msg}</div></div>
        </div>))}</div>}
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
function InsightsScreen({avvisi,anagraficaAv,tutors,tutEvents,currentMonthKey}){
  const[viewMode,setViewMode]=useState("tutor");const[timeMode,setTimeMode]=useState("mese");
  const avById={};avvisi.forEach(av=>avById[av.id]=av);
  function getTutOreAnnoPerAv(tId,avName){let t=0;const td=tutEvents[tId]||{};for(const[,evs]of Object.entries(td))for(const ev of evs)if(ev.name===avName)t+=(ev.ore||0);return t;}
  function getOreFiltered(tId,avName){let t=0;const ana=anagraficaAv.find(a=>a.nome===avName);if(!ana)return 0;const av=avById[ana.id];if(!av)return 0;const td=tutEvents[tId]||{};for(const[mk,tevs]of Object.entries(td)){if(timeMode==="mese"&&mk!==currentMonthKey)continue;for(const tev of tevs){if(tev.name!==avName)continue;for(const ae of av.events.filter(e=>e.month===mk&&e.day===tev.day)){const s=Math.max(tev.start,ae.start),en=Math.min(tev.end,ae.end);if(en>s)t+=en-s;}}}return t;}
  function getAvOre(anaId){const av=avById[anaId];if(!av)return 0;if(timeMode==="mese")return av.events.filter(e=>e.month===currentMonthKey).reduce((s,e)=>s+e.ore,0);return av.events.reduce((s,e)=>s+e.ore,0);}
  function getTotOre(tId){let t=0;const td=tutEvents[tId]||{};for(const[mk,evs]of Object.entries(td)){if(timeMode==="mese"&&mk!==currentMonthKey)continue;for(const ev of evs)t+=ev.ore||0;}return t;}
  function getAvNamesForTut(tId){const n=new Set();const td=tutEvents[tId]||{};for(const[mk,evs]of Object.entries(td)){if(timeMode==="mese"&&mk!==currentMonthKey)continue;for(const ev of evs)n.add(ev.name);}return[...n].sort();}
  function getTutsForAv(avName){return[...tutors].filter(t=>{const td=tutEvents[t.id]||{};for(const[mk,evs]of Object.entries(td)){if(timeMode==="mese"&&mk!==currentMonthKey)continue;if(evs.some(e=>e.name===avName))return true;}return false;}).sort((a,b)=>a.cognome.localeCompare(b.cognome));}
  const pctBadge=(oreAnno,durataOre)=>{if(!durataOre)return null;const p=oreAnno/durataOre*100;return(<span className="badge" data-tone={p>100?"danger":p>=80?"success":"info"}>{Math.round(p)}%</span>);};
  const sortedTutors=[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome));
  const sortedAna=[...anagraficaAv].sort((a,b)=>a.nome.localeCompare(b.nome));
  return(<div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
    <div className="page-header"><div><div className="page-breadcrumb">Strumenti · Insights</div><h1 className="page-title">Riepiloghi e KPI</h1><p className="page-desc">Quante ore sono state erogate, da chi, su quale avviso.</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div className="tab-strip"><button className={`tab-strip-btn${timeMode==="mese"?" active":""}`} onClick={()=>setTimeMode("mese")}>Mese</button><button className={`tab-strip-btn${timeMode==="anno"?" active":""}`} onClick={()=>setTimeMode("anno")}>Anno</button></div>
      </div>
    </div>
    <div style={{padding:"10px 32px",borderBottom:"1px solid var(--border)",background:"var(--bg-elev)",display:"flex",gap:8}}>
      <div className="tab-strip">
        <button className={`tab-strip-btn${viewMode==="tutor"?" active":""}`} onClick={()=>setViewMode("tutor")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="user" size={12}/>Per tutor</button>
        <button className={`tab-strip-btn${viewMode==="avviso"?" active":""}`} onClick={()=>setViewMode("avviso")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="clipboard" size={12}/>Per avviso</button>
      </div>
    </div>
    <div style={{flex:1,overflow:"auto",padding:32,background:"var(--bg)"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        {viewMode==="tutor"&&sortedTutors.map(t=>{const tot=getTotOre(t.id),avNames=getAvNamesForTut(t.id);if(tot===0&&avNames.length===0)return null;return(<div key={t.id} style={{marginBottom:14,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)",boxShadow:"var(--shadow-xs)"}}>
          <div style={{background:hexToRgba(t.color||"#4f86c6",.1),padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:999,background:t.color||"var(--accent)",color:"#fff",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>{(t.cognome[0]||"")+(t.nome[0]||"")}</div><span style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{t.cognome} {t.nome}</span></div>
            <span style={{fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace'}}>{fo(tot)}</span>
          </div>
          <div style={{padding:"8px 14px"}}>{avNames.map(nm=>{const ana=anagraficaAv.find(a=>a.nome===nm);const ore=getOreFiltered(t.id,nm);const oreA=getTutOreAnnoPerAv(t.id,nm);return(<div key={nm} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid var(--divider)",fontSize:12}}><span style={{color:"var(--fg-muted)"}}>{nm}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontWeight:600,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace'}}>{fo(ore)}</span>{pctBadge(oreA,ana?.durataOre)}</div></div>);})}</div>
        </div>);})}
        {viewMode==="avviso"&&sortedAna.map(ana=>{const avTot=getAvOre(ana.id);const tuts=getTutsForAv(ana.nome);return(<div key={ana.id} style={{marginBottom:14,borderRadius:"var(--radius-md)",border:"1px solid var(--border)",overflow:"hidden",background:"var(--bg-elev)",boxShadow:"var(--shadow-xs)"}}>
          <div style={{background:hexToRgba(ana.colore||"#4f86c6",.1),padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><div style={{width:10,height:10,borderRadius:3,background:ana.colore||"var(--accent)"}}/><span style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{ana.nome}</span>{ana.durataOre&&<span style={{fontSize:11,color:"var(--fg-subtle)"}}>{ana.durataOre}h da bando</span>}</div>
            <span style={{fontWeight:700,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace'}}>{fo(avTot)}</span>
          </div>
          <div style={{padding:"8px 14px"}}>{tuts.length===0?<span style={{fontSize:11,color:"var(--fg-subtle)",fontStyle:"italic"}}>Nessun tutor assegnato</span>:tuts.map(t=>{const ore=getOreFiltered(t.id,ana.nome);const oreA=getTutOreAnnoPerAv(t.id,ana.nome);return(<div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid var(--divider)",fontSize:12}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:999,background:t.color||"var(--accent)"}}/><span style={{color:"var(--fg-muted)"}}>{t.cognome} {t.nome}</span></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontWeight:600,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace'}}>{fo(ore)}</span>{pctBadge(oreA,ana.durataOre)}</div></div>);})}</div>
        </div>);})}
      </div>
    </div>
  </div>);
}

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
