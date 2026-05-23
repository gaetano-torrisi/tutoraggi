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
    {PALETTE.map(c=>{const used=usedColors.includes(c)&&c!==value;return(<div key={c} onClick={()=>!used&&onChange(c)} title={used?"Già in uso":c} style={{width:22,height:22,borderRadius:4,background:c,cursor:used?"not-allowed":"pointer",border:value===c?"3px solid var(--fg)":"2px solid transparent",boxSizing:"border-box",opacity:used?.3:1}}/>);})}
  </div>);
}
