/* eslint-disable */
// ── RESIZABLE PANEL ───────────────────────────────────────────────────────
function ResizablePanel({children,defaultWidth=400,minWidth=320}){
  const[width,setWidth]=useState(defaultWidth);const dr=useRef(false);const max=Math.round(window.innerWidth*.70);
  function onMD(e){e.preventDefault();dr.current=true;const sx=e.clientX,sw=width;function mv(me){if(!dr.current)return;setWidth(Math.max(minWidth,Math.min(max,sw+(sx-me.clientX))));}function up(){dr.current=false;document.removeEventListener("mousemove",mv);document.removeEventListener("mouseup",up);}document.addEventListener("mousemove",mv);document.addEventListener("mouseup",up);}
  return(<div style={{width,background:"var(--bg-elev)",boxShadow:"var(--shadow-lg)",display:"flex",flexDirection:"row",flexShrink:0}}>
    <div onMouseDown={onMD} style={{width:14,cursor:"ew-resize",flexShrink:0,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <Icon name="grip" size={14} color="var(--border-strong)"/>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>{children}</div>
  </div>);
}

function PanelHeader({title,onBack,onClose}){
  return(<div className="panel-header">
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {onBack&&<button onClick={onBack} className="btn" data-variant="ghost" data-size="sm" style={{color:"#fff",borderColor:"rgba(255,255,255,.3)",display:"flex",alignItems:"center",gap:5}}><Icon name="arrowLeft" size={13} color="#fff"/>Indietro</button>}
      <span className="panel-header-title">{title}</span>
    </div>
    <button onClick={onClose} className="panel-close"><Icon name="x" size={16} color="#fff"/></button>
  </div>);
}

function FloatingModal({title,titleBg,width,children,footer,onClose}){
  const[pos,setPos]=useState({x:Math.max(0,window.innerWidth/2-(width||580)/2),y:Math.max(0,window.innerHeight/2-280)});
  const dr=useRef(false),off=useRef({x:0,y:0});
  function onHD(e){dr.current=true;off.current={x:e.clientX-pos.x,y:e.clientY-pos.y};function mv(me){if(!dr.current)return;setPos({x:Math.max(0,me.clientX-off.current.x),y:Math.max(0,me.clientY-off.current.y)});}function up(){dr.current=false;document.removeEventListener("mousemove",mv);document.removeEventListener("mouseup",up);}document.addEventListener("mousemove",mv);document.addEventListener("mouseup",up);}
  return(<div style={{position:"fixed",inset:0,zIndex:600,pointerEvents:"none"}}>
    <div className="floating-modal" style={{position:"absolute",left:pos.x,top:pos.y,width:width||580,maxWidth:"95vw",maxHeight:"78vh",pointerEvents:"all"}}>
      <div className="floating-modal-header" onMouseDown={onHD} style={{background:titleBg||"var(--brand-navy)"}}>
        <span style={{fontWeight:700,fontSize:15}}>{title}</span>
        <button onClick={onClose} className="panel-close"><Icon name="x" size={16} color="#fff"/></button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>{children}</div>
      {footer&&<div style={{padding:"10px 20px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>{footer}</div>}
    </div>
  </div>);
}

// ── UI HELPERS ────────────────────────────────────────────────────────────
function MiniCalendar({initialMonthIdx,selected,onSelect}){
  const[mIdx,setMIdx]=useState(initialMonthIdx);const md=MONTHS[mIdx];const{year,month,days}=md;
  const firstDow=new Date(year,month,1).getDay();const offset=firstDow===0?6:firstDow-1;
  const cells=[];for(let i=0;i<offset;i++)cells.push(null);for(let d=1;d<=days;d++)cells.push(d);while(cells.length%7!==0)cells.push(null);
  return(<div style={{background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:10,padding:10,boxShadow:"var(--shadow-md)",position:"absolute",zIndex:400,top:"100%",left:0,marginTop:4,width:240}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <button onClick={()=>setMIdx(i=>Math.max(0,i-1))} disabled={mIdx===0} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="chevLeft" size={14}/></button>
      <span style={{fontSize:12,fontWeight:700,color:"var(--fg)"}}>{md.label}</span>
      <button onClick={()=>setMIdx(i=>Math.min(MONTHS.length-1,i+1))} disabled={mIdx===MONTHS.length-1} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="chevRight" size={14}/></button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
      {["L","M","M","G","V","S","D"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"var(--fg-subtle)",padding:"2px 0"}}>{d}</div>)}
      {cells.map((d,i)=>{const isSel=d===selected&&mIdx===initialMonthIdx,dow=i%7,isWk=dow===5||dow===6;return(<div key={i} onClick={()=>d&&onSelect(d,mIdx)} style={{textAlign:"center",fontSize:12,padding:"4px 2px",borderRadius:6,cursor:d?"pointer":"default",background:isSel?"var(--accent)":"transparent",color:isSel?"#fff":isWk?"var(--fg-muted)":d?"var(--fg)":"transparent",fontWeight:isSel?700:400}} onMouseEnter={e=>{if(d&&!isSel)e.currentTarget.style.background="var(--bg-hover)";}} onMouseLeave={e=>{if(d&&!isSel)e.currentTarget.style.background="transparent";}}>{d||""}</div>);})}
    </div>
  </div>);
}

function DayPicker({initialMonthIdx,value,selectedMonthIdx,onChange}){
  const[open,setOpen]=useState(false);const mLabel=MONTHS[selectedMonthIdx??initialMonthIdx]?.label||"";
  return(<div style={{position:"relative",marginBottom:10}}>
    <label className="label">Giorno</label>
    <button type="button" onClick={()=>setOpen(o=>!o)} className="input" style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",height:"var(--row-h)"}}>
      <span>{value?`${value} ${mLabel}`:"Seleziona giorno"}</span>
      <Icon name="calendar" size={14} color="var(--fg-muted)"/>
    </button>
    {open&&<MiniCalendar initialMonthIdx={initialMonthIdx} selected={value} onSelect={(d,mIdx)=>{onChange(d,mIdx);setOpen(false);}}/>}
  </div>);
}

function TimePicker({label,value,onChange}){
  const[hh,mm]=value.split(":").map(Number);
  return(<div style={{flex:1}}>
    <label className="label">{label}</label>
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      <select value={hh} onChange={e=>onChange(`${String(+e.target.value).padStart(2,"0")}:${String(mm).padStart(2,"0")}`)} className="select" style={{flex:1}}>
        {Array.from({length:13},(_,i)=>i+8).map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
      </select>
      <span style={{color:"var(--fg-muted)",fontWeight:700}}>:</span>
      <select value={mm} onChange={e=>onChange(`${String(hh).padStart(2,"0")}:${String(+e.target.value).padStart(2,"0")}`)} className="select" style={{flex:1}}>
        {[0,15,30,45].map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
      </select>
    </div>
  </div>);
}

function MonthPicker({monthIdx,onChange,onClose}){
  const years=[...new Set(MONTHS.map(m=>m.year))];
  const[selYear,setSelYear]=useState(MONTHS[monthIdx].year);
  const filtered=MONTHS.filter(m=>m.year===selYear);
  return(<div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:14,boxShadow:"var(--shadow-lg)",zIndex:700,minWidth:280}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <span style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>Seleziona mese</span>
      <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="x" size={14}/></button>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:12,justifyContent:"center"}}>
      {years.map(y=><button key={y} onClick={()=>setSelYear(y)} className="btn" data-variant={selYear===y?"primary":"outline"} data-size="sm">{y}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
      {filtered.map(m=>{const idx=MONTHS.indexOf(m);const isSel=idx===monthIdx;return(<button key={m.key} onClick={()=>{onChange(idx);onClose();}} style={{padding:"8px 4px",borderRadius:8,border:`1px solid ${isSel?"var(--accent)":"var(--border)"}`,background:isSel?"var(--accent)":"var(--bg-elev)",color:isSel?"#fff":"var(--fg)",fontSize:12,fontWeight:600,cursor:"pointer"}}>{MONTH_NAMES_SHORT[m.month]}</button>);})}
    </div>
  </div>);
}

function ColorPicker({value,onChange,usedColors=[]}){
  return(<div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4,marginBottom:10}}>
    {PALETTE.map(c=>{const used=usedColors.includes(c)&&c!==value;return(<div key={c} onClick={()=>!used&&onChange(c)} title={used?"Già in uso":c} style={{position:"relative",width:22,height:22,borderRadius:4,background:c,cursor:used?"not-allowed":"pointer",border:value===c?"3px solid var(--fg)":"2px solid transparent",boxSizing:"border-box",overflow:"hidden",flexShrink:0}}>{used&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 22 22"><line x1="3" y1="3" x2="19" y2="19" stroke="rgba(0,0,0,0.55)" strokeWidth="2.5"/><line x1="3" y1="3" x2="19" y2="19" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5"/></svg>}</div>);})}
  </div>);
}

// ── MONTH RANGE PICKER ────────────────────────────────────────────────────
function MonthRangePicker({value,onChange,months=[]}){
  const[open,setOpen]=useState(false);const[rangeMode,setRangeMode]=useState(false);const[rangeStart,setRangeStart]=useState(null);
  const ref=useRef();
  const years=[...new Set(MONTHS.map(m=>m.year))];
  const initYear=value?.year||MONTHS[value?.month!=null?MONTHS.findIndex(m=>m.key===value?.monthKey):2]?.year||MONTHS[2].year;
  const[selYear,setSelYear]=useState(initYear);
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const hasData=mk=>months.includes(mk);
  function periodLabel(){if(!value)return"Seleziona periodo";if(value.mode==="year")return`Anno ${value.year}`;if(value.mode==="range"){const s=MONTHS.find(m=>m.key===value.startKey);const e=MONTHS.find(m=>m.key===value.endKey);return s&&e?`${MONTH_NAMES_SHORT[s.month]} → ${MONTH_NAMES_SHORT[e.month]} ${e.year}`:"Range";}const m=MONTHS.find(x=>x.key===value.monthKey);return m?m.label:"Seleziona";}
  function handleMonthClick(mk){if(!hasData(mk))return;if(rangeMode){if(!rangeStart){setRangeStart(mk);}else{const si=MONTHS.findIndex(m=>m.key===rangeStart),ei=MONTHS.findIndex(m=>m.key===mk);const[s,e]=si<=ei?[rangeStart,mk]:[mk,rangeStart];onChange({mode:"range",startKey:s,endKey:e});setRangeStart(null);setOpen(false);}}else{onChange({mode:"single",monthKey:mk,year:MONTHS.find(m=>m.key===mk)?.year});setOpen(false);}}
  function isInRange(mk){if(!rangeMode||!rangeStart)return false;const si=MONTHS.findIndex(m=>m.key===rangeStart),ci=MONTHS.findIndex(m=>m.key===mk);if(si<0||ci<0)return false;const[lo,hi]=si<=ci?[si,ci]:[ci,si];return MONTHS.findIndex(m=>m.key===mk)>=lo&&MONTHS.findIndex(m=>m.key===mk)<=hi;}
  const filtered=MONTHS.filter(m=>m.year===selYear);
  return(<div ref={ref} style={{position:"relative",display:"inline-block"}}>
    <button onClick={()=>setOpen(o=>!o)} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6,minWidth:180}}>
      <Icon name="calendar" size={13} color="var(--accent)"/><span style={{flex:1,textAlign:"left",fontSize:12}}>{periodLabel()}</span><Icon name="chevDown" size={12} color="var(--fg-subtle)"/>
    </button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"var(--bg-elev)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:14,boxShadow:"var(--shadow-lg)",zIndex:400,width:260}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={()=>setSelYear(y=>Math.max(years[0],y-1))} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="chevLeft" size={14}/></button>
        <span style={{fontWeight:700,fontSize:13,color:"var(--fg)"}}>{selYear}</span>
        <button onClick={()=>setSelYear(y=>Math.min(years[years.length-1],y+1))} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="chevRight" size={14}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:10}}>
        {filtered.map(m=>{const has=hasData(m.key);const isSel=value?.monthKey===m.key||(value?.startKey===m.key||value?.endKey===m.key);const inRng=isInRange(m.key);return(<div key={m.key} onClick={()=>handleMonthClick(m.key)} style={{padding:"7px 4px",borderRadius:6,textAlign:"center",cursor:has?"pointer":"not-allowed",opacity:has?1:.35,background:isSel?"var(--accent)":inRng?"var(--accent-soft)":"transparent",color:isSel?"#fff":"var(--fg)",fontSize:12,fontWeight:600,position:"relative",border:isSel?"1px solid var(--accent)":"1px solid transparent"}}>
          {MONTH_NAMES_SHORT[m.month]}
          {has&&!isSel&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:999,background:"var(--accent)"}}/>}
        </div>);})}
      </div>
      <div style={{display:"flex",gap:6,borderTop:"1px solid var(--divider)",paddingTop:10}}>
        <button onClick={()=>{onChange({mode:"year",year:selYear});setOpen(false);}} className="btn" data-variant="ghost" data-size="sm" style={{flex:1,justifyContent:"center"}}>Anno intero</button>
        <button onClick={()=>{setRangeMode(r=>!r);setRangeStart(null);}} className="btn" data-variant={rangeMode?"accent":"outline"} data-size="sm" style={{flex:1,justifyContent:"center"}}>{rangeMode?"Annulla":"Seleziona range"}</button>
      </div>
      {rangeMode&&rangeStart&&<div style={{marginTop:8,fontSize:11,color:"var(--fg-subtle)",textAlign:"center"}}>Da: {MONTHS.find(m=>m.key===rangeStart)?.label} — seleziona il mese finale</div>}
    </div>}
  </div>);
}

