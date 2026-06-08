/* eslint-disable */
// ── DRAG HOOK ─────────────────────────────────────────────────────────────
function useDrag({onDragEnd,onClick,onDragMove}){
  const dragRef=useRef(null),resizeRef=useRef(null),dragging=useRef(false),t0=useRef(0),p0=useRef({x:0,y:0});
  function makeBody(ev,slotH,colW){return function onDown(e){if(resizeRef.current&&e.target===resizeRef.current)return;e.stopPropagation();t0.current=Date.now();p0.current={x:e.clientX,y:e.clientY};dragging.current=false;const os=ev.start,oe=ev.end,od=ev.day;function onMove(me){const dx=Math.abs(me.clientX-p0.current.x),dy=Math.abs(me.clientY-p0.current.y),dt=Date.now()-t0.current;if(!dragging.current&&(dx>DRAG_PX||dy>DRAG_PX||dt>DRAG_MS))dragging.current=true;if(!dragging.current)return;const ns=Math.max(8,Math.min(19.75,snapH(os+(me.clientY-p0.current.y)/slotH)));const dd=Math.round((me.clientX-p0.current.x)/colW);onDragMove&&onDragMove(dd);if(dragRef.current){dragRef.current.style.top=`${(ns-8)*slotH}px`;dragRef.current.style.transform=`translateX(${dd*colW}px)`;}}function onUp(me){document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);onDragMove&&onDragMove(0);const dx=Math.abs(me.clientX-p0.current.x),dy=Math.abs(me.clientY-p0.current.y),dt=Date.now()-t0.current;if(dt<DRAG_MS&&dx<=DRAG_PX&&dy<=DRAG_PX){if(dragRef.current)dragRef.current.style.transform="";onClick&&onClick();return;}markDrag();const ns=Math.max(8,Math.min(19.75,snapH(os+(me.clientY-p0.current.y)/slotH)));const ne=Math.min(20,ns+(oe-os));const nd=Math.max(1,od+Math.round((me.clientX-p0.current.x)/colW));if(dragRef.current)dragRef.current.style.transform="";if(ns!==os||ne!==oe||nd!==od)onDragEnd({start:ns,end:ne,day:nd});}document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);};}
  function makeResize(ev,slotH){return function onDown(e){e.stopPropagation();e.preventDefault();const sy=e.clientY,oe=ev.end,os=ev.start;function onMove(me){const ne=Math.max(os+.25,Math.min(20,snapH(oe+(me.clientY-sy)/slotH)));if(dragRef.current)dragRef.current.style.height=`${Math.max((ne-os)*slotH,20)}px`;}function onUp(me){document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);markDrag();const ne=Math.max(os+.25,Math.min(20,snapH(oe+(me.clientY-sy)/slotH)));if(ne!==oe)onDragEnd({end:ne,ore:ne-os});}document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);};}
  return{dragRef,resizeRef,makeBody,makeResize};
}

// ── SLOTS ─────────────────────────────────────────────────────────────────
function VerifiedBadge({by,at}){
  const tip=by?`Verificato da ${by}${at?" — "+fmtTs(new Date(at)):""}`:""
  return(
    <span title={tip} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:"999px",background:"#fff",boxShadow:"0 1px 2px rgba(0,0,0,.25)",flexShrink:0}}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    </span>
  );
}

