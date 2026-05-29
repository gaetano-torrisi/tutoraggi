/* eslint-disable */
function applyFavicon(src){if(!src)return;const img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=32;c.height=32;const ctx=c.getContext("2d");const scale=Math.min(32/img.width,32/img.height);const w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(32-w)/2,(32-h)/2,w,h);const png=c.toDataURL("image/png");let link=document.querySelector("link[rel='icon']")||document.querySelector("link[rel='shortcut icon']");if(!link){link=document.createElement("link");link.rel="icon";link.type="image/png";document.head.appendChild(link);}link.href=png;};img.src=src;}
// ── PROFILE MODAL ─────────────────────────────────────────────────────────
function ProfileModal({user,onClose}){
  const[form,setForm]=useState({nome:"",cognome:"",telefono:"",ente:""});
  const[saving,setSaving]=useState(false);const[saved,setSaved]=useState(false);const[loading,setLoading]=useState(true);
  useEffect(()=>{db.collection("userProfiles").doc(user.uid).get().then(snap=>{if(snap.exists)setForm({nome:"",cognome:"",telefono:"",ente:"",...snap.data()});setLoading(false);}).catch(()=>setLoading(false));},[]);
  async function handleSave(){if(!form.nome||!form.cognome)return;setSaving(true);await db.collection("userProfiles").doc(user.uid).set({nome:form.nome,cognome:form.cognome,telefono:form.telefono||"",ente:form.ente||"",email:user.email},{merge:true});setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);}
  return(<div className="profile-modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="profile-modal-box">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontWeight:700,fontSize:15,color:"var(--fg)",display:"flex",alignItems:"center",gap:7}}><Icon name="user" size={15} color="var(--accent)"/>Profilo utente</span>
        <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="x" size={14}/></button>
      </div>
      {loading?<div style={{textAlign:"center",padding:20,color:"var(--fg-subtle)"}}><Icon name="loader" size={16} color="var(--fg-subtle)"/></div>:<>
        <div style={{marginBottom:6,padding:"8px 12px",borderRadius:"var(--radius)",background:"var(--bg-sunken)",fontSize:12,color:"var(--fg-muted)"}}>{user.email}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12,marginTop:14}}>
          <div><label className="label">Nome *</label><input className="input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}/></div>
          <div><label className="label">Cognome *</label><input className="input" value={form.cognome} onChange={e=>setForm(f=>({...f,cognome:e.target.value}))}/></div>
        </div>
        <div style={{marginBottom:12}}><label className="label">Telefono</label><input className="input" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></div>
        <div style={{marginBottom:18}}><label className="label">Ente / Azienda</label><input className="input" value={form.ente} onChange={e=>setForm(f=>({...f,ente:e.target.value}))}/></div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={onClose} className="btn" data-variant="outline">Annulla</button>
          <button onClick={handleSave} disabled={saving||!form.nome||!form.cognome} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}>
            {saving?<><Icon name="loader" size={13} color="#fff"/>Salvataggio...</>:saved?<><Icon name="check" size={13} color="#fff"/>Salvato</>:<><Icon name="check" size={13} color="#fff"/>Salva</>}
          </button>
        </div>
      </>}
    </div>
  </div>);
}