// ── INLINE CREATE TUTOR ───────────────────────────────────────────────────
function InlineCreateTutor({tutors,onSaveTutor,onCreated,onCancel,onAddMessage}){
  const[form,setForm]=useState({nome:"",cognome:"",cf:"",azienda:"",color:PALETTE[0]});
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");
  const presetColors=PALETTE.slice(0,8);
  async function handleCreate(){
    if(!form.nome||!form.cognome){setErr("Nome e Cognome sono obbligatori.");return;}
    setSaving(true);setErr("");
    const newTutor={...form,id:`tutor-${Date.now()}`};
    const newList=[...tutors,newTutor];
    await onSaveTutor(newList,"add",newTutor);
    onAddMessage&&onAddMessage(`Tutor ${newTutor.cognome} ${newTutor.nome} creato e selezionato.`);
    onCreated(newTutor);
    setSaving(false);
  }
  return(
    <div style={{marginTop:6,padding:"10px 12px",border:"1px solid var(--border)",borderRadius:"var(--radius)",background:"var(--bg-sunken)"}}>
      <div style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Nuovo tutor</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
        <div><label className="label" style={{fontSize:10}}>Nome *</label><input className="input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} style={{height:28,fontSize:12}}/></div>
        <div><label className="label" style={{fontSize:10}}>Cognome *</label><input className="input" value={form.cognome} onChange={e=>setForm(f=>({...f,cognome:e.target.value}))} style={{height:28,fontSize:12}}/></div>
      </div>
      <div style={{marginBottom:6}}><label className="label" style={{fontSize:10}}>CF</label><input className="input mono" value={form.cf} onChange={e=>setForm(f=>({...f,cf:e.target.value.toUpperCase()}))} maxLength={16} style={{height:28,fontSize:12}}/></div>
      <div style={{marginBottom:8}}><label className="label" style={{fontSize:10}}>Azienda</label><input className="input" value={form.azienda} onChange={e=>setForm(f=>({...f,azienda:e.target.value}))} style={{height:28,fontSize:12}}/></div>
      <div style={{marginBottom:8}}>
        <label className="label" style={{fontSize:10}}>Colore</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{presetColors.map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:20,height:20,borderRadius:4,background:c,cursor:"pointer",border:form.color===c?"3px solid var(--fg)":"2px solid transparent",boxSizing:"border-box"}}/>)}</div>
      </div>
      {err&&<div style={{fontSize:11,color:"var(--danger)",marginBottom:6}}>{err}</div>}
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={onCancel} className="btn" data-variant="ghost" data-size="sm">Annulla</button>
        <button onClick={handleCreate} disabled={saving} className="btn" data-variant="accent" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}>
          {saving?<><Icon name="loader" size={11} color="#fff"/>Creazione...</>:<><Icon name="check" size={11} color="#fff"/>Crea e seleziona</>}
        </button>
      </div>
    </div>
  );
}