function DraggableSlot({ev,col,numCols,color,tutorLabel,slotH,colW,onEdit,onClick,onDragEnd,posOverride,highlightError,onDragMove}){
  const{dragRef,resizeRef,makeBody,makeResize}=useDrag({onDragEnd:u=>onDragEnd&&onDragEnd({...ev,...u}),onClick,onDragMove:dd=>onDragMove&&onDragMove(ev,dd)});
  const ore=ev.end-ev.start;
  const dTop=(ev.start-8)*slotH,dH=Math.max((ev.end-ev.start)*slotH,20);
  const style=posOverride?{position:"absolute",...posOverride,borderRadius:"var(--radius-sm)",overflow:"visible",boxSizing:"border-box",zIndex:5,background:color,userSelect:"none",boxShadow:"var(--shadow-sm)"}:{position:"absolute",top:dTop,left:`calc(${(col/numCols)*100}% + 2px)`,width:`calc(${100/numCols}% - 4px)`,height:dH,borderRadius:"var(--radius-sm)",overflow:"visible",boxSizing:"border-box",zIndex:3,background:color,userSelect:"none",boxShadow:"var(--shadow-sm)"};
  return(<div ref={dragRef} id={`slot-${ev.id}`} data-ev-id={ev.id} className={highlightError?"highlight-error":""} style={style} title={`${ev.name}\n${fmt(ev.start)}–${fmt(ev.end)}${tutorLabel?"\n"+tutorLabel:""}`}>
    <div onClick={e=>{e.stopPropagation();onEdit&&onEdit();}} style={{padding:"2px 5px",cursor:onEdit?"pointer":"default",fontSize:10,fontWeight:700,color:"#fff",background:"rgba(0,0,0,.14)",borderBottom:"1px solid rgba(255,255,255,.15)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderRadius:"var(--radius-sm) var(--radius-sm) 0 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
      <span style={{overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:4}}>
        {onEdit&&<Icon name="edit" size={10} color="rgba(255,255,255,.8)"/>}
        {ev.name}
      </span>
      <span style={{display:"inline-flex",alignItems:"center",gap:3,flexShrink:0}}>
        {ev.verified&&<VerifiedBadge by={ev.verifiedBy} at={ev.verifiedAt}/>}
        <span style={{fontSize:9.5,fontWeight:700,background:"rgba(0,0,0,.28)",padding:"0 5px",borderRadius:999,lineHeight:"14px"}}>{fmtDurata(ore)}</span>
      </span>
    </div>
    <div onMouseDown={onDragEnd?makeBody(ev,slotH,colW):null} style={{padding:"1px 5px",fontSize:10,fontWeight:400,color:"rgba(255,255,255,.9)",cursor:onDragEnd?"grab":"default",fontFamily:"inherit"}}>{fmt(ev.start)}–{fmt(ev.end)}{tutorLabel?` · ${tutorLabel}`:""}</div>
    {onDragEnd&&<div ref={resizeRef} onMouseDown={makeResize(ev,slotH)} style={{position:"absolute",bottom:0,left:0,right:0,height:8,cursor:"ns-resize",background:"rgba(0,0,0,.18)",borderRadius:"0 0 var(--radius-sm) var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:20,height:2,background:"rgba(255,255,255,.6)",borderRadius:1}}/></div>}
  </div>);
}

function AvOverlaySlot({ev,col,numCols,color,slotH}){
  const top=(ev.start-8)*slotH,h=Math.max((ev.end-ev.start)*slotH,20);
  return(<div style={{position:"absolute",top,left:`calc(${(col/numCols)*100}% + 1px)`,width:`calc(${100/numCols}% - 3px)`,height:h,borderRadius:"var(--radius-sm)",boxSizing:"border-box",zIndex:20,background:hexToRgba(color,.07),border:`2px solid ${color}`,pointerEvents:"none"}}>
    <div style={{position:"absolute",top:-15,left:-1,fontSize:9,fontWeight:700,color,background:"var(--bg-elev)",padding:"1px 6px",borderRadius:"3px 3px 0 0",border:`1px solid ${color}`,borderBottom:"none",whiteSpace:"nowrap",overflow:"hidden",maxWidth:"100%",textOverflow:"ellipsis",lineHeight:"14px",zIndex:21,pointerEvents:"none",display:"flex",alignItems:"center",gap:3}}>
      {ev.verified&&<VerifiedBadge by={ev.verifiedBy} at={ev.verifiedAt}/>}
      {(ev.corsoName||"").substring(0,26)}
    </div>
  </div>);
}

function AvDraggableSlot({ev,col,numCols,color,slotH,colW,onEdit,onDragEnd,highlightError}){
  const top=(ev.start-8)*slotH,h=Math.max((ev.end-ev.start)*slotH,20);
  const ore=ev.end-ev.start;
  const{dragRef,resizeRef,makeBody,makeResize}=useDrag({onDragEnd:u=>onDragEnd&&onDragEnd({...ev,...u})});
  return(<div ref={dragRef} id={`slot-${ev.id}`} data-ev-id={ev.id} className={highlightError?"highlight-error":""} title={`${ev.corsoName}\n${fmt(ev.start)}–${fmt(ev.end)}`} style={{position:"absolute",top,left:`calc(${(col/numCols)*100}% + 1px)`,width:`calc(${100/numCols}% - 3px)`,height:h,borderRadius:"var(--radius-sm)",overflow:"hidden",boxSizing:"border-box",zIndex:2,background:hexToRgba(color,.35),border:`1.5px dashed ${color}`,userSelect:"none"}}>
    <div onClick={e=>{e.stopPropagation();onEdit&&onEdit();}} style={{padding:"2px 5px",cursor:onEdit?"pointer":"default",fontSize:10,fontWeight:700,color:"var(--fg)",background:"rgba(0,0,0,.07)",borderBottom:"1px dashed rgba(0,0,0,.12)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
      <span style={{overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:4}}>
        {onEdit&&<Icon name="edit" size={10} color="var(--fg-muted)"/>}
        {ev.corsoName}
      </span>
      <span style={{display:"inline-flex",alignItems:"center",gap:3,flexShrink:0}}>
        {ev.verified&&<VerifiedBadge by={ev.verifiedBy} at={ev.verifiedAt}/>}
        <span style={{fontSize:9.5,fontWeight:700,background:"rgba(0,0,0,.15)",color:"var(--fg)",padding:"0 5px",borderRadius:999,lineHeight:"14px"}}>{fmtDurata(ore)}</span>
      </span>
    </div>
    <div onMouseDown={onDragEnd?makeBody(ev,slotH,colW):null} style={{padding:"1px 5px",fontSize:10,fontWeight:400,color:"var(--fg-muted)",cursor:onDragEnd?"grab":"default",fontFamily:"inherit"}}>{fmt(ev.start)}–{fmt(ev.end)}</div>
    {onDragEnd&&<div ref={resizeRef} onMouseDown={makeResize(ev,slotH)} style={{position:"absolute",bottom:0,left:0,right:0,height:8,cursor:"ns-resize",background:"rgba(0,0,0,.08)",borderRadius:"0 0 var(--radius-sm) var(--radius-sm)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:20,height:2,background:"rgba(0,0,0,.25)",borderRadius:1}}/></div>}
  </div>);
}

// ── CALENDAR GRID ─────────────────────────────────────────────────────────
function CalendarGrid({days,monthData,tutByDay,avOverlayByDay,avByDay,footerByDay,overlayActive,slotH,colW,onGridClick,onTutDragEnd,onAvDragEnd,highlightEvId,onTutDragMove}){
  const HOURS=Array.from({length:13},(_,i)=>i+8);
  const isWE=d=>[0,6].includes(new Date(monthData.year,monthData.month,d).getDay());
  const getDN=d=>DAY_NAMES[new Date(monthData.year,monthData.month,d).getDay()];
  return(<div style={{overflow:"auto",background:"var(--bg)",flex:1,minHeight:0}} className="cal-scroll">
    <div style={{display:"flex",minWidth:TIME_W+days.length*colW,background:"var(--bg)"}}>
      <div style={{width:TIME_W,flexShrink:0,position:"sticky",left:0,zIndex:30,background:"var(--bg)"}}>
        <div style={{height:60,borderBottom:"1px solid var(--border)",background:"var(--bg-sunken)"}}/>
        <div style={{position:"relative",height:12*slotH}}>{HOURS.map(h=><div key={h} className="cal-time-col" style={{position:"absolute",top:(h-8)*slotH,width:"100%",paddingRight:4,textAlign:"right",borderTop:"1px solid var(--divider)",height:slotH,boxSizing:"border-box"}}>{String(h).padStart(2,"0")}:00</div>)}</div>
        <div style={{height:40,background:"var(--bg-sunken)",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:8}}><span style={{fontSize:9.5,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Tot</span></div>
      </div>
      {days.map(d=>{
        const wk=isWE(d),footer=footerByDay?.[d],tEvs=tutByDay?.[d]||[],avOvEvs=(overlayActive&&avOverlayByDay)?avOverlayByDay[d]||[]:[];
        const avEvs=avByDay?.[d]||[],lA=layoutEvents(avEvs),lOv=layoutEvents(avOvEvs);
        const avPosMap={};lOv.forEach(({ev,col,numCols})=>{avPosMap[ev.corsoName]={col,numCols};});
        const tLayout=layoutEvents(tEvs);
        const tutOvSub=new Map();{const byCorso={};for(const tev of tEvs){if(avPosMap[tev.name])(byCorso[tev.name]=byCorso[tev.name]||[]).push(tev);}for(const name in byCorso)layoutEvents(byCorso[name]).forEach(({ev,col,numCols})=>tutOvSub.set(ev,{subCol:col,subNumCols:numCols}));}
        return(<div key={d} id={`day-col-${d}`} style={{width:colW,flexShrink:0,borderRight:"1px solid var(--border-strong)",background:wk?"var(--bg-weekend)":"var(--bg-elev)"}}>
          <div style={{height:60,background:wk?"var(--bg-weekend)":"var(--bg-elev)",borderBottom:`2px solid ${wk?"var(--border-strong)":"var(--border-strong)"}`,padding:"6px 10px",display:"flex",flexDirection:"column",justifyContent:"center",position:"sticky",top:0,zIndex:25}}>
            <span style={{fontSize:10,color:wk?"var(--fg-muted)":"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>{getDN(d)}</span>
            <span style={{fontWeight:700,fontSize:17,color:wk?"var(--fg-muted)":"var(--fg)",letterSpacing:"-0.01em"}}>{d}</span>
          </div>
          <div onClick={e=>{if(!wasDrag())onGridClick&&onGridClick(d,e);}} style={{position:"relative",height:12*slotH,background:wk?"var(--bg-weekend)":"var(--bg-elev)",cursor:onGridClick?"crosshair":"default",overflow:"visible"}}>
            {HOURS.map(h=><div key={h} style={{position:"absolute",top:(h-8)*slotH,left:0,right:0,height:slotH,borderTop:"1px solid var(--divider)"}}/>)}
            {overlayActive&&tEvs.map((tev,i)=>{const pos=avPosMap[tev.name];if(pos){const colFrac=1/pos.numCols;const sub=tutOvSub.get(tev)||{subCol:0,subNumCols:1};const laneLeft=pos.col*colFrac*colW,laneW=colFrac*colW,subFrac=1/sub.subNumCols;return(<DraggableSlot key={"to"+i} ev={tev} col={0} numCols={1} color={tev._color||"var(--accent)"} tutorLabel={tev._tutorLabel} slotH={slotH} colW={colW} onEdit={tev._onEdit} onClick={tev._onClick} onDragEnd={onTutDragEnd&&tev._onEdit?u=>onTutDragEnd(tev.id,u):null} posOverride={{top:(tev.start-8)*slotH+OVR_PAD,left:laneLeft+sub.subCol*subFrac*laneW+OVR_PAD+1,width:subFrac*laneW-OVR_PAD*2-2,height:Math.max((tev.end-tev.start)*slotH-OVR_PAD*2,20)}} highlightError={highlightEvId===tev.id} onDragMove={onTutDragMove}/>);}else{const found=tLayout.find(x=>x.ev===tev)||{col:0,numCols:1};return(<DraggableSlot key={"tb"+i} ev={tev} col={found.col} numCols={found.numCols} color={tev._color||"var(--accent)"} tutorLabel={tev._tutorLabel} slotH={slotH} colW={colW} onEdit={tev._onEdit} onClick={tev._onClick} onDragEnd={onTutDragEnd&&tev._onEdit?u=>onTutDragEnd(tev.id,u):null} highlightError={highlightEvId===tev.id} onDragMove={onTutDragMove}/>);}})}
            {!overlayActive&&tEvs.map((tev,i)=>{const found=tLayout.find(x=>x.ev===tev)||{col:0,numCols:1};return(<DraggableSlot key={"t"+i} ev={tev} col={found.col} numCols={found.numCols} color={tev._color||"var(--accent)"} tutorLabel={tev._tutorLabel} slotH={slotH} colW={colW} onEdit={tev._onEdit} onClick={tev._onClick} onDragEnd={onTutDragEnd&&tev._onEdit?u=>onTutDragEnd(tev.id,u):null} highlightError={highlightEvId===tev.id} onDragMove={onTutDragMove}/>);})}
            {overlayActive&&lOv.map(({ev,col,numCols},i)=><AvOverlaySlot key={"ov"+i} ev={ev} col={col} numCols={numCols} color={ev.avColor} slotH={slotH}/>)}
            {lA.map(({ev,col,numCols},i)=><AvDraggableSlot key={"a"+i} ev={ev} col={col} numCols={numCols} color={ev.avColor} slotH={slotH} colW={colW} onEdit={ev._onEdit} onDragEnd={onAvDragEnd&&ev._onEdit?(u=>onAvDragEnd(ev.corsoId,ev.id,u)):null} highlightError={highlightEvId===ev.id}/>)}
          </div>
          <div style={{height:40,background:"var(--bg-sunken)",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {footer?<span style={{fontSize:13,fontWeight:700,color:"var(--fg)"}}>{footer}</span>:<span style={{fontSize:10,color:"var(--fg-faint)"}}>—</span>}
          </div>
        </div>);
      })}
    </div>
  </div>);
}

function MonthView({month,tutByDay,avByDay,onDayClick}){
  const daysArr=Array.from({length:month.days},(_,i)=>i+1);
  const isWE=d=>[0,6].includes(new Date(month.year,month.month,d).getDay());
  const firstDow=(new Date(month.year,month.month,1).getDay()||7)-1;
  return(<div style={{flex:1,overflowY:"auto",padding:16,background:"var(--bg)"}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
      {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"var(--fg-subtle)",padding:"4px 0"}}>{d}</div>)}
      {Array.from({length:firstDow},(_,i)=><div key={`e${i}`}/>)}
      {daysArr.map(d=>{const wk=isWE(d),tEvs=tutByDay?.[d]||[],aEvs=avByDay?.[d]||[];const all=[...tEvs,...aEvs];return(<div key={d} className={`month-cell${wk?" we":""}`} onClick={()=>onDayClick&&onDayClick(d)}><div style={{fontSize:12,fontWeight:700,color:wk?"var(--fg-muted)":"var(--fg)",marginBottom:2}}>{d}</div>{all.slice(0,3).map((ev,i)=><div key={i} style={{height:4,borderRadius:3,background:ev.avColor||ev._color||"var(--accent)",opacity:.85,marginBottom:2}}/>)}{all.length>3&&<div style={{fontSize:9,color:"var(--fg-subtle)"}}>+{all.length-3}</div>}</div>);})}
    </div>
  </div>);
}

// ── ZOOM BAR ──────────────────────────────────────────────────────────────
function ZoomBar({zoomIdx,onZoomChange,onHelpOpen}){
  return(<div className="zoom-bar">
    <button className="zoom-btn" onClick={()=>onZoomChange(Math.max(0,zoomIdx-1))} disabled={zoomIdx===0}>−</button>
    <span style={{fontSize:11,color:"var(--fg-muted)",minWidth:36,textAlign:"center"}}>{Math.round(ZOOM_LEVELS[zoomIdx]*100)}%</span>
    <button className="zoom-btn" onClick={()=>onZoomChange(Math.min(ZOOM_LEVELS.length-1,zoomIdx+1))}>+</button>
    <div style={{width:1,height:18,background:"var(--divider)",margin:"0 2px"}}/>
    <button onClick={onHelpOpen} title="Guida e FAQ" style={{width:28,height:28,border:"1.5px solid var(--border)",borderRadius:"50%",background:"var(--bg-elev)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-strong)",fontWeight:800}}>
      <Icon name="helpCircle" size={14} color="var(--accent-strong)"/>
    </button>
  </div>);
}

// ── HELP BOT ──────────────────────────────────────────────────────────────
const HELP_FAQ=[
  {id:"root",q:"Di cosa hai bisogno?",opts:[{label:"Navigazione calendario",icon:"calendar",next:"nav"},{label:"Tutoraggi",icon:"mapPin",next:"tut"},{label:"Corsi",icon:"briefcase",next:"av"},{label:"Anagrafiche",icon:"users",next:"ana"},{label:"Insights",icon:"barchart",next:"insight"},{label:"AI Import",icon:"sparkles",next:"ai"},{label:"Impostazioni",icon:"settings",next:"settings"},{label:"Backup",icon:"save",next:"backup"},{label:"Verifica",icon:"shieldCheck",next:"verifica"}]},
  {id:"nav",q:"Navigazione",opts:[{label:"Come cambio mese?",ans:"Usa le frecce nella topbar, oppure clicca sul nome del mese per il selettore rapido."},{label:"Come cambio vista?",ans:"Usa i pulsanti Mese / Sett. / Giorno nella barra in basso a destra."},{label:"Come regolo lo zoom?",ans:"Usa i pulsanti − e + nella barra in basso a destra."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"tut",q:"Tutoraggi",opts:[{label:"Come aggiungo uno slot?",ans:"Attiva Edit Mode dalla topbar, poi clicca sulla griglia o usa '+ Aggiungi'. Seleziona tutor, corso, giorno e orario."},{label:"Come modifico uno slot?",ans:"In Edit Mode clicca l'icona matita sullo slot. Puoi anche trascinarlo o ridimensionarlo dal bordo inferiore."},{label:"Come elimino uno slot?",ans:"Apri il form di modifica e premi il tasto Elimina in basso a sinistra."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"av",q:"Corsi",opts:[{label:"Come aggiungo una sessione?",ans:"Vai nella vista Corsi dalla sidebar, attiva Edit Mode e clicca sulla griglia."},{label:"Come filtro i corsi?",ans:"Nella filter bar clicca sui chip dei corsi per mostrarli o nasconderli."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"ana",q:"Anagrafiche",opts:[{label:"Come aggiungo un tutor?",ans:"Dalla sidebar clicca 'Anagrafica Tutor', poi '+ Nuovo tutor'. Compila nome, CF, azienda e colore."},{label:"Come aggiungo un corso?",ans:"Dalla sidebar clicca 'Anagrafica Corsi', poi '+ Nuovo corso'."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"insight",q:"Insights",opts:[{label:"Come vedo il riepilogo?",ans:"Dalla sidebar clicca 'Insights & Riepiloghi'. Puoi filtrare per mese o anno e vedere dati per tutor o per corso."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"ai",q:"AI Import",opts:[{label:"Come funziona?",ans:"Dalla sidebar clicca 'AI Import' (o il pulsante nella topbar in Edit Mode). Scegli tipo, seleziona tutor/corso e carica un PDF o incolla testo."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"settings",q:"Impostazioni",opts:[{label:"Quali ruoli esistono?",ans:"Viewer: solo lettura. Utente: modifica + log + backup. Admin: gestione utenti. Super Admin: accesso completo."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"backup",q:"Backup",opts:[{label:"Come creo un backup?",ans:"Dalla sidebar → Impostazioni → Backup. Clicca 'Crea backup ora'."},{label:"Come esporto?",ans:"In Impostazioni → Backup, clicca 'Esporta JSON'."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
  {id:"verifica",q:"Verifica",opts:[{label:"Cosa controlla?",ans:"Dalla sidebar clicca 'Verifica coerenza'. Controlla: slot fuori orario, sovrapposizioni, ore eccedenti, ore giornaliere >8h."},{label:"Come verifico uno slot?",ans:"Solo Admin e Super Admin possono verificare gli slot. In Edit Mode, apri la modifica di uno slot e spunta 'Verificato'. Lo slot mostrerà un badge verde (scudo ✓) e non sarà più modificabile dagli utenti non autorizzati."},{label:"Come de-verifico uno slot?",ans:"Apri la modifica dello slot (solo Admin/Super Admin), deseleziona 'Verificato' e salva. L'operazione viene registrata nel log attività."},{label:"Torna al menu",icon:"arrowLeft",next:"root"}]},
];

function HelpBot({onClose}){
  const[history,setHistory]=useState([{nodeId:"root"}]);
  const[lastAns,setLastAns]=useState(null);
  const btmRef=useRef();
  const current=HELP_FAQ.find(f=>f.id===history[history.length-1].nodeId)||HELP_FAQ[0];
  useEffect(()=>{btmRef.current?.scrollIntoView({behavior:"smooth"});},[history,lastAns]);
  function handleOpt(opt){if(opt.ans)setLastAns(opt.ans);else if(opt.next){setLastAns(null);setHistory(h=>[...h,{nodeId:opt.next}]);}}
  return(<div className="helpbot-window">
    <div className="helpbot-header">
      <div style={{width:36,height:36,borderRadius:9,background:"rgba(245,163,90,.18)",border:"1px solid rgba(245,163,90,.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name="message" size={18} color="#F5A35A"/>
      </div>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>Guida</div><div style={{fontSize:10.5,color:"rgba(255,255,255,.6)",marginTop:1}}>FAQ · TutorIA</div></div>
      <button onClick={onClose} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",width:26,height:26,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="x" size={14} color="#fff"/>
      </button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:6,background:"var(--bg)",minHeight:0}}>
      {lastAns?(<><div style={{background:"var(--bg-elev)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"var(--fg)",lineHeight:1.6,border:"1px solid var(--border)"}}>{lastAns}</div><button onClick={()=>setLastAns(null)} className="btn" data-variant="outline" data-size="sm" style={{alignSelf:"flex-start",display:"flex",alignItems:"center",gap:6}}><Icon name="arrowLeft" size={12}/>Altre domande</button></>)
      :(<><div style={{fontWeight:600,fontSize:12,color:"var(--fg)",marginBottom:2}}>{current.q}</div>{current.opts.map((opt,i)=>(<button key={i} onClick={()=>handleOpt(opt)} style={{textAlign:"left",padding:"8px 12px",borderRadius:"var(--radius)",border:"1px solid var(--border)",background:"var(--bg-elev)",color:"var(--fg)",cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:10}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={e=>e.currentTarget.style.background="var(--bg-elev)"}>
        {opt.icon&&<span style={{width:22,height:22,borderRadius:5,background:"var(--accent-soft)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={opt.icon} size={12} color="var(--accent-strong)"/></span>}
        <span style={{flex:1}}>{opt.label}</span>
        {opt.next&&<Icon name="chevRight" size={12} color="var(--fg-subtle)"/>}
      </button>))}</>)}
      <div ref={btmRef}/>
    </div>
  </div>);
}