// ── AI PANEL ──────────────────────────────────────────────────────────────
function AiPanel({tutors,anagraficaAv,settings,user,isSuperAdmin,onAddTut,onAddAv,onSaveTutor,onSaveAna,onOpenAnaTutors,onOpenAnaAvvisi,onClose}){
  const[step,setStep]=useState("start");const[importType,setImportType]=useState(null);const[selTutor,setSelTutor]=useState("");const[selAv,setSelAv]=useState("");const[pending,setPending]=useState([]);const[ambig,setAmbig]=useState([]);const[loading,setLoading]=useState(false);const[showPaste,setShowPaste]=useState(false);const[pasteText,setPasteText]=useState("");
  const[showInlineTutor,setShowInlineTutor]=useState(false);const[showInlineAvviso,setShowInlineAvviso]=useState(false);
  const PHRASES=["Cosa importiamo oggi nel calendario del dolore?","Quante riunioni di oggi potevano essere una email?","Quale documento ti ha rovinato la giornata?","Quale deadline ti ha svegliato stanotte?","Cosa ottimizziamo oggi per non farlo mai più manualmente?","Quale foglio Excel vorresti bruciare?","Cosa posso fare per renderti la giornata meno lunga?","Cosa ti manca per staccare prima delle 18?","Cosa vuoi fare oggi invece di goderti il sole?","Quale collega ti ha già scritto tre email oggi?","Quale procedura amministrativa vorresti semplificare per sempre?","Quante ore di riunioni avresti potuto evitare questa settimana?","Quale scadenza regionale ti tiene sveglio la notte?","Cosa vuoi delegare a me prima di andare a pranzo?","Quale modulo hai compilato tre volte perché il sistema era giù?","Cosa ti ha fatto perdere più tempo oggi, la burocrazia o la tecnologia?","Quale progetto giace abbandonato in una cartella del desktop?","Quanti allegati stai per inviare a qualcuno che non li leggerà mai?","Cosa sistemiamo oggi per non doverci pensare più?","Quale report hai rimandato abbastanza da renderlo urgente?","Quante volte hai riscritto la stessa email oggi?","Quale riunione ricorrente potresti cancellare senza che nessuno se ne accorga?","Stai ottimizzando qualcosa che potevi eliminare direttamente?","Quanti tab hai aperti in questo momento?","Quale collega ti ha mandato un \"ok\" invece di leggere tutto il documento?","Cosa hai rimandato a lunedì tre lunedì fa?","Hai mai pensato che questo calendario potrebbe gestirsi da solo?","Quanti \"urgente\" hai ricevuto oggi che non erano urgenti?","Quale norma regionale hai riletto tre volte senza capirla?","Cosa faresti con un'ora in più al giorno? Perché non me la deleghi?"];
  const phrase=useRef(PHRASES[Math.floor(Math.random()*PHRASES.length)]).current;
  const[messages,setMessages]=useState([{role:"ai",text:phrase,buttons:[{label:"Tutoraggi",icon:"mapPin",value:"tutoraggio"},{label:"Avviso/Progetto",icon:"briefcase",value:"avviso"}]}]);
  const fileRef=useRef(),btmRef=useRef();
  const uname=user?.email?.split("@")[0]||"utente";
  useEffect(()=>{btmRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  const addMsg=m=>setMessages(p=>[...p,m]);
  function startImport(type){setImportType(type);if(type==="tutoraggio"){if(!tutors.length){setStep("selTutor");addMsg({role:"ai",text:"Nessun tutor ancora. Creane uno per procedere:",showTutorSel:true});setShowInlineTutor(true);return;}addMsg({role:"ai",text:"Hai già inserito il tutor in anagrafica?",showTutorCheck:true});}else{if(!anagraficaAv.length){setStep("selAv");addMsg({role:"ai",text:"Nessun avviso ancora. Creane uno per procedere:",showAvSel:true});setShowInlineAvviso(true);return;}addMsg({role:"ai",text:"Hai già inserito l'Avviso/Progetto in anagrafica?",showAvCheck:true});}}
  function proceedTutor(){setStep("selTutor");addMsg({role:"ai",text:"Seleziona tutor e avviso, poi carica il documento o incolla il testo.",showTutorSel:true});}
  function proceedAv(){setStep("selAv");addMsg({role:"ai",text:"Seleziona l'avviso/progetto, poi carica il documento o incolla il testo.",showAvSel:true});}
  async function processSource(file,text){if(file)addMsg({role:"user",text:file.name,icon:"paperclip"});else addMsg({role:"user",text:`Testo incollato (${text.length} caratteri)`,icon:"clipboard"});setLoading(true);addMsg({role:"ai",text:"Analisi in corso...",isLoading:true});try{const res=await analyzeDoc(file,text);handleResult(res);}catch(err){setMessages(p=>p.filter(m=>!m.isLoading));addMsg({role:"ai",text:`Errore: ${err.message}`});}setLoading(false);}
  async function processPaste(){if(!pasteText.trim()){addMsg({role:"ai",text:"Testo vuoto."});return;}if(!looksLikeCalendar(pasteText)){addMsg({role:"ai",text:"Il testo non sembra contenere date o orari."});setPasteText("");setShowPaste(false);return;}setShowPaste(false);const t=pasteText;setPasteText("");await processSource(null,t);}
  function handleResult(res){setMessages(p=>p.filter(m=>!m.isLoading));if(res.ambiguities?.length>0){setAmbig(res.ambiguities);setPending(res.events||[]);setStep("ambiguity");addMsg({role:"ai",text:`${res.events?.length||0} appuntamenti, chiarimenti necessari:`,showAmbiguities:res.ambiguities});}else if(res.events?.length>0){setPending(res.events);setStep("preview");addMsg({role:"ai",text:`${res.events.length} appuntamenti trovati. Confermi?`,showPreview:res.events});}else addMsg({role:"ai",text:"Nessun appuntamento trovato.",showUpload:true});}
  async function analyzeDoc(file,text){const prov=settings.aiProvider||"openai";const prompt=`Estrai appuntamenti da questo documento/testo. Rispondi SOLO con JSON:\n{"events":[{"day":8,"month":"mag-26","start":9.5,"end":13.5,"ore":4,"name":"nome"}],"ambiguities":[]}\nRegole: month=mmm-yy, start/end decimali, ore=durata.`;
    if(prov==="gemini"){if(!settings.geminiApiKey)throw new Error("Chiave Gemini non configurata.");let parts;if(text){parts=[{text:`${prompt}\n\n${text}`}];}else{const b64=await toB64(file);const mime=file.type||"application/octet-stream";const isPdf=mime==="application/pdf",isImg=mime.startsWith("image/");parts=isPdf||isImg?[{inline_data:{mime_type:mime,data:b64}},{text:prompt}]:[{text:`${prompt}\n\n${atob(b64)}`}];}const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiApiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts}]})});if(!r.ok){const j=await r.json();throw new Error(r.status===429?"Quota Gemini esaurita.":r.status===401?"Chiave Gemini non valida.":`Errore ${r.status}: ${j.error?.message||""}`);}const d=await r.json();return parseR(d.candidates?.[0]?.content?.parts?.[0]?.text||"{}");}
    else{if(!settings.openaiApiKey)throw new Error("Chiave OpenAI non configurata.");let msgs;if(text){msgs=[{role:"user",content:`${prompt}\n\n${text}`}];}else{const b64=await toB64(file);const mime=file.type||"application/octet-stream";const isImg=mime.startsWith("image/");msgs=isImg?[{role:"user",content:[{type:"text",text:prompt},{type:"image_url",image_url:{url:`data:${mime};base64,${b64}`}}]}]:[{role:"user",content:`${prompt}\n\n${mime==="application/pdf"?"[PDF]":atob(b64)}`}];}const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${settings.openaiApiKey}`},body:JSON.stringify({model:"gpt-4o-mini",messages:msgs,max_tokens:2000})});if(!r.ok)throw new Error(r.status===429?"Quota OpenAI esaurita.":r.status===401?"Chiave OpenAI non valida.":`Errore ${r.status}`);const d=await r.json();return parseR(d.choices?.[0]?.message?.content||"{}");}
  }
  function toB64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});}
  function parseR(t){try{return JSON.parse(t.replace(/```json|```/g,"").trim());}catch{const m=t.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error("Risposta AI non valida");}}
  async function onFile(e){const file=e.target.files[0];if(!file)return;e.target.value="";if(importType==="tutoraggio"&&(!selTutor||!selAv)){addMsg({role:"ai",text:"Seleziona prima tutor e avviso."});return;}if(importType==="avviso"&&!selAv){addMsg({role:"ai",text:"Seleziona prima un avviso/progetto."});return;}await processSource(file,null);}
  async function onConfirm(){setLoading(true);try{if(importType==="tutoraggio"){const avName=anagraficaAv.find(a=>a.id===selAv)?.nome||"";for(const ev of pending)await onAddTut({day:ev.day,name:avName,start:ev.start,end:ev.end,ore:ev.ore,tutorId:selTutor},ev.month);}else{const events=pending.map((ev,i)=>({id:`ave-${Date.now()}-${i}`,month:ev.month,day:ev.day,start:ev.start,end:ev.end,ore:ev.ore}));await onAddAv({id:selAv,events});}setStep("done");addMsg({role:"ai",text:`Importati ${pending.length} appuntamenti.`,icon:"checkCircle"});}catch(err){addMsg({role:"ai",text:`Errore: ${err.message}`});}setLoading(false);}
  const uploadButtons=()=>(<div style={{display:"flex",gap:6,flexDirection:"column",width:"100%",marginTop:6}}>
    <button onClick={()=>fileRef.current.click()} className="btn" data-variant="outline" style={{width:"100%",justifyContent:"center",borderStyle:"dashed",borderColor:"var(--accent)",color:"var(--accent)",display:"flex",alignItems:"center",gap:7}}><Icon name="paperclip" size={13} color="var(--accent)"/>Carica documento</button>
    <button onClick={()=>setShowPaste(s=>!s)} className="btn" data-variant="outline" style={{width:"100%",justifyContent:"center",borderStyle:"dashed",borderColor:"var(--success)",color:"var(--success)",display:"flex",alignItems:"center",gap:7}}><Icon name="clipboard" size={13} color="var(--success)"/>Incolla testo</button>
    {showPaste&&<div style={{marginTop:4}}><textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Incolla qui il testo con le date..." className="textarea" style={{fontSize:12}}/><button onClick={processPaste} disabled={loading||!pasteText.trim()} className="btn" data-variant="accent" style={{width:"100%",justifyContent:"center",marginTop:4,display:"flex",alignItems:"center",gap:6}}><Icon name="sparkles" size={13} color="#fff"/>Analizza testo</button></div>}
  </div>);
  function renderMsg(msg,idx){const isAi=msg.role==="ai";
    return(<div key={idx} style={{display:"flex",flexDirection:"column",alignItems:isAi?"flex-start":"flex-end",marginBottom:10}}>
      <div style={{maxWidth:"90%",padding:"9px 13px",borderRadius:isAi?"4px 14px 14px 14px":"14px 4px 14px 14px",background:isAi?"var(--bg-sunken)":"var(--accent)",color:isAi?"var(--fg)":"#fff",fontSize:13,lineHeight:1.5,border:isAi?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:7}}>
        {msg.icon&&<Icon name={msg.icon} size={13} color={isAi?"var(--fg-muted)":"rgba(255,255,255,.8)"}/>}
        {msg.isLoading?<span style={{opacity:.6,display:"flex",alignItems:"center",gap:6}}><Icon name="loader" size={13} color="var(--fg-muted)"/>{msg.text}</span>:<span>{msg.text}</span>}
      </div>
      {msg.buttons&&<div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>{msg.buttons.map(b=><button key={b.value} onClick={()=>{addMsg({role:"user",text:b.label,icon:b.icon});startImport(b.value);}} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}>{b.icon&&<Icon name={b.icon} size={13} color="var(--accent)"/>}{b.label}</button>)}</div>}
      {msg.showOpenTutor&&<button onClick={onOpenAnaTutors} className="btn" data-variant="outline" style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}><Icon name="users" size={13}/>Apri Anagrafica Tutor</button>}
      {msg.showOpenAv&&<button onClick={onOpenAnaAvvisi} className="btn" data-variant="outline" style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}><Icon name="briefcase" size={13}/>Apri Anagrafica Avvisi</button>}
      {msg.showTutorCheck&&<div style={{display:"flex",gap:8,marginTop:6}}><button onClick={proceedTutor} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="check" size={13} color="#fff"/>Sì, procedi</button><button onClick={()=>{proceedTutor();setShowInlineTutor(true);}} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={13}/>No, aggiungi</button></div>}
      {msg.showAvCheck&&<div style={{display:"flex",gap:8,marginTop:6}}><button onClick={proceedAv} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="check" size={13} color="#fff"/>Sì, procedi</button><button onClick={()=>{proceedAv();setShowInlineAvviso(true);}} className="btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={13}/>No, aggiungi</button></div>}
      {msg.showTutorSel&&step==="selTutor"&&<div style={{marginTop:8,width:"100%"}}>
        <select value={selTutor} onChange={e=>setSelTutor(e.target.value)} className="select" style={{marginBottom:4}}>
          <option value="">— Seleziona tutor —</option>
          {[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=><option key={t.id} value={t.id}>{t.cognome} {t.nome}</option>)}
        </select>
        {!showInlineTutor
          ?<button onClick={()=>setShowInlineTutor(true)} style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:"2px 0",marginBottom:6,display:"inline-flex",alignItems:"center",gap:4}}><Icon name="plus" size={11} color="var(--accent)"/>Nuovo tutor</button>
          :<InlineCreateTutor tutors={tutors} onSaveTutor={onSaveTutor} onCreated={t=>{setSelTutor(t.id);setShowInlineTutor(false);}} onCancel={()=>setShowInlineTutor(false)} onAddMessage={txt=>addMsg({role:"ai",text:txt})}/>}
        <select value={selAv} onChange={e=>setSelAv(e.target.value)} className="select" style={{marginTop:4,marginBottom:4}}>
          <option value="">— Seleziona avviso —</option>
          {[...anagraficaAv].sort((a,b)=>a.nome.localeCompare(b.nome)).map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        {!showInlineAvviso
          ?<button onClick={()=>setShowInlineAvviso(true)} style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:"2px 0",marginBottom:6,display:"inline-flex",alignItems:"center",gap:4}}><Icon name="plus" size={11} color="var(--accent)"/>Nuovo avviso</button>
          :<InlineCreateAvviso anagraficaAv={anagraficaAv} onSaveAna={onSaveAna} onCreated={a=>{setSelAv(a.id);setShowInlineAvviso(false);}} onCancel={()=>setShowInlineAvviso(false)} onAddMessage={txt=>addMsg({role:"ai",text:txt})}/>}
        {(!selTutor||!selAv)?<div style={{fontSize:11,color:"var(--fg-subtle)",fontStyle:"italic",marginTop:6}}>Seleziona tutor e avviso per procedere.</div>:uploadButtons()}
      </div>}
      {msg.showAvSel&&step==="selAv"&&<div style={{marginTop:8,width:"100%"}}>
        <select value={selAv} onChange={e=>setSelAv(e.target.value)} className="select" style={{marginBottom:4}}>
          <option value="">— Seleziona avviso —</option>
          {[...anagraficaAv].sort((a,b)=>a.nome.localeCompare(b.nome)).map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        {!showInlineAvviso
          ?<button onClick={()=>setShowInlineAvviso(true)} style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:"2px 0",marginBottom:6,display:"inline-flex",alignItems:"center",gap:4}}><Icon name="plus" size={11} color="var(--accent)"/>Nuovo avviso</button>
          :<InlineCreateAvviso anagraficaAv={anagraficaAv} onSaveAna={onSaveAna} onCreated={a=>{setSelAv(a.id);setShowInlineAvviso(false);}} onCancel={()=>setShowInlineAvviso(false)} onAddMessage={txt=>addMsg({role:"ai",text:txt})}/>}
        {!selAv?<div style={{fontSize:11,color:"var(--fg-subtle)",fontStyle:"italic",marginTop:6}}>Seleziona un avviso per procedere.</div>:uploadButtons()}
      </div>}
      {msg.showUpload&&uploadButtons()}
      {msg.showPreview&&<div style={{marginTop:6,width:"100%"}}><div style={{maxHeight:130,overflowY:"auto",border:"1px solid var(--border)",borderRadius:"var(--radius)",background:"var(--bg-elev)",marginBottom:8}}>{msg.showPreview.map((ev,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 10px",borderBottom:"1px solid var(--divider)",fontSize:11}}><span style={{color:"var(--fg-muted)",fontFamily:'"JetBrains Mono",monospace'}}>{ev.day} {ev.month} — {fmt(ev.start)}–{fmt(ev.end)}</span><span style={{fontWeight:600,color:"var(--fg)",fontFamily:'"JetBrains Mono",monospace'}}>{ev.ore}h</span></div>)}</div>{step==="preview"&&<div style={{display:"flex",gap:6}}><button onClick={onConfirm} disabled={loading} className="btn" data-variant="accent" style={{flex:1,justifyContent:"center",display:"flex",alignItems:"center",gap:6}}>{loading?<><Icon name="loader" size={13} color="#fff"/>Importazione...</>:<><Icon name="check" size={13} color="#fff"/>Conferma tutto</>}</button><button onClick={()=>{setStep(importType==="tutoraggio"?"selTutor":"selAv");addMsg({role:"ai",text:"Ok, carica un altro file.",showUpload:true});}} className="btn" data-variant="outline"><Icon name="x" size={13}/></button></div>}</div>}
      {msg.showAmbiguities&&<div style={{marginTop:6,width:"100%"}}>{msg.showAmbiguities.map((a,i)=><div key={i} style={{padding:"8px 10px",marginBottom:4,borderRadius:"var(--radius)",border:"1px solid var(--warning)",background:"var(--warning-soft)",fontSize:11}}><div style={{fontWeight:700,color:"var(--warning)",marginBottom:3,display:"flex",alignItems:"center",gap:5}}><Icon name="alert" size={12} color="var(--warning)"/>{a.field}</div><div style={{color:"var(--fg-muted)",marginBottom:5}}>{a.description}</div><button onClick={()=>{const rem=ambig.filter((_,j)=>j!==i);setAmbig(rem);if(!rem.length){setStep("preview");addMsg({role:"ai",text:"Grazie! Ecco il riepilogo:",showPreview:pending});}}} className="btn" data-variant="accent" data-size="sm" style={{display:"flex",alignItems:"center",gap:4}}><Icon name="check" size={11} color="#fff"/>Confermo</button></div>)}</div>}
    </div>);}
  return(<div className="sidebar-ai-panel">
    <div style={{background:"linear-gradient(135deg,var(--brand-navy),#2A2F66)",color:"#fff",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        <span style={{fontWeight:800,fontSize:15,display:"flex",alignItems:"center",gap:7}}><Icon name="sparkles" size={14} color="#F5A35A"/>AI Import</span>
      </div>
      <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="x" size={16} color="#fff"/></button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",background:"var(--bg)",paddingBottom:16}}>{messages.map((m,i)=>renderMsg(m,i))}<div ref={btmRef}/></div>
    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.doc,.docx,.txt" style={{display:"none"}} onChange={onFile}/>
  </div>);
}

// ── ADD/EDIT MODAL ────────────────────────────────────────────────────────
function AddModal({mode,prefill,currentMonthIdx,avvisi,anagraficaAv,tutors,editTarget,onAddTut,onEditTut,onDeleteTut,onAddAv,onEditAv,onDeleteAv,onClose,onOpenAnaTutors,onOpenAnaAvvisi}){
  const isEdit=!!editTarget;
  const[tab,setTab]=useState(mode==="avviso"?"avviso":"tutoraggio");
  const[tutTutor,setTutTutor]=useState(isEdit&&editTarget.type==="tutoraggio"?(editTarget.ev.tutorId||tutors[0]?.id||""):(tutors[0]?.id||""));
  const[tutAvId,setTutAvId]=useState(()=>{if(isEdit&&editTarget.type==="tutoraggio"){const a=anagraficaAv.find(x=>x.nome===editTarget.ev.name);return a?.id||"";}return anagraficaAv[0]?.id||"";});
  const[tutDay,setTutDay]=useState(isEdit&&editTarget.type==="tutoraggio"?editTarget.ev.day:(prefill?.day||1));
  const[tutMonthIdx,setTutMonthIdx]=useState(currentMonthIdx);
  const[tutStart,setTutStart]=useState(hToTimeStr(isEdit&&editTarget.type==="tutoraggio"?editTarget.ev.start:(prefill?.start||9)));
  const[tutEnd,setTutEnd]=useState(hToTimeStr(isEdit&&editTarget.type==="tutoraggio"?editTarget.ev.end:(prefill?.end||10)));
  const[avId,setAvId]=useState(isEdit&&editTarget.type==="avviso"?editTarget.avviso.id:(anagraficaAv[0]?.id||""));
  const[avDay,setAvDay]=useState(isEdit&&editTarget.type==="avviso"?editTarget.ev.day:(prefill?.day||1));
  const[avMonthIdx,setAvMonthIdx]=useState(currentMonthIdx);
  const[avStart,setAvStart]=useState(hToTimeStr(isEdit&&editTarget.type==="avviso"?editTarget.ev.start:(prefill?.start||9)));
  const[avEnd,setAvEnd]=useState(hToTimeStr(isEdit&&editTarget.type==="avviso"?editTarget.ev.end:(prefill?.end||13)));
  const selT=tutors.find(t=>t.id===tutTutor);const selAnaT=anagraficaAv.find(a=>a.id===tutAvId);const selAnaAv=anagraficaAv.find(a=>a.id===avId);
  return(<div className="add-modal-backdrop">
    <div className="add-modal-box">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontWeight:700,fontSize:15,color:"var(--fg)",display:"flex",alignItems:"center",gap:7}}>
          {isEdit?<Icon name="edit" size={15} color="var(--accent)"/>:<Icon name="plus" size={15} color="var(--accent)"/>}
          {isEdit?"Modifica slot":"Aggiungi slot"}
        </span>
        <button onClick={onClose} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="x" size={14}/></button>
      </div>
      {!isEdit&&<div className="tab-strip" style={{marginBottom:16,display:"flex"}}>
        <button className={`tab-strip-btn${tab==="tutoraggio"?" active":""}`} onClick={()=>setTab("tutoraggio")} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Icon name="mapPin" size={12}/>Tutoraggio</button>
        <button className={`tab-strip-btn${tab==="avviso"?" active":""}`} onClick={()=>setTab("avviso")} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Icon name="briefcase" size={12}/>Avviso/Progetto</button>
      </div>}
      {tab==="tutoraggio"&&(<>
        <label className="label">Tutor</label>
        {tutors.length===0?<div style={{marginBottom:10,padding:"8px 10px",borderRadius:"var(--radius)",background:"var(--warning-soft)",border:"1px solid var(--warning)",fontSize:12,color:"var(--warning)",display:"flex",alignItems:"center",gap:7}}><Icon name="alert" size={13} color="var(--warning)"/>Nessun tutor. <button onClick={()=>{onClose();onOpenAnaTutors();}} style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontWeight:700,textDecoration:"underline"}}>Aggiungi</button></div>
        :<select value={tutTutor} onChange={e=>{if(e.target.value==="__open__"){onClose();onOpenAnaTutors();}else setTutTutor(e.target.value);}} className="select" style={{marginBottom:10}}>{[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=><option key={t.id} value={t.id}>{t.cognome} {t.nome}</option>)}<option value="__open__">+ Apri Anagrafica Tutor...</option></select>}
        {selT&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"6px 10px",borderRadius:"var(--radius)",background:hexToRgba(selT.color||"#4f86c6",.1)}}><div style={{width:14,height:14,borderRadius:3,background:selT.color||"var(--accent)"}}/><span style={{fontSize:12,color:"var(--fg-muted)"}}>Colore identificativo tutor</span></div>}
        <label className="label">Avviso/Progetto</label>
        {anagraficaAv.length===0?<div style={{marginBottom:10,padding:"8px 10px",borderRadius:"var(--radius)",background:"var(--warning-soft)",border:"1px solid var(--warning)",fontSize:12,color:"var(--warning)",display:"flex",alignItems:"center",gap:7}}><Icon name="alert" size={13} color="var(--warning)"/>Nessun avviso. <button onClick={()=>{onClose();onOpenAnaAvvisi();}} style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontWeight:700,textDecoration:"underline"}}>Aggiungi</button></div>
        :<select value={tutAvId} onChange={e=>{if(e.target.value==="__open__"){onClose();onOpenAnaAvvisi();}else setTutAvId(e.target.value);}} className="select" style={{marginBottom:10}}>{[...anagraficaAv].sort((a,b)=>a.nome.localeCompare(b.nome)).map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}<option value="__open__">+ Apri Anagrafica Avvisi...</option></select>}
        {selAnaT&&<div style={{marginBottom:10,padding:"8px 10px",borderRadius:"var(--radius)",background:hexToRgba(selAnaT.colore||"#4f86c6",.08),border:`1px solid ${hexToRgba(selAnaT.colore||"#4f86c6",.3)}`}}><div style={{fontSize:12,fontWeight:600,color:"var(--fg)"}}>{selAnaT.nome}</div><div style={{display:"flex",gap:6,marginTop:4}}>{selAnaT.durataOre&&<span className="badge" data-tone="info">{selAnaT.durataOre}h</span>}{selAnaT.stato&&<span className="badge">{selAnaT.stato}</span>}</div></div>}
        <DayPicker initialMonthIdx={tutMonthIdx} value={tutDay} selectedMonthIdx={tutMonthIdx} onChange={(d,mIdx)=>{setTutDay(d);setTutMonthIdx(mIdx);}}/>
        <div style={{display:"flex",gap:10,marginBottom:16}}><TimePicker label="Inizio" value={tutStart} onChange={setTutStart}/><TimePicker label="Fine" value={tutEnd} onChange={setTutEnd}/></div>
        <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
          {isEdit&&<button onClick={()=>{if(confirm("Eliminare questo slot?")){onDeleteTut(editTarget.ev.id);onClose();}}} className="btn" data-variant="danger" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina</button>}
          <div style={{display:"flex",gap:8,marginLeft:"auto"}}><button onClick={onClose} className="btn" data-variant="outline">Annulla</button>
          <button onClick={()=>{const s=timeStrToH(tutStart),e=timeStrToH(tutEnd);if(!tutAvId||tutAvId==="__open__"||!tutTutor||e<=s)return;const ana=anagraficaAv.find(a=>a.id===tutAvId);const mk=MONTHS[tutMonthIdx].key;if(isEdit)onEditTut(editTarget.ev.id,{day:tutDay,name:ana?.nome,start:s,end:e,ore:e-s,tutorId:tutTutor},mk);else onAddTut({day:tutDay,name:ana?.nome,start:s,end:e,ore:e-s,tutorId:tutTutor},mk);onClose();}} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}><Icon name={isEdit?"check":"plus"} size={13} color="#fff"/>{isEdit?"Salva":"Aggiungi"}</button></div>
        </div>
      </>)}
      {tab==="avviso"&&(<>
        <label className="label">Avviso/Progetto</label>
        {anagraficaAv.length===0?<div style={{marginBottom:10,padding:"8px 10px",borderRadius:"var(--radius)",background:"var(--warning-soft)",border:"1px solid var(--warning)",fontSize:12,color:"var(--warning)",display:"flex",alignItems:"center",gap:7}}><Icon name="alert" size={13} color="var(--warning)"/>Nessun avviso. <button onClick={()=>{onClose();onOpenAnaAvvisi();}} style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontWeight:700,textDecoration:"underline"}}>Aggiungi</button></div>
        :<select value={avId} onChange={e=>{if(e.target.value==="__open__"){onClose();onOpenAnaAvvisi();}else setAvId(e.target.value);}} className="select" style={{marginBottom:10}}>{[...anagraficaAv].sort((a,b)=>a.nome.localeCompare(b.nome)).map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}<option value="__open__">+ Apri Anagrafica Avvisi...</option></select>}
        {selAnaAv&&<div style={{marginBottom:10,padding:"10px 12px",borderRadius:"var(--radius)",background:hexToRgba(selAnaAv.colore||"#4f86c6",.08),border:`1px solid ${hexToRgba(selAnaAv.colore||"#4f86c6",.3)}`}}><div style={{fontSize:13,fontWeight:700,color:"var(--fg)"}}>{selAnaAv.nome}</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>{selAnaAv.durataOre&&<span className="badge" data-tone="info">{selAnaAv.durataOre}h da bando</span>}{selAnaAv.stato&&<span className="badge">{selAnaAv.stato}</span>}</div></div>}
        <DayPicker initialMonthIdx={avMonthIdx} value={avDay} selectedMonthIdx={avMonthIdx} onChange={(d,mIdx)=>{setAvDay(d);setAvMonthIdx(mIdx);}}/>
        <div style={{display:"flex",gap:10,marginBottom:10}}><TimePicker label="Inizio" value={avStart} onChange={setAvStart}/><TimePicker label="Fine" value={avEnd} onChange={setAvEnd}/></div>
        {!isEdit&&<p style={{fontSize:11,color:"var(--fg-subtle)",margin:"0 0 12px"}}>Altri appuntamenti si aggiungono in seguito.</p>}
        <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
          {isEdit&&<button onClick={()=>{if(confirm("Eliminare questo slot?")){onDeleteAv(editTarget.avviso.id,editTarget.ev.id);onClose();}}} className="btn" data-variant="danger" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="trash" size={14} color="var(--danger)"/>Elimina</button>}
          <div style={{display:"flex",gap:8,marginLeft:"auto"}}><button onClick={onClose} className="btn" data-variant="outline">Annulla</button>
          <button onClick={()=>{const s=timeStrToH(avStart),e=timeStrToH(avEnd);if(e<=s||!avId||avId==="__open__")return;const ana=anagraficaAv.find(a=>a.id===avId);const mk=MONTHS[avMonthIdx].key;const evData={month:mk,day:avDay,start:s,end:e,ore:e-s};if(isEdit)onEditAv(editTarget.avviso.id,editTarget.ev.id,evData);else onAddAv({existingId:avId,name:ana?.nome,color:ana?.colore,...evData});onClose();}} className="btn" data-variant="accent" style={{display:"flex",alignItems:"center",gap:6}}><Icon name={isEdit?"check":"plus"} size={13} color="#fff"/>{isEdit?"Salva":"Aggiungi"}</button></div>
        </div>
      </>)}
    </div>
  </div>);
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
function App({user}){
  const[activeScreen,setActiveScreen]=useState("calendar");
  const[sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const[theme,setTheme]=useState("light");
  const[view,setView]=useState("tutoraggio");
  const[editMode,setEditMode]=useState(false);
  const[tutors,setTutors]=useState([]);const[activeTutorIds,setActiveTutorIds]=useState(null);const[monthIdx,setMonthIdx]=useState(()=>{const now=new Date();const idx=MONTHS.findIndex(m=>m.year===now.getFullYear()&&m.month===now.getMonth());return idx>=0?idx:0;});
  const[avvisi,setAvvisi]=useState([]);const[anagraficaAv,setAnagraficaAv]=useState([]);const[activeAvvisi,setActiveAvvisi]=useState(new Set());const[tutEvents,setTutEvents]=useState({});
  const tutEvRef=useRef({});const avRef=useRef([]);const anaRef=useRef([]);
  const[settings,setSettings]=useState({});const[showOvr,setShowOvr]=useState(false);const[zoomIdx,setZoomIdx]=useState(2);const[calView,setCalView]=useState("day");const[weekStart,setWeekStart]=useState(null);const[modal,setModal]=useState(null);
  const[showAi,setShowAi]=useState(false);const[showHelp,setShowHelp]=useState(false);
  const[showInsights,setShowInsights]=useState(false);const[highlightEvId,setHighlightEvId]=useState(null);
  const[showAvatarMenu,setShowAvatarMenu]=useState(false);const[showProfileModal,setShowProfileModal]=useState(false);const[profileTarget,setProfileTarget]=useState(null);
  const[dragWarn,setDragWarn]=useState(null);
  const avatarRef=useRef();
  const dragWarnTimerRef=useRef();
  useEffect(()=>{function h(e){if(avatarRef.current&&!avatarRef.current.contains(e.target))setShowAvatarMenu(false);}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const[showMonthPicker,setShowMonthPicker]=useState(false);
  const[role,setRole]=useState("user");const[loading,setLoading]=useState(true);
  const[appSubtitle,setAppSubtitle]=useState("Gestionale tutoraggi");
  const undoStack=useRef([]);const redoStack=useRef([]);const[undoCount,setUndoCount]=useState(0);const[redoCount,setRedoCount]=useState(0);
  const monthPickerRef=useRef();

  const slotH=BASE_SLOT_H*ZOOM_LEVELS[zoomIdx];const colW=BASE_COL_W*ZOOM_LEVELS[zoomIdx];const month=MONTHS[monthIdx];
  const isSuperAdmin=role==="superadmin";const isAdmin=role==="admin"||isSuperAdmin;const isUser=role==="user"||isAdmin;const isViewer=role==="viewer";const canEdit=editMode&&!isViewer;
  const isCalendar=activeScreen==="calendar"||activeScreen==="verifica";
  const showVerificaPanel=activeScreen==="verifica";

  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme);},[theme]);

  function pushUndo(snapTE,snapAv){redoStack.current=[];setRedoCount(0);undoStack.current=[{tutEvents:JSON.parse(JSON.stringify(snapTE)),avvisi:JSON.parse(JSON.stringify(snapAv))},...undoStack.current].slice(0,UNDO_LIMIT);setUndoCount(undoStack.current.length);}
  async function handleUndo(){if(!undoStack.current.length)return;const snap=undoStack.current[0];undoStack.current=undoStack.current.slice(1);setUndoCount(undoStack.current.length);redoStack.current=[{tutEvents:JSON.parse(JSON.stringify(tutEvRef.current)),avvisi:JSON.parse(JSON.stringify(avRef.current))},...redoStack.current].slice(0,UNDO_LIMIT);setRedoCount(redoStack.current.length);await applySnap(snap);}
  async function handleRedo(){if(!redoStack.current.length)return;const snap=redoStack.current[0];redoStack.current=redoStack.current.slice(1);setRedoCount(redoStack.current.length);undoStack.current=[{tutEvents:JSON.parse(JSON.stringify(tutEvRef.current)),avvisi:JSON.parse(JSON.stringify(avRef.current))},...undoStack.current].slice(0,UNDO_LIMIT);setUndoCount(undoStack.current.length);await applySnap(snap);}
  async function applySnap(snap){tutEvRef.current=snap.tutEvents;setTutEvents(snap.tutEvents);avRef.current=snap.avvisi;setAvvisi(snap.avvisi);await fsSaveAvvisi(snap.avvisi);for(const[tId,ms]of Object.entries(snap.tutEvents))for(const[mk,evs]of Object.entries(ms))await fsSaveTutEvents(tId,mk,evs);}

  useEffect(()=>{
    fsLoad().then(({avvisi:a,tutors:t,tutEvents:te,settings:s,anagraficaAv:an})=>{setAvvisi(a);avRef.current=a;setAnagraficaAv(an);anaRef.current=an;setTutors(t);setTutEvents(te);tutEvRef.current=te;setSettings(s);setActiveAvvisi(new Set(a.map(x=>x.id)));
      if(s.theme)setTheme(s.theme);
      if(s.accentColor&&/^#[0-9A-Fa-f]{6}$/.test(s.accentColor)){document.documentElement.style.setProperty("--accent",s.accentColor);document.documentElement.style.setProperty("--accent-strong",darkenHex(s.accentColor,.15));document.documentElement.style.setProperty("--accent-soft",hexToRgba(s.accentColor,.12));}
      if(s.brandNavy&&/^#[0-9A-Fa-f]{6}$/.test(s.brandNavy))document.documentElement.style.setProperty("--brand-navy",s.brandNavy);
      if(s.bgColor&&/^#[0-9A-Fa-f]{6}$/.test(s.bgColor))document.documentElement.style.setProperty("--bg",s.bgColor);
      if(s.defaultZoom!=null)setZoomIdx(s.defaultZoom);
      if(s.defaultCalView)setCalView(s.defaultCalView);
      if(s.density)document.documentElement.setAttribute("data-density",s.density);
      if(s.appSubtitle){setAppSubtitle(s.appSubtitle);const el=document.getElementById("login-subtitle-text");if(el)el.textContent=s.appSubtitle;}
      if(s.logoBase64){localStorage.setItem("logoBase64",s.logoBase64);applyFavicon(s.logoBase64);}
      setLoading(false);});
    db.collection("authorizedEmails").doc(user.email.toLowerCase()).get().then(snap=>{if(snap.exists)setRole(snap.data().role||"user");}).catch(()=>{});
  },[]);

  useEffect(()=>{function h(e){if(monthPickerRef.current&&!monthPickerRef.current.contains(e.target))setShowMonthPicker(false);}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  useEffect(()=>{const m=MONTHS[monthIdx];const now=new Date();if(m.year===now.getFullYear()&&m.month===now.getMonth()){const d=new Date(now);const dow=d.getDay()||7;d.setDate(d.getDate()-(dow-1));setWeekStart(d);}else{const fd=new Date(m.year,m.month,1);const dow=fd.getDay()||7;const mon=new Date(fd);mon.setDate(fd.getDate()-(dow-1));setWeekStart(new Date(mon));}},[monthIdx]);
  useEffect(()=>{if(activeScreen==="calendar")setView("tutoraggio");},[activeScreen]);
  useEffect(()=>{if(!highlightEvId)return;const t=setTimeout(()=>{const el=document.querySelector(`[data-ev-id="${highlightEvId}"]`);if(el)el.scrollIntoView({behavior:"smooth",block:"center",inline:"center"});},200);return()=>clearTimeout(t);},[highlightEvId]);

  window.__restoreBackup=async(data)=>{
    const v=data.version||0;
    if(v>5)console.warn(`Backup v${v} più recente di v5 — ripristino base.`);
    const a=data.avvisi||[],t=data.tutors||[],te=data.tutEvents||{},an=data.anagraficaAv||[];
    setAvvisi(a);avRef.current=a;setAnagraficaAv(an);anaRef.current=an;setTutors(t);setTutEvents(te);tutEvRef.current=te;setActiveAvvisi(new Set(a.map(x=>x.id)));setActiveTutorIds(null);
    await fsSaveAvvisi(a);await fsSaveTutors(t);await fsSaveAna(an);
    for(const[tId,ms]of Object.entries(te))for(const[mk,evs]of Object.entries(ms))await fsSaveTutEvents(tId,mk,evs);
    if(data.settings&&typeof data.settings==="object"){const s={...settings,...data.settings};setSettings(s);await fsSaveSettings(s);}
    if(isSuperAdmin&&data.authorizedEmails&&typeof data.authorizedEmails==="object"){const b=db.batch();for(const[email,rd]of Object.entries(data.authorizedEmails))b.set(db.collection("authorizedEmails").doc(email),rd,{merge:true});await b.commit();}
    if((isSuperAdmin||isAdmin)&&data.userProfiles&&typeof data.userProfiles==="object"){const b=db.batch();for(const[uid,p]of Object.entries(data.userProfiles))b.set(db.collection("userProfiles").doc(uid),p,{merge:true});await b.commit();}
  };
  window.__loadDemo=async()=>{
    const nT=Math.max(tutors.length,3),nA=Math.max(anagraficaAv.length,3);
    const DC=["#EC7A26","#3E6FB8","#2F8F5B","#9B59B6","#E74C3C","#1ABC9C","#F39C12","#34495E"];
    const DN=[["Mario","Rossi"],["Laura","Bianchi"],["Giuseppe","Verdi"],["Anna","Ferrari"],["Luca","Esposito"],["Sara","Romano"],["Marco","Colombo"],["Elena","Ricci"]];
    const T=Array.from({length:nT},(_,i)=>({id:`td${i}`,nome:DN[i%DN.length][0],cognome:DN[i%DN.length][1],cf:"",azienda:"Ente Demo Srl",color:DC[i%DC.length]}));
    const AN=Array.from({length:nA},(_,i)=>({id:`avd${i}`,nome:`Avviso ${i+1}`,codice:`DDG ${String(i+1).padStart(3,"0")}/2026`,colore:DC[(i+2)%DC.length],durataOre:400,stato:"In corso",dataInizio:"01/01/2026",dataFine:"31/12/2026",note:""}));
    const WD=[6,13,20,27];
    const SLOTS=[[9,13],[14,18]];
    const allMks=MONTHS.filter(m=>m.year===2026).map(m=>m.key);
    // Each avviso gets 2 sessions/month on 2 rotating anchor days.
    // Slot: even avviso index → morning, odd → afternoon.
    // Adjacent avvisi use different days → max 2 avvisi per slot per day (for nA≤8), never 3.
    let aei=0;
    const AV=AN.map((an,ai)=>{
      const[s,e]=SLOTS[ai%2];
      const d0=WD[ai%4],d1=WD[(ai+1)%4];
      return{id:an.id,events:allMks.flatMap((mk,mi)=>[
        {id:`ave-${ai}-${mi}-0-${aei++}`,month:mk,day:d0,start:s,end:e,ore:e-s},
        {id:`ave-${ai}-${mi}-1-${aei++}`,month:mk,day:d1,start:s,end:e,ore:e-s},
      ])};
    });
    // 1 primary tutor per (avviso, month, session), rotated by (ai+mi+si)%nT.
    // ~3% intentional sovrapposizione: a second tutor on same avviso+day+slot.
    let ctr=0;const te={};
    T.forEach(t=>{te[t.id]={};});
    allMks.forEach((mk,mi)=>{
      AN.forEach((an,ai)=>{
        const[s,e]=SLOTS[ai%2];
        [[WD[ai%4],0],[WD[(ai+1)%4],1]].forEach(([d,si])=>{
          const pTi=(ai+mi+si)%nT;
          const pT=T[pTi];
          if(!te[pT.id][mk])te[pT.id][mk]=[];
          te[pT.id][mk].push({id:`tev-${ai}-${mi}-${si}-${ctr++}`,name:an.nome,day:d,start:s,end:e,ore:e-s,tutorId:pT.id});
          if((ai*2+si+mi*3)%33===0){
            const sT=T[(pTi+1)%nT];
            if(!te[sT.id][mk])te[sT.id][mk]=[];
            te[sT.id][mk].push({id:`tev-${ai}-${mi}-${si}-ov-${ctr++}`,name:an.nome,day:d,start:s,end:e,ore:e-s,tutorId:sT.id});
          }
        });
      });
    });
    setTutors(T);setAnagraficaAv(AN);anaRef.current=AN;setAvvisi(AV);avRef.current=AV;setTutEvents(te);tutEvRef.current=te;setActiveAvvisi(new Set(AV.map(x=>x.id)));setActiveTutorIds(null);
    await fsSaveTutors(T);await fsSaveAna(AN);await fsSaveAvvisi(AV);
    for(const[tId,ms]of Object.entries(te))for(const[mk,evs]of Object.entries(ms))await fsSaveTutEvents(tId,mk,evs);
  };
  window.__clearDb=async()=>{
    setTutors([]);setAvvisi([]);avRef.current=[];setAnagraficaAv([]);anaRef.current=[];setTutEvents({});tutEvRef.current={};setSettings({});setActiveAvvisi(new Set());setActiveTutorIds(null);
    await fsClearAll();
    try{const s=await db.collection("activityLog").get();const b=db.batch();s.docs.forEach(d=>b.delete(d.ref));await b.commit();}catch(e){}
  };

  function getVisibleDays(){if(calView==="month")return Array.from({length:month.days},(_,i)=>i+1);if(calView==="week"&&weekStart){const m=MONTHS[monthIdx];const days=[];for(let i=0;i<7;i++){const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);if(d.getMonth()===m.month&&d.getDate()>=1&&d.getDate()<=m.days)days.push(d.getDate());}return days.length?days:Array.from({length:month.days},(_,i)=>i+1);}return Array.from({length:month.days},(_,i)=>i+1);}
  function navWeek(dir){setWeekStart(prev=>{const m=MONTHS[monthIdx];const d=new Date(prev);d.setDate(d.getDate()+dir*7);const f=new Date(m.year,m.month,1),fd=f.getDay()||7;const fmon=new Date(f);fmon.setDate(f.getDate()-(fd-1));const l=new Date(m.year,m.month,m.days),ld=l.getDay()||7;const lmon=new Date(l);lmon.setDate(l.getDate()-(ld-1));if(d<fmon)return fmon;if(d>lmon)return lmon;return d;});}
  const vdays=getVisibleDays();

  const allTEvs=tutors.flatMap(t=>(tutEvents[t.id]?.[month.key])||[]);
  const visTEvs=activeTutorIds===null?allTEvs:allTEvs.filter(e=>activeTutorIds.has(e.tutorId));
  const avNamesInMonth=new Set(allTEvs.map(e=>e.name));
  const avForBar=anagraficaAv.filter(a=>avNamesInMonth.has(a.nome));
  const dayTOre={};for(const ev of visTEvs)dayTOre[ev.day]=(dayTOre[ev.day]||0)+ev.ore;
  const totTOre=visTEvs.reduce((a,e)=>a+e.ore,0);
  const avById2={};avvisi.forEach(av=>avById2[av.id]=av);
  const avEvs=anagraficaAv.flatMap(ana=>{const av=avById2[ana.id];if(!av)return[];return av.events.filter(e=>e.month===month.key).map(e=>({...e,avvisoId:ana.id,avvisoName:ana.nome,avColor:ana.colore||"var(--accent)"}));});
  const avThisMonth=anagraficaAv.filter(a=>{const av=avById2[a.id];return av&&av.events.some(e=>e.month===month.key);});
  const visAvEvs=avEvs.filter(e=>activeAvvisi.has(e.avvisoId));
  const totAvOre=visAvEvs.reduce((a,e)=>a+e.ore,0);

  const getTCol=id=>tutors.find(x=>x.id===id)?.color||"var(--accent)";
  const getTLbl=id=>{const t=tutors.find(x=>x.id===id);return t?`${t.cognome} ${t.nome}`.trim():"";};
  function buildTByDay(){const b={};for(const ev of visTEvs){if(!b[ev.day])b[ev.day]=[];b[ev.day].push({...ev,_color:getTCol(ev.tutorId),_tutorLabel:getTLbl(ev.tutorId),_onEdit:canEdit?()=>setModal({type:"edit-tut",ev,monthKey:month.key}):null,_onClick:null});}return b;}
  function buildOvByDay(){const b={};for(const ev of avEvs){if(!b[ev.day])b[ev.day]=[];b[ev.day].push(ev);}return b;}
  function buildAvByDay(){const b={};for(const ev of visAvEvs){if(!b[ev.day])b[ev.day]=[];b[ev.day].push({...ev,_onEdit:canEdit?()=>{const av=avRef.current.find(a=>a.id===ev.avvisoId);setModal({type:"edit-av",avviso:av||{id:ev.avvisoId},ev,monthKey:month.key});}:null});}return b;}
  function buildMTByDay(){const b={};for(const ev of visTEvs){if(!b[ev.day])b[ev.day]=[];b[ev.day].push({...ev,_color:getTCol(ev.tutorId)});}return b;}
  function buildMAvByDay(){const b={};for(const ev of visAvEvs){if(!b[ev.day])b[ev.day]=[];b[ev.day].push(ev);}return b;}

  function handleGridClick(d,e){if(!canEdit)return;const rect=e.currentTarget.getBoundingClientRect();const s=Math.min(Math.max(Math.round((8+(e.clientY-rect.top)/slotH)*4)/4,8),19.75);setModal({type:"add",mode:view,prefill:{day:d,start:s,end:Math.min(s+1,20)}});}
  function toggleAv(id){setActiveAvvisi(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});}
  function toggleTut(id){setActiveTutorIds(p=>{const all=new Set(tutors.map(t=>t.id));const base=p===null?new Set(all):new Set(p);base.has(id)?base.delete(id):base.add(id);return base.size===all.size?null:base;});}

  async function addTutoraggio(ev,monthKey){pushUndo(tutEvRef.current,avRef.current);const mk=monthKey||month.key,id=`tut-${Date.now()}`,tId=ev.tutorId;const cur=tutEvRef.current;const upd={...cur,[tId]:{...(cur[tId]||{}),[mk]:[...((cur[tId]||{})[mk]||[]),{...ev,id}]}};tutEvRef.current=upd;setTutEvents(upd);await fsSaveTutEvents(tId,mk,upd[tId][mk]);fsLog(user.email,"add_tut",`Aggiunto slot "${ev.name}" il ${ev.day} ${mk}`);}
  async function editTutoraggio(evId,updated){pushUndo(tutEvRef.current,avRef.current);const cur=JSON.parse(JSON.stringify(tutEvRef.current));for(const[tid,months]of Object.entries(cur)){for(const[mk,evs]of Object.entries(months)){const idx=evs.findIndex(e=>e.id===evId);if(idx>=0){const old=evs[idx];cur[tid][mk][idx]={...old,...updated};tutEvRef.current=cur;setTutEvents(cur);await fsSaveTutEvents(tid,mk,cur[tid][mk]);fsLog(user.email,"edit_tut",`Modificato slot`);return;}}}}
  async function deleteTutoraggio(evId){pushUndo(tutEvRef.current,avRef.current);const cur=JSON.parse(JSON.stringify(tutEvRef.current));for(const[tid,months]of Object.entries(cur)){for(const[mk,evs]of Object.entries(months)){const ev=evs.find(e=>e.id===evId);if(ev){cur[tid][mk]=evs.filter(e=>e.id!==evId);tutEvRef.current=cur;setTutEvents(cur);await fsSaveTutEvents(tid,mk,cur[tid][mk]);fsLog(user.email,"delete_tut",`Eliminato slot "${ev.name}"`);return;}}}}
  async function addAvviso({existingId,name,color,month:mk,day,start,end,ore,events,id:newId}){pushUndo(tutEvRef.current,avRef.current);const avId=existingId||newId||`av-${Date.now()}`;if(events&&events.length>0){const existing=avRef.current.find(a=>a.id===avId);const upd=existing?avRef.current.map(a=>a.id===avId?{...a,events:[...a.events,...events]}:a):[...avRef.current,{id:avId,events}];avRef.current=upd;setAvvisi(upd);setActiveAvvisi(p=>new Set([...p,avId]));await fsSaveAvvisi(upd);fsLog(user.email,"add_av",`Importati ${events.length} slot`);return;}const evData={id:`ave-${Date.now()}`,month:mk,day,start,end,ore};const existing=avRef.current.find(a=>a.id===avId);let upd;if(existing)upd=avRef.current.map(a=>a.id===avId?{...a,events:[...a.events,evData]}:a);else{upd=[...avRef.current,{id:avId,events:[evData]}];setActiveAvvisi(p=>new Set([...p,avId]));}avRef.current=upd;setAvvisi(upd);await fsSaveAvvisi(upd);fsLog(user.email,"add_av",`Aggiunto slot "${name||avId}" il ${day} ${mk}`);}
  async function editAvviso(avId,evId,evData){pushUndo(tutEvRef.current,avRef.current);const upd=avRef.current.map(av=>av.id!==avId?av:{...av,events:av.events.map(e=>e.id===evId?{...e,...evData}:e)});avRef.current=upd;setAvvisi(upd);await fsSaveAvvisi(upd);fsLog(user.email,"edit_av",`Modificato slot`);}
  async function deleteAvviso(avId,evId){pushUndo(tutEvRef.current,avRef.current);const upd=avRef.current.map(av=>av.id!==avId?av:{...av,events:av.events.filter(e=>e.id!==evId)});avRef.current=upd;setAvvisi(upd);await fsSaveAvvisi(upd);fsLog(user.email,"delete_av",`Eliminato slot`);}

  async function handleSaveTutor(newList,action,tutor){setTutors(newList);setActiveTutorIds(null);await fsSaveTutors(newList);if(action==="add")fsLog(user.email,"add_tutor_ana",`Aggiunto tutor "${tutor.cognome} ${tutor.nome}"`);else if(action==="edit")fsLog(user.email,"edit_tutor_ana",`Modificato tutor "${tutor.cognome} ${tutor.nome}"`);else if(action==="delete")fsLog(user.email,"delete_tutor_ana",`Eliminato tutor "${tutor.cognome} ${tutor.nome}"`);}
  async function handleSaveAna(newList,action,item){
    if(action==="edit"){const old=anaRef.current.find(p=>p.id===item.id);if(old&&old.nome!==item.nome){const cur=JSON.parse(JSON.stringify(tutEvRef.current));let changed=false;for(const[tid,months]of Object.entries(cur)){for(const[mk,evs]of Object.entries(months)){evs.forEach((ev,i)=>{if(ev.name===old.nome){cur[tid][mk][i]={...ev,name:item.nome};changed=true;}});}}if(changed){tutEvRef.current=cur;setTutEvents(cur);for(const[tid,months]of Object.entries(cur))for(const[mk,evs]of Object.entries(months))await fsSaveTutEvents(tid,mk,evs);}}}
    anaRef.current=newList;setAnagraficaAv(newList);await fsSaveAna(newList);if(action==="add")fsLog(user.email,"add_av_ana",`Aggiunto avviso "${item.nome}"`);else if(action==="edit")fsLog(user.email,"edit_av_ana",`Modificato avviso "${item.nome}"`);else if(action==="delete")fsLog(user.email,"delete_av_ana",`Eliminato avviso "${item.nome}"`);}
  async function handleSaveSettings(s){const m={...settings,...s};setSettings(m);if(s.appSubtitle!==undefined){setAppSubtitle(s.appSubtitle);const el=document.getElementById("login-subtitle-text");if(el)el.textContent=s.appSubtitle;}if(s.logoBase64)applyFavicon(s.logoBase64);await fsSaveSettings(m);}

  if(loading)return(<div className="app-shell">
    <div className="sidebar"><div className="sidebar-logo"><div className="skeleton" style={{width:32,height:32,borderRadius:8}}/><div style={{flex:1}}><div className="skeleton skeleton-text" style={{width:"60%"}}/><div className="skeleton skeleton-text" style={{width:"85%",height:8}}/></div></div>
      <div className="sidebar-nav">{[0,1,2].map(g=><div key={g} className="sidebar-group">{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:32,marginBottom:6,opacity:1-g*0.18}}/>)}</div>)}</div>
    </div>
    <div className="main-area">
      <div className="topbar"><div className="skeleton" style={{width:160,height:32}}/><div className="topbar-divider"/><div className="skeleton" style={{width:200,height:32}}/><div style={{flex:1}}/><div className="skeleton" style={{width:32,height:32,borderRadius:999}}/></div>
      <div style={{flex:1,padding:32,display:"flex",flexDirection:"column",gap:14}}>
        <div className="skeleton" style={{width:260,height:36}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{[0,1,2,3].map(i=><div key={i} className="skeleton skeleton-card"/>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginTop:8}}>{Array.from({length:21}).map((_,i)=><div key={i} className="skeleton" style={{height:64,opacity:1-Math.floor(i/7)*0.2}}/>)}</div>
      </div>
    </div>
  </div>);

  const userInitials=(user?.email||"").slice(0,2).toUpperCase();

  function navigateToError(monthKey,evId){if(monthKey){const idx=MONTHS.findIndex(m=>m.key===monthKey);if(idx>=0)setMonthIdx(idx);}if(evId){setHighlightEvId(evId);setTimeout(()=>setHighlightEvId(null),3100);}}

  function handleNavClick(id){
    if(id==="insights"){setShowInsights(true);return;}
    if(id==="verifica"){setActiveScreen("verifica");return;}
    if(id==="ai"){setShowAi(s=>!s);return;}
    setActiveScreen(id);
    if(id!=="calendar")setShowAi(false);
  }

  const sidebarW=sidebarCollapsed?64:248;
  const containerW=sidebarW+(showAi?320:0);
  return(<div className="app-shell">
    <div className="sidebar-container" style={{width:containerW,transition:"width .3s ease"}}>
    <aside className={`sidebar${sidebarCollapsed?" collapsed":""}`}>
      <div className="sidebar-logo">
        <img src={settings.logoBase64||"assets/appmark-color.png"} width="32" height="32" alt="TutorIA" style={{flexShrink:0,borderRadius:6}}/>
        {!sidebarCollapsed&&<div className="sidebar-logo-text"><span className="sidebar-logo-name">TutorIA</span><span className="sidebar-logo-sub">{appSubtitle||"EHT · Harmonic Innovation Group"}</span></div>}
      </div>
      <nav className="sidebar-nav">
        {NAV_GROUPS.map(({group,items})=>(
          <div key={group} className="sidebar-group">
            {!sidebarCollapsed&&<div className="sidebar-group-label">{group}</div>}
            {items.map(item=>(
              <button key={item.id} className={`sidebar-item${activeScreen===item.id?" active":""}${sidebarCollapsed?" collapsed-mode":""}`} onClick={()=>handleNavClick(item.id)} title={sidebarCollapsed?item.label:""}>
                {activeScreen===item.id&&<span style={{position:"absolute",left:0,top:8,bottom:8,width:3,background:"var(--accent)",borderRadius:"0 3px 3px 0"}}/>}
                <Icon name={item.icon} size={16} color={activeScreen===item.id?"var(--accent)":"var(--fg-subtle)"}/>
                {!sidebarCollapsed&&<span style={{color:activeScreen===item.id?"var(--fg)":"var(--fg-muted)"}}>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {!sidebarCollapsed&&(
          <div className="theme-toggle">
            <button className={`theme-btn${theme==="light"?" active":""}`} onClick={()=>setTheme("light")} style={{display:"flex",alignItems:"center",gap:5}}><Icon name="sun" size={12}/>Light</button>
            <button className={`theme-btn${theme==="dark"?" active":""}`} onClick={()=>setTheme("dark")} style={{display:"flex",alignItems:"center",gap:5}}><Icon name="moon" size={12}/>Dark</button>
          </div>
        )}
        <button className="collapse-btn" onClick={()=>setSidebarCollapsed(c=>!c)}>
          <Icon name={sidebarCollapsed?"chevRight":"chevLeft"} size={13}/>
          {!sidebarCollapsed&&"Riduci"}
        </button>
      </div>
    </aside>
    {showAi&&<AiPanel tutors={tutors} anagraficaAv={anagraficaAv} settings={settings} user={user} isSuperAdmin={isSuperAdmin} onAddTut={addTutoraggio} onAddAv={addAvviso} onSaveTutor={handleSaveTutor} onSaveAna={handleSaveAna} onOpenAnaTutors={()=>setActiveScreen("ana-tutors")} onOpenAnaAvvisi={()=>setActiveScreen("ana-avvisi")} onClose={()=>setShowAi(false)}/>}
    </div>

    <div className="main-area">
      {isCalendar&&(<div className="topbar">
        <div className="module-switch">
          <button className={`module-btn${view==="tutoraggio"?" active":""}`} onClick={()=>setView("tutoraggio")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="users" size={13} color={view==="tutoraggio"?"var(--accent)":"currentColor"}/>Tutoraggi</button>
          <button className={`module-btn${view==="avviso"?" active":""}`} onClick={()=>setView("avviso")} style={{display:"flex",alignItems:"center",gap:6}}><Icon name="briefcase" size={13} color={view==="avviso"?"var(--accent)":"currentColor"}/>Avvisi/Progetti</button>
        </div>
        <div className="month-nav">
          <button onClick={()=>setMonthIdx(i=>Math.max(0,i-1))} disabled={monthIdx===0} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="chevLeft" size={14}/></button>
          <div ref={monthPickerRef} style={{position:"relative"}}>
            <button onClick={()=>setShowMonthPicker(o=>!o)} className="btn month-btn" data-variant="outline" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="calendar" size={13} color="var(--accent)"/>{month.label}<Icon name="chevDown" size={12} color="var(--fg-subtle)"/></button>
            {showMonthPicker&&<MonthPicker monthIdx={monthIdx} onChange={idx=>{setMonthIdx(idx);}} onClose={()=>setShowMonthPicker(false)}/>}
          </div>
          <button onClick={()=>setMonthIdx(i=>Math.min(MONTHS.length-1,i+1))} disabled={monthIdx===MONTHS.length-1} className="btn" data-variant="ghost" data-size="icon-sm"><Icon name="chevRight" size={14}/></button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {calView==="week"&&<button onClick={()=>navWeek(-1)} className="btn" data-variant="ghost" data-size="icon-sm" title="Settimana precedente"><Icon name="chevLeft" size={14}/></button>}
          <div className="tab-strip">
            <button className={`tab-strip-btn${calView==="day"?" active":""}`} onClick={()=>setCalView("day")}>Giorno</button>
            <button className={`tab-strip-btn${calView==="week"?" active":""}`} onClick={()=>setCalView("week")}>Sett.</button>
            <button className={`tab-strip-btn${calView==="month"?" active":""}`} onClick={()=>setCalView("month")}>Mese</button>
          </div>
          {calView==="week"&&<button onClick={()=>navWeek(+1)} className="btn" data-variant="ghost" data-size="icon-sm" title="Settimana successiva"><Icon name="chevRight" size={14}/></button>}
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>{activeScreen==="verifica"?setActiveScreen("calendar"):setActiveScreen("verifica");}} className="btn" data-variant={activeScreen==="verifica"?"accent":"ghost"} data-size="icon-sm" title="Verifica coerenza"><Icon name="shieldCheck" size={15} color={activeScreen==="verifica"?"#fff":"currentColor"}/></button>
        {canEdit&&<>
          <button onClick={handleUndo} disabled={!undoCount} className="btn" data-variant="ghost" data-size="icon-sm" title={undoCount?`Annulla — ${undoCount} modifica${undoCount!==1?"he":""} disponibil${undoCount!==1?"i":"e"}`:"Nessuna modifica da annullare"}><Icon name="undo" size={15}/></button>
          <button onClick={handleRedo} disabled={!redoCount} className="btn" data-variant="ghost" data-size="icon-sm" title={redoCount?`Ripristina — ${redoCount} modifica${redoCount!==1?"he":""} disponibil${redoCount!==1?"i":"e"}`:"Nessuna modifica da ripristinare"}><Icon name="redo" size={15}/></button>
        </>}
        <div className="topbar-divider"/>
        {!isViewer&&<div className="tab-strip">
          <button className="tab-strip-btn" style={{background:!editMode?"var(--accent)":"transparent",color:!editMode?"#fff":"var(--fg-muted)",display:"flex",alignItems:"center",gap:5}} onClick={()=>{setEditMode(false);setShowAi(false);}}><Icon name="eye" size={12} color={!editMode?"#fff":"currentColor"}/>Visualizza</button>
          <button className="tab-strip-btn" style={{background:editMode?"var(--accent)":"transparent",color:editMode?"#fff":"var(--fg-muted)",display:"flex",alignItems:"center",gap:5}} onClick={()=>setEditMode(true)}><Icon name="edit" size={12} color={editMode?"#fff":"currentColor"}/>Modifica</button>
        </div>}
        {canEdit&&<button onClick={()=>setModal({type:"add",mode:view,prefill:{day:1,start:9,end:10}})} className="btn" data-variant="accent" data-size="sm" style={{display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={13} color="#fff"/>Aggiungi</button>}
        <div className="topbar-divider"/>
        <div ref={avatarRef} style={{position:"relative"}}>
          <div className="user-avatar" title="Account" onClick={()=>setShowAvatarMenu(o=>!o)}>{userInitials}</div>
          {showAvatarMenu&&<div className="avatar-dropdown">
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--divider)"}}>
              <div className="user-avatar" style={{cursor:"default",flexShrink:0}}>{userInitials}</div>
              <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:"var(--fg)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.displayName||userInitials}</div><div style={{fontSize:11,color:"var(--fg-subtle)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.email}</div></div>
            </div>
            <div className="avatar-dropdown-sep"/>
            <button className="avatar-dropdown-item" onClick={()=>{setShowAvatarMenu(false);if(isAdmin){setProfileTarget(user.email);setActiveScreen("settings");}else setShowProfileModal(true);}}><Icon name="user" size={14} color="var(--fg-muted)"/>Profilo</button>
            <div className="avatar-dropdown-sep"/>
            <button className="avatar-dropdown-item" onClick={()=>{setShowAvatarMenu(false);if(confirm("Disconnettersi dall'applicazione?"))firebase.auth().signOut();}} style={{color:"var(--danger)"}}><Icon name="logout" size={14} color="var(--danger)"/>Disconnetti</button>
          </div>}
        </div>
      </div>)}

      {!isCalendar&&(<div className="topbar" style={{justifyContent:"flex-end"}}>
        <div style={{flex:1}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}><span style={{fontSize:11,color:"var(--fg-muted)"}}>{user?.email}</span><span style={{fontSize:10,fontWeight:700,color:ROLE_COLOR[role]||"var(--fg-subtle)",display:"flex",alignItems:"center",gap:3}}><Icon name={ROLE_ICON[role]||"user"} size={10} color={ROLE_COLOR[role]||"var(--fg-subtle)"}/>{ROLE_LABEL[role]||role}</span></div>
        <div ref={avatarRef} style={{position:"relative"}}>
          <div className="user-avatar" title="Account" onClick={()=>setShowAvatarMenu(o=>!o)}>{userInitials}</div>
          {showAvatarMenu&&<div className="avatar-dropdown">
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--divider)"}}>
              <div className="user-avatar" style={{cursor:"default",flexShrink:0}}>{userInitials}</div>
              <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:"var(--fg)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.displayName||userInitials}</div><div style={{fontSize:11,color:"var(--fg-subtle)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.email}</div></div>
            </div>
            <div className="avatar-dropdown-sep"/>
            <button className="avatar-dropdown-item" onClick={()=>{setShowAvatarMenu(false);if(isAdmin){setProfileTarget(user.email);setActiveScreen("settings");}else setShowProfileModal(true);}}><Icon name="user" size={14} color="var(--fg-muted)"/>Profilo</button>
            <div className="avatar-dropdown-sep"/>
            <button className="avatar-dropdown-item" onClick={()=>{setShowAvatarMenu(false);if(confirm("Disconnettersi dall'applicazione?"))firebase.auth().signOut();}} style={{color:"var(--danger)"}}><Icon name="logout" size={14} color="var(--danger)"/>Disconnetti</button>
          </div>}
        </div>
      </div>)}

      {isCalendar&&!editMode&&!isViewer&&<div className="edit-mode-banner">Sei in modalità{" "}<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"1px 8px",borderRadius:100,background:"var(--bg-sunken)",border:"1px solid var(--border)",color:"var(--fg-muted)",fontSize:11,fontWeight:500}}><Icon name="eye" size={11}/>Visualizza</span>{" "}— passa a{" "}<button onClick={()=>setEditMode(true)} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,padding:"1px 8px",borderRadius:100,background:"var(--accent)",border:"none",color:"#fff",fontSize:11,fontWeight:500}}><Icon name="edit" size={11} color="#fff"/>Modifica</button>{" "}per apportare modifiche.</div>}

      {isCalendar&&view==="tutoraggio"&&(<div className="filterbar">
        <div className="ore-display"><Icon name="clock" size={16} color="var(--accent)"/><div><div className="ore-value">{fmtOreMin(totTOre)}</div><div className="ore-label">Ore mese</div></div></div>
        <div className="filterbar-divider"/>
        <span style={{fontSize:10.5,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Tutor</span>
        {tutors.length===0?<span style={{fontSize:11,color:"var(--fg-faint)",fontStyle:"italic"}}>Nessun tutor</span>:[...tutors].sort((a,b)=>a.cognome.localeCompare(b.cognome)).map(t=>{const active=activeTutorIds===null||activeTutorIds.has(t.id),col=t.color||"var(--accent)";const hex=col.startsWith("#")?col:"#4f86c6";return<button key={t.id} onClick={()=>toggleTut(t.id)} className="tutor-chip" style={{border:`1px solid ${active?col:"var(--border)"}`,background:active?hexToRgba(hex,.12):"transparent",color:active?"var(--fg)":"var(--fg-muted)",opacity:active?1:.5}}><span className="tutor-chip-dot" style={{background:active?col:"var(--bg-sunken)"}}>{t.cognome[0]||""}</span>{t.cognome||t.nome}</button>;})}
        <div className="filterbar-divider"/>
        <button onClick={()=>setShowOvr(o=>!o)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:100,border:`1.5px solid ${showOvr?"var(--accent)":"var(--border)"}`,background:showOvr?"var(--accent)":"transparent",color:showOvr?"#fff":"var(--fg-muted)",fontSize:11.5,fontWeight:600,cursor:"pointer"}}>
          <Icon name={showOvr?"eyeOff":"eye"} size={13} color={showOvr?"#fff":"currentColor"}/>{showOvr?"Nascondi avvisi":"Mostra avvisi"}
        </button>
        {avForBar.length>0&&<><div className="filterbar-divider"/><span style={{fontSize:10.5,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Avvisi</span>{avForBar.map(a=>{const hex=(a.colore||"#4f86c6").startsWith("#")?a.colore||"#4f86c6":"#4f86c6";return<span key={a.id} className="avviso-chip" style={{background:hexToRgba(hex,.12),border:`1px solid ${hexToRgba(hex,.4)}`,color:"var(--fg)"}}><span style={{width:8,height:8,borderRadius:2,background:a.colore||"var(--accent)"}}/>{a.nome}</span>;})}</>}
      </div>)}
      {isCalendar&&view==="avviso"&&(<div className="filterbar">
        <div className="ore-display"><Icon name="clock" size={16} color="var(--accent)"/><div><div className="ore-value">{fmtOreMin(totAvOre)}</div><div className="ore-label">Ore mese</div></div></div>
        <div className="filterbar-divider"/>
        <span style={{fontSize:10.5,fontWeight:700,color:"var(--fg-subtle)",textTransform:"uppercase",letterSpacing:".06em"}}>Avvisi</span>
        {avThisMonth.length===0?<span style={{fontSize:11,color:"var(--fg-faint)",fontStyle:"italic"}}>Nessuno</span>:avThisMonth.map(a=>{const active=activeAvvisi.has(a.id);const hex=(a.colore||"#4f86c6").startsWith("#")?a.colore||"#4f86c6":"#4f86c6";return<button key={a.id} onClick={()=>toggleAv(a.id)} className="avviso-chip" style={{border:`1.5px solid ${hexToRgba(hex,active?.8:.3)}`,background:active?hexToRgba(hex,.12):"transparent",color:active?"var(--fg)":"var(--fg-muted)"}}><span style={{width:8,height:8,borderRadius:2,background:a.colore||"var(--accent)"}}/>{a.nome}</button>;})}
      </div>)}

      <div className="screen-area" style={showVerificaPanel?{flexDirection:"row"}:{}}>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {isCalendar&&calView==="month"&&<MonthView month={month} tutByDay={view==="tutoraggio"?buildMTByDay():null} avByDay={view==="avviso"?buildMAvByDay():null} onDayClick={canEdit?d=>setModal({type:"add",mode:view,prefill:{day:d,start:9,end:10}}):null}/>}
        {isCalendar&&calView!=="month"&&<CalendarGrid days={vdays} monthData={month} tutByDay={view==="tutoraggio"?buildTByDay():null} avOverlayByDay={view==="tutoraggio"?buildOvByDay():null} avByDay={view==="avviso"?buildAvByDay():null} footerByDay={view==="tutoraggio"?Object.fromEntries(Object.entries(dayTOre).map(([d,o])=>[d,fmtOreMin(o)])):{}} overlayActive={showOvr} slotH={slotH} colW={colW} onGridClick={canEdit?handleGridClick:null} onTutDragEnd={canEdit?(evId,u)=>{const origEv=allTEvs.find(e=>e.id===evId);editTutoraggio(evId,u);if(origEv){const avName=origEv.name;const newDay=u.day??origEv.day;const avDay=avEvs.find(a=>a.avvisoName===avName&&a.day===newDay);let warn=null;if(newDay!==origEv.day&&!avDay)warn=`Slot spostato fuori dal giorno previsto — verrà segnalato in Verifica`;else if((u.start??origEv.start)<avDay.start||(u.end??origEv.end)>avDay.end)warn=`Fuori orario: "${avName}" è ${fmt(avDay.start)}–${fmt(avDay.end)}`;setDragWarn(warn);if(warn){clearTimeout(dragWarnTimerRef.current);dragWarnTimerRef.current=setTimeout(()=>setDragWarn(null),5000);}}}:null} onAvDragEnd={canEdit?(avId,evId,u)=>editAvviso(avId,evId,{month:u.month||month.key,day:u.day,start:u.start,end:u.end,ore:u.ore||(u.end-u.start)}):null} highlightEvId={highlightEvId} onTutDragMove={canEdit?(ev,dd)=>{document.querySelectorAll('.day-col-drop-warning').forEach(el=>el.classList.remove('day-col-drop-warning'));if(dd!==0){const targetDay=ev.day+dd;const hasAvviso=avEvs.some(a=>a.avvisoName===ev.name&&a.day===targetDay);if(!hasAvviso){const col=document.getElementById(`day-col-${targetDay}`);if(col)col.classList.add('day-col-drop-warning');}}}:null}/>}
        {activeScreen==="ana-tutors"&&<AnaTutorsScreen tutors={tutors} tutEvents={tutEvents} anagraficaAv={anagraficaAv} onSaveTutor={handleSaveTutor} canEdit={!isViewer}/>}
        {activeScreen==="ana-avvisi"&&<AnaAvvisiScreen avvisi={avvisi} anagraficaAv={anagraficaAv} onSaveAna={handleSaveAna} canEdit={!isViewer}/>}
        {activeScreen==="settings"&&<SettingsScreen role={role} settings={settings} avvisi={avvisi} tutors={tutors} tutEvents={tutEvents} anagraficaAv={anagraficaAv} onSaveSettings={handleSaveSettings} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} isUser={isUser} theme={theme} setTheme={setTheme} currentUser={user} profileTarget={profileTarget}/>}
        </div>
        {showVerificaPanel&&<VerificaScreen avvisi={avvisi} tutors={tutors} tutEvents={tutEvents} anagraficaAv={anagraficaAv} onNavigateToError={navigateToError}/>}
      </div>

      {isCalendar&&<ZoomBar zoomIdx={zoomIdx} onZoomChange={setZoomIdx} onHelpOpen={()=>setShowHelp(o=>!o)}/>}
      {showHelp&&<HelpBot onClose={()=>setShowHelp(false)}/>}
      {isCalendar&&dragWarn&&<div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",zIndex:300,display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:"var(--radius-md)",background:"var(--warning-soft)",border:"1px solid var(--warning)",boxShadow:"var(--shadow-lg)",fontSize:13,color:"var(--fg)",maxWidth:520}}><Icon name="alert" size={15} color="var(--warning)"/><span style={{flex:1}}>{dragWarn}</span><button onClick={()=>setDragWarn(null)} style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",display:"flex",flexShrink:0}}><Icon name="x" size={13} color="var(--fg-muted)"/></button></div>}
    </div>

    {showInsights&&<InsightsScreen avvisi={avvisi} anagraficaAv={anagraficaAv} tutors={tutors} tutEvents={tutEvents} currentMonthKey={month.key} onClose={()=>setShowInsights(false)} onNavigate={(mk)=>{setShowInsights(false);const idx=MONTHS.findIndex(m=>m.key===mk);if(idx>=0){setMonthIdx(idx);setActiveScreen("calendar");}}}/>}
    {showProfileModal&&<ProfileModal user={user} onClose={()=>setShowProfileModal(false)}/>}
    {modal&&canEdit&&<AddModal mode={modal.mode||view} prefill={modal.prefill} currentMonthIdx={monthIdx} avvisi={avvisi} anagraficaAv={anagraficaAv} tutors={tutors} editTarget={modal.type==="edit-tut"?{type:"tutoraggio",ev:modal.ev}:modal.type==="edit-av"?{type:"avviso",avviso:modal.avviso,ev:modal.ev}:null} onAddTut={addTutoraggio} onEditTut={editTutoraggio} onDeleteTut={deleteTutoraggio} onAddAv={addAvviso} onEditAv={editAvviso} onDeleteAv={deleteAvviso} onClose={()=>setModal(null)} onOpenAnaTutors={()=>setActiveScreen("ana-tutors")} onOpenAnaAvvisi={()=>setActiveScreen("ana-avvisi")}/>}
  </div>);
}

window.__mountApp=(user)=>{const root=ReactDOM.createRoot(document.getElementById("root"));root.render(<App user={user}/>);};