// ── INLINE CREATE CORSO ──────────────────────────────────────────────────
function InlineCreateCorso({anagraficaCorsi,onSaveAnaCorso,onCreated,onCancel,onAddMessage}){
  const[form,setForm]=useState({nome:"",codice:"",durataOre:"",stato:"In corso",colore:PALETTE[1]});
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");
  const presetColors=PALETTE.slice(0,8);
  async function handleCreate(){
    if(!form.nome){setErr("Nome è obbligatorio.");return;}
    if(!form.durataOre||isNaN(Number(form.durataOre))||Number(form.durataOre)<=0){setErr("Durata ore è obbligatoria.");return;}
    setSaving(true);setErr("");
    const newAv={...form,id:`av-${Date.now()}`,durataOre:Number(form.durataOre),dataInizio:"",dataFine:"",note:""};
    const newList=[...anagraficaCorsi,newAv];
    await onSaveAnaCorso(newList,"add",newAv);
    onAddMessage&&onAddMessage(`Corso "${newAv.nome}" creato e selezionato.`);
    onCreated(newAv);
    setSaving(false);
  }
  return(
    <div style={{marginTop:6,padding:"10px 12px",border:"1px solid var(--border)",borderRadius:"var(--radius)",background:"var(--bg-sunken)"}}>
      <div style={{fontSize:10,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Nuovo corso</div>
      <div style={{marginBottom:6}}><label className="label" style={{fontSize:10}}>Nome *</label><input className="input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} style={{height:28,fontSize:12}}/></div>
      <div style={{marginBottom:6}}><label className="label" style={{fontSize:10}}>Codice</label><input className="input mono" value={form.codice} onChange={e=>setForm(f=>({...f,codice:e.target.value}))} style={{height:28,fontSize:12}}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        <div><label className="label" style={{fontSize:10}}>Durata ore *</label><input className="input mono" type="number" min="1" value={form.durataOre} onChange={e=>setForm(f=>({...f,durataOre:e.target.value}))} style={{height:28,fontSize:12}}/></div>
        <div><label className="label" style={{fontSize:10}}>Stato</label><select className="select" value={form.stato} onChange={e=>setForm(f=>({...f,stato:e.target.value}))} style={{height:28,fontSize:12}}>{AV_STATI.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div style={{marginBottom:8}}>
        <label className="label" style={{fontSize:10}}>Colore</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{presetColors.map(c=><div key={c} onClick={()=>setForm(f=>({...f,colore:c}))} style={{width:20,height:20,borderRadius:4,background:c,cursor:"pointer",border:form.colore===c?"3px solid var(--fg)":"2px solid transparent",boxSizing:"border-box"}}/>)}</div>
      </div>
      {err&&<div style={{fontSize:11,color:"var(--danger)",marginBottom:6}}>{err}</div>}
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button onClick={onCancel} className="btn" data-variant="ghost" data-size="sm">Annulla</button>
        <button onClick={handleCreate} disabled={saving} className="btn" data-variant="accent" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}>
          {saving?<><Icon name="loader" size={11} color="#fff"/>Creazione...</>:<><Icon name="check" size={11} color="#fff"/>Crea e seleziona</>}
        </button>
      </div>
    </div>
  );
}
