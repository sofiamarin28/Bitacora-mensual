import { useState, useEffect } from "react";

// ══════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════
const CATS = {
  salud:  { name: "Salud",   bg: "#C9F0DC", accent: "#3DAB6E", text: "#1B5E38" },
  belleza:{ name: "Belleza", bg: "#FFD6E8", accent: "#D87098", text: "#7A1840" },
  cocina: { name: "Cocina",  bg: "#FFE4CC", accent: "#F47C3C", text: "#7A3010" },
  casa:   { name: "Orden",   bg: "#D4DCFF", accent: "#6C7FD8", text: "#2A3580" },
  ropa:   { name: "Ropa",              bg: "#FFF3D6", accent: "#C9A227", text: "#6A5000" },
  gatas:  { name: "Gatas",             bg: "#FFE8C8", accent: "#E8943A", text: "#7A4010" },
};

const TASKS = [
  { id: "agua",   name: "Agua (3 botellas)",         cat: "salud",   freq: "daily" },
  { id: "eje",    name: "Ejercicio 30 min",           cat: "salud",   freq: "daily" },
  { id: "past",   name: "Pastillas",                  cat: "salud",   freq: "daily" },
  { id: "pelo",   name: "Lavar y secar pelo",         cat: "belleza", freq: "interval", n: 2, from: "2026-03-24" },
  { id: "depil",  name: "Depilarse",                  cat: "belleza", freq: "interval", n: 5, from: "2026-03-25" },
  { id: "cejas",  name: "Cejas y rostro",             cat: "belleza", freq: "interval", n: 7, from: "2026-03-25" },
  { id: "desa",   name: "Desayuno",                   cat: "cocina",  freq: "daily" },
  { id: "almu",   name: "Almuerzo",                   cat: "cocina",  freq: "daily" },
  { id: "cena",   name: "Cena",                       cat: "cocina",  freq: "daily" },
  { id: "ltras",  name: "Lavar trastes",              cat: "cocina",  freq: "daily" },
  { id: "stras",  name: "Secar trastes",              cat: "cocina",  freq: "daily" },
  { id: "gtras",  name: "Guardar trastes",            cat: "cocina",  freq: "daily" },
  { id: "lkitch", name: "Estufa, mostradores, mesa",  cat: "cocina",  freq: "daily" },
  { id: "frij",   name: "Hacer frijoles",             cat: "cocina",  freq: "dow", days: [3], from: "2026-03-25" },
  { id: "pinto",  name: "Hacer pinto",                cat: "cocina",  freq: "dow", days: [3], from: "2026-03-25" },
  { id: "cama",   name: "Tender la cama",             cat: "casa",    freq: "daily" },
  { id: "sillon", name: "Quitarle pelo al sillon",    cat: "casa",    freq: "interval", n: 2, from: "2026-03-24" },
  { id: "tonyA",  name: "Tony: aspirar",              cat: "casa",    freq: "daily" },
  { id: "tonyL",  name: "Tony: limpiar/trapear",      cat: "casa",    freq: "daily" },
  { id: "basura", name: "Sacar basura",               cat: "casa",    freq: "dow", days: [2, 5] },
  { id: "matas",  name: "Regar las matas",            cat: "casa",    freq: "interval", n: 3, from: "2026-03-24" },
  { id: "fundas", name: "Cambiar fundas de cama",     cat: "casa",    freq: "dow", days: [2] },
  { id: "bano",   name: "Limpiar el bano",            cat: "casa",    freq: "dow", days: [6] },
  { id: "lropa",  name: "Poner tanda a lavar",        cat: "ropa",    freq: "daily" },
  { id: "dropa",  name: "Doblar y guardar ropa",      cat: "ropa",    freq: "daily" },
  { id: "aren",   name: "Areneros y barrer espacio",   cat: "gatas",   freq: "daily" },
  { id: "aguag",  name: "Cambiar agua gatas",         cat: "gatas",   freq: "daily" },
];

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
const fmt  = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const toD  = s => new Date(s+"T12:00:00");
const add  = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const DAYS_S = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
const DAYS_M = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function applies(task, ds) {
  const d=toD(ds), dow=d.getDay();
  if (task.freq==="daily") return true;
  if (task.freq==="dow") { if (task.from && ds<task.from) return false; return task.days.includes(dow); }
  if (task.freq==="interval") { const diff=Math.round((d-toD(task.from))/86400000); return diff>=0 && diff%task.n===0; }
  return false;
}

const getTasks = ds => TASKS.filter(t => applies(t,ds));
const getRate  = (ds,c) => { const t=getTasks(ds); if (!t.length) return null; return t.filter(t=>c?.[ds]?.[t.id]).length/t.length; };
const wStart   = d => { const dow=d.getDay(); return add(d,dow===0?-6:1-dow); };
const mDays    = (y,m) => { const days=[],d=new Date(y,m,1); while(d.getMonth()===m){days.push(new Date(d));d.setDate(d.getDate()+1);} return days; };

const NAV_BTN = { background:"#F5F0EB", border:"none", borderRadius:10, width:34, height:34, cursor:"pointer", fontSize:20, color:"#AAA", fontFamily:"Nunito,sans-serif", display:"flex", alignItems:"center", justifyContent:"center" };

// ══════════════════════════════════════════════
//  RING
// ══════════════════════════════════════════════
const Ring = ({ rate, size=24 }) => {
  if (rate===null) return <div style={{width:size,height:size}} />;
  const r=size/2-2.5, c=2*Math.PI*r;
  const bg   = rate===1 ? "#C9F0DC" : rate>0 ? "#FFF3E0" : "#F5F0EB";
  const ring = rate===1 ? "#3DAB6E" : rate>0 ? "#FFB74D" : "#E0D8D0";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill={bg} stroke="#EEE8E0" strokeWidth={1.5}/>
      {rate>0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ring} strokeWidth={2.5} strokeDasharray={`${rate*c} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>}
    </svg>
  );
};

// ══════════════════════════════════════════════
//  DAY VIEW
// ══════════════════════════════════════════════
function DayView({ ds, comps, toggle, jc, onBack }) {
  const d=toD(ds), today=fmt(new Date()), isToday=ds===today;
  const tasks=getTasks(ds), doneN=tasks.filter(t=>comps?.[ds]?.[t.id]).length, prog=tasks.length?doneN/tasks.length:0;
  const byCat={};
  tasks.forEach(t=>{(byCat[t.cat]=byCat[t.cat]||[]).push(t);});
  const [coll,setColl]=useState({});

  return (
    <div className="fade-in" style={{paddingBottom:32}}>
      {onBack && <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#BBB",fontSize:12,fontWeight:700,fontFamily:"Nunito,sans-serif",marginBottom:10,display:"flex",alignItems:"center",gap:4,padding:0}}>&larr; volver</button>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#2D2926"}}>{isToday?"Hoy · ":""}{DAYS_S[d.getDay()]} {d.getDate()} de {MONTHS[d.getMonth()]}</div>
          <div style={{fontSize:12,color:"#BBB",fontWeight:600,marginTop:3}}>{doneN} de {tasks.length} completadas</div>
        </div>
        <Ring rate={prog} size={46}/>
      </div>

      {Object.entries(byCat).map(([catId,catTasks])=>{
        const cat=CATS[catId], catDone=catTasks.filter(t=>comps?.[ds]?.[t.id]).length, collapsed=coll[catId];
        return (
          <div key={catId} style={{background:"white",borderRadius:16,marginBottom:10,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
            <button onClick={()=>setColl(p=>({...p,[catId]:!p[catId]}))} style={{width:"100%",padding:"12px 16px",background:cat.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"Nunito,sans-serif"}}>
              <span style={{fontWeight:800,color:cat.text,fontSize:13,flex:1,textAlign:"left"}}>{cat.name}</span>
              <span style={{fontSize:11,fontWeight:800,color:cat.accent,background:"white",borderRadius:10,padding:"2px 10px"}}>{catDone}/{catTasks.length}</span>
              <span style={{color:cat.text,fontSize:10,opacity:0.4}}>{collapsed?"▼":"▲"}</span>
            </button>
            {!collapsed && catTasks.map((t,i)=>{
              const done=comps?.[ds]?.[t.id]||false, pop=jc===`${ds}-${t.id}`;
              return (
                <button key={t.id} onClick={()=>toggle(ds,t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:done?`${cat.bg}55`:"white",border:"none",borderBottom:i<catTasks.length-1?"1px solid #FAF7F4":"none",cursor:"pointer",fontFamily:"Nunito,sans-serif",textAlign:"left",transition:"background 0.2s"}}>
                  <span className={pop?"pop":""} style={{width:26,height:26,borderRadius:8,flexShrink:0,background:done?cat.accent:"white",border:done?"none":`2px solid ${cat.accent}50`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:done?`0 2px 8px ${cat.accent}45`:"none",fontSize:13,color:"white",transition:"all 0.15s ease"}}>{done?"✓":""}</span>
                  <span style={{fontSize:13,flex:1,fontWeight:done?700:500,color:done?cat.accent:"#555",textDecoration:done?"line-through":"none"}}>{t.name}</span>
                </button>
              );
            })}
          </div>
        );
      })}

      {tasks.length===0 && <div style={{textAlign:"center",padding:"50px 0",color:"#DDD"}}><div style={{fontSize:14,fontWeight:700}}>Dia libre</div></div>}
      {prog===1 && tasks.length>0 && (
        <div style={{background:"linear-gradient(135deg,#C9F0DC,#B5EACC)",borderRadius:16,padding:"20px 24px",textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:900,color:"#1B5E38"}}>Todo listo, Sofi!</div>
          <div style={{fontSize:13,color:"#3DAB6E",marginTop:4}}>Casa feliz, vida feliz</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  WEEK VIEW
// ══════════════════════════════════════════════
function WeekView({ todayStr, comps, toggle, jc }) {
  const [ws,setWs]=useState(()=>wStart(new Date()));
  const days=Array.from({length:7},(_,i)=>add(ws,i));
  const byCat={};
  TASKS.forEach(t=>{(byCat[t.cat]=byCat[t.cat]||[]).push(t);});
  const [coll,setColl]=useState({});

  return (
    <div className="fade-in" style={{paddingBottom:32}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={()=>setWs(d=>add(d,-7))} style={NAV_BTN}>‹</button>
        <span style={{fontSize:13,fontWeight:700,color:"#555"}}>{days[0].toLocaleDateString("es-CR",{day:"numeric",month:"short"})} – {days[6].toLocaleDateString("es-CR",{day:"numeric",month:"short",year:"numeric"})}</span>
        <button onClick={()=>setWs(d=>add(d,7))} style={NAV_BTN}>›</button>
      </div>

      <div style={{overflowX:"auto",borderRadius:16,border:"1px solid #F5F0EB"}}>
        <div style={{minWidth:560}}>
          <div style={{display:"grid",gridTemplateColumns:"140px repeat(7, 1fr)",background:"white",borderBottom:"1px solid #F5F0EB"}}>
            <div/>
            {days.map(d=>{
              const ds=fmt(d),isT=ds===todayStr;
              return (
                <div key={ds} style={{textAlign:"center",padding:"10px 4px"}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:isT?"#6C7FD8":"#CCC",letterSpacing:0.5}}>{DAYS_M[(d.getDay()+6)%7]}</div>
                  <div style={{width:26,height:26,borderRadius:"50%",margin:"3px auto 0",background:isT?"#6C7FD8":"transparent",fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",color:isT?"white":"#777"}}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {Object.entries(byCat).map(([catId,catTasks])=>{
            const cat=CATS[catId],collapsed=coll[catId];
            return (
              <div key={catId}>
                <button onClick={()=>setColl(p=>({...p,[catId]:!p[catId]}))} style={{width:"100%",padding:"8px 14px",background:cat.bg,border:"none",borderBottom:"1px solid rgba(255,255,255,0.6)",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"Nunito,sans-serif"}}>
                  <span style={{fontWeight:800,color:cat.text,fontSize:12,flex:1,textAlign:"left"}}>{cat.name}</span>
                  <span style={{color:cat.text,fontSize:10,opacity:0.4}}>{collapsed?"▼":"▲"}</span>
                </button>
                {!collapsed && catTasks.map(task=>(
                  <div key={task.id} style={{display:"grid",gridTemplateColumns:"140px repeat(7, 1fr)",background:"white",borderBottom:"1px solid #FAF7F4"}}>
                    <div style={{padding:"7px 14px",fontSize:11,fontWeight:600,color:"#AAA",display:"flex",alignItems:"center",borderRight:"1px solid #FAF7F4",overflow:"hidden"}}>
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.name}</span>
                    </div>
                    {days.map(d=>{
                      const ds=fmt(d),app=applies(task,ds),done=app&&(comps?.[ds]?.[task.id]||false),pop=jc===`${ds}-${task.id}`;
                      return (
                        <div key={ds} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:5}}>
                          {app ? (
                            <button className={pop?"pop":""} onClick={()=>toggle(ds,task.id)} style={{width:22,height:22,borderRadius:6,background:done?cat.accent:"white",border:done?"none":`1.5px solid ${cat.accent}40`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:done?`0 1px 5px ${cat.accent}40`:"none",fontSize:11,color:"white",fontFamily:"Nunito,sans-serif",transition:"all 0.12s"}}>{done?"✓":""}</button>
                          ) : (
                            <div style={{width:22,height:22,borderRadius:6,background:"#F8F5F2"}}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MONTH VIEW — habit tracker grid (filas=tareas, columnas=dias)
// ══════════════════════════════════════════════
function MonthView({ todayStr, comps, toggle, jc }) {
  const now=new Date();
  const [cur,setCur]=useState({y:now.getFullYear(),m:now.getMonth()});
  const days=mDays(cur.y,cur.m);
  const dayStrs=days.map(fmt);
  const byCat={};
  TASKS.forEach(t=>{(byCat[t.cat]=byCat[t.cat]||[]).push(t);});
  const [coll,setColl]=useState({});

  const prevM=()=>setCur(p=>p.m===0?{y:p.y-1,m:11}:{...p,m:p.m-1});
  const nextM=()=>setCur(p=>p.m===11?{y:p.y+1,m:0}:{...p,m:p.m+1});

  const CELL=26, LABEL=170;

  return (
    <div className="fade-in" style={{paddingBottom:40}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <button onClick={prevM} style={NAV_BTN}>‹</button>
        <span style={{fontSize:16,fontWeight:900,color:"#2D2926"}}>{MONTHS[cur.m]} {cur.y}</span>
        <button onClick={nextM} style={NAV_BTN}>›</button>
      </div>

      <div style={{overflowX:"auto",borderRadius:16,border:"1.5px solid #EDE8E3",background:"white",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
        <div style={{minWidth:LABEL+CELL*days.length}}>

          {/* Day header */}
          <div style={{display:"flex",borderBottom:"2px solid #EDE8E3",position:"sticky",top:0,background:"white",zIndex:10}}>
            <div style={{width:LABEL,minWidth:LABEL,padding:"10px 16px",fontSize:10,fontWeight:800,color:"#CCC",letterSpacing:1,textTransform:"uppercase",flexShrink:0,borderRight:"1.5px solid #EDE8E3"}}>Tarea</div>
            {days.map(d=>{
              const ds=fmt(d),isT=ds===todayStr,isFut=ds>todayStr,dow=d.getDay(),isW=dow===0||dow===6;
              return (
                <div key={ds} style={{width:CELL,minWidth:CELL,textAlign:"center",padding:"5px 0 4px",flexShrink:0,background:isT?"#EEF2FF":"transparent",borderLeft:"1px solid #F5F0EB"}}>
                  <div style={{fontSize:8,fontWeight:700,color:isT?"#6C7FD8":isW?"#B8AADD":"#CCC",letterSpacing:0.3,lineHeight:1.2}}>
                    {["D","L","M","X","J","V","S"][dow]}
                  </div>
                  <div style={{fontSize:10,fontWeight:isT?900:700,color:isT?"#6C7FD8":isFut?"#DDD":isW?"#9988CC":"#999",lineHeight:1.4}}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category rows */}
          {Object.entries(byCat).map(([catId,catTasks])=>{
            const cat=CATS[catId],collapsed=coll[catId];
            return (
              <div key={catId}>
                <button onClick={()=>setColl(p=>({...p,[catId]:!p[catId]}))} style={{width:"100%",display:"flex",alignItems:"center",padding:"6px 16px",background:cat.bg,border:"none",borderTop:"2px solid #EDE8E3",cursor:"pointer",fontFamily:"Nunito,sans-serif",gap:8}}>
                  <span style={{fontWeight:800,color:cat.text,fontSize:11,flex:1,textAlign:"left"}}>{cat.name}</span>
                  <span style={{fontSize:9,color:cat.text,opacity:0.4}}>{collapsed?"▼":"▲"}</span>
                </button>
                {!collapsed && catTasks.map((task,ti)=>(
                  <div key={task.id} style={{display:"flex",alignItems:"center",borderBottom:ti<catTasks.length-1?"1px solid #FAF7F4":"none",background:ti%2===0?"white":"#FDFCFB"}}>
                    <div style={{width:LABEL,minWidth:LABEL,padding:"5px 16px",fontSize:11,fontWeight:600,color:"#999",flexShrink:0,borderRight:"1.5px solid #EDE8E3",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                      {task.name}
                    </div>
                    {dayStrs.map((ds)=>{
                      const app=applies(task,ds),done=app&&(comps?.[ds]?.[task.id]||false),pop=jc===`${ds}-${task.id}`,isFut=ds>todayStr,isPast=ds<todayStr,isT=ds===todayStr;
                      return (
                        <div key={ds} style={{width:CELL,minWidth:CELL,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,borderLeft:"1px solid #F8F4F0",background:isT?"#EEF2FF18":"transparent"}}>
                          {isPast ? (
                            <div style={{width:16,height:16,borderRadius:4,background:done?cat.accent:"#EAE6E1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white"}}>{done?"✓":""}</div>
                          ) : app ? (
                            <button className={pop?"pop":""} onClick={()=>toggle(ds,task.id)}
                              style={{width:16,height:16,borderRadius:4,
                                background:done?cat.accent:isFut?"transparent":"white",
                                border:done?"none":isFut?`1.5px solid ${cat.accent}15`:`1.5px solid ${cat.accent}55`,
                                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                                boxShadow:done?`0 1px 4px ${cat.accent}40`:"none",
                                fontSize:9,color:"white",transition:"all 0.12s"}}
                            >{done?"✓":""}</button>
                          ) : (
                            <div style={{width:16,height:16,borderRadius:4,background:"#F2EEE9"}}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{display:"flex",gap:16,padding:"10px 16px",borderTop:"2px solid #EDE8E3",justifyContent:"flex-end"}}>
            {[["Completado","#3DAB6E","done"],["No aplica","#F2EEE9","na"],["Pendiente","white","pend"]].map(([label,bg,k])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#BBB",fontWeight:700}}>
                <div style={{width:12,height:12,borderRadius:3,background:bg,border:bg==="white"?"1.5px solid #CCC":"none"}}/>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  RESUMEN VIEW
// ══════════════════════════════════════════════
function ResumenView({ todayStr, comps }) {
  const today=toD(todayStr);
  let streak=0;
  for (let i=0;i<365;i++) { const ds=fmt(add(today,-i)),tasks=getTasks(ds); if (!tasks.length||!tasks.every(t=>comps?.[ds]?.[t.id])) break; streak++; }

  const ws=wStart(today),wDays=Array.from({length:7},(_,i)=>fmt(add(ws,i))),pastW=wDays.filter(ds=>ds<=todayStr);
  const weekAvg=pastW.length?pastW.reduce((s,ds)=>s+(getRate(ds,comps)||0),0)/pastW.length:0;

  const mdays=mDays(today.getFullYear(),today.getMonth()).map(fmt),pastM=mdays.filter(ds=>ds<=todayStr);
  const monthAvg=pastM.length?pastM.reduce((s,ds)=>s+(getRate(ds,comps)||0),0)/pastM.length:0;

  const last14=Array.from({length:14},(_,i)=>fmt(add(today,-13+i)));
  const taskStats=TASKS.map(task=>{
    const appDays=last14.filter(ds=>applies(task,ds));
    if (!appDays.length) return null;
    return {task,rate:appDays.filter(ds=>comps?.[ds]?.[task.id]).length/appDays.length};
  }).filter(Boolean).sort((a,b)=>b.rate-a.rate);

  const best=taskStats.slice(0,3),worst=taskStats.slice(-3).reverse();
  const DAY_L=["L","M","X","J","V","S","D"];

  return (
    <div className="fade-in" style={{paddingBottom:40}}>
      <div style={{fontSize:18,fontWeight:900,color:"#2D2926",marginBottom:18}}>Resumen</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:16}}>
        {[
          {label:"Racha",  val:streak?`${streak}d`:"–",color:"#E8820C",sub:"dias perfectos"},
          {label:"Semana", val:`${Math.round(weekAvg*100)}%`,color:"#6C7FD8",sub:`${pastW.length} dias`},
          {label:"Mes",    val:`${Math.round(monthAvg*100)}%`,color:"#3DAB6E",sub:`${pastM.length} dias`},
        ].map(s=>(
          <div key={s.label} style={{background:"white",borderRadius:14,padding:"14px 10px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
            <div style={{fontSize:12,fontWeight:700,color:"#555",marginTop:3}}>{s.label}</div>
            <div style={{fontSize:10,color:"#CCC",marginTop:1}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{background:"white",borderRadius:16,padding:"16px 18px",marginBottom:12,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#999",marginBottom:14}}>Esta semana</div>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
          {wDays.map((ds,i)=>{
            const isPast=ds<=todayStr,rate=isPast?(getRate(ds,comps)||0):0,isT=ds===todayStr;
            const barColor=isT?"#6C7FD8":rate===1?"#B5EAD7":rate>0.5?"#FFE8C8":rate>0?"#FFD6E8":"#F5F0EB";
            return (
              <div key={ds} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:"100%",height:68,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                  <div style={{width:"80%",height:isPast?Math.max(4,rate*68):4,background:barColor,borderRadius:"4px 4px 0 0",transition:"height 0.5s ease"}}/>
                </div>
                <div style={{fontSize:10,fontWeight:700,color:isT?"#6C7FD8":"#CCC"}}>{DAY_L[i]}</div>
                {isPast && <div style={{fontSize:9,color:"#BBB",fontWeight:700}}>{Math.round(rate*100)}%</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[
          {title:"Mas cumplidas",data:best,color:"#3DAB6E"},
          {title:"A mejorar",data:worst,color:"#F47C3C"},
        ].map(panel=>(
          <div key={panel.title} style={{background:"white",borderRadius:14,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:800,color:panel.color,marginBottom:12}}>{panel.title}</div>
            {panel.data.length===0 && <div style={{fontSize:11,color:"#DDD"}}>Sin datos aun</div>}
            {panel.data.map(s=>(
              <div key={s.task.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{flex:1,fontSize:11,fontWeight:600,color:"#777",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.task.name}</div>
                <div style={{fontSize:12,fontWeight:800,color:panel.color,flexShrink:0}}>{Math.round(s.rate*100)}%</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  APP
// ══════════════════════════════════════════════
export default function HomeTracker() {
  const todayStr=fmt(new Date());
  const [view,setView]=useState("dia");
  const [comps,setComps]=useState({});
  const [loaded,setLoaded]=useState(false);
  const [jc,setJc]=useState(null);

  useEffect(()=>{
    try { const r=localStorage.getItem("hogar_v2"); if(r) setComps(JSON.parse(r)); } catch{} setLoaded(true);
  },[]);

  useEffect(()=>{
    if (!loaded) return;
    try { localStorage.setItem("hogar_v2", JSON.stringify(comps)); } catch{}
  },[comps,loaded]);

  const toggle=(ds,id)=>{
    setComps(p=>({...p,[ds]:{...p[ds],[id]:!p[ds]?.[id]}}));
    setJc(`${ds}-${id}`);
    setTimeout(()=>setJc(null),450);
  };

  let streak=0;
  for (let i=0;i<365;i++){const ds=fmt(add(new Date(),-i)),tasks=getTasks(ds);if(!tasks.length||!tasks.every(t=>comps?.[ds]?.[t.id]))break;streak++;}

  const tTasks=getTasks(todayStr),tDone=tTasks.filter(t=>comps?.[todayStr]?.[t.id]).length,tProg=tTasks.length?tDone/tTasks.length:0;

  if (!loaded) return <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FBF8F5",fontFamily:"Nunito,sans-serif",color:"#CCC",fontSize:14,fontWeight:600}}>Cargando...</div>;

  return (
    <div style={{fontFamily:"'Nunito', sans-serif",minHeight:"100vh",background:"#FBF8F5"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .pop { animation: pop 0.35s ease; }
        @keyframes pop { 0%{transform:scale(1)} 40%{transform:scale(1.28)} 70%{transform:scale(0.88)} 100%{transform:scale(1)} }
        .fade-in { animation: fi 0.22s ease; }
        @keyframes fi { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:#E8E0D8; border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <div style={{background:"white",padding:"18px 20px 14px",borderBottom:"1px solid #F5F0EB",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 16px rgba(0,0,0,0.04)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:20,fontWeight:900,color:"#2D2926",letterSpacing:-0.5}}>Bitácora Mensual</div>
              <div style={{fontSize:11,color:"#CCC",fontWeight:600,marginTop:1}}>{new Date().toLocaleDateString("es-CR",{weekday:"long",day:"numeric",month:"long"})}</div>
            </div>
            {streak>0 && (
              <div style={{background:"#FFF4E0",border:"1.5px solid #FFD98A",borderRadius:20,padding:"5px 13px",display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:12,fontWeight:800,color:"#E8820C"}}>Racha: {streak} dia{streak!==1?"s":""}</span>
              </div>
            )}
          </div>

          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700,color:"#CCC",marginBottom:5}}>
              <span>{tDone}/{tTasks.length} tareas hoy</span>
              <span>{Math.round(tProg*100)}%</span>
            </div>
            <div style={{height:6,background:"#F5F0EB",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${tProg*100}%`,background:"linear-gradient(90deg,#B5EAD7,#5DCEA0)",borderRadius:3,transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)"}}/>
            </div>
          </div>

          <div style={{display:"flex",gap:5}}>
            {[["dia","Hoy"],["semana","Semana"],["mes","Mes"],["resumen","Resumen"]].map(([id,label])=>(
              <button key={id} onClick={()=>setView(id)} style={{padding:"6px 15px",borderRadius:20,border:"none",background:view===id?"#2D2926":"#F5F0EB",color:view===id?"white":"#AAA",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Nunito,sans-serif",transition:"all 0.15s"}}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}}>
        {view==="dia"     && <DayView     ds={todayStr} comps={comps} toggle={toggle} jc={jc}/>}
        {view==="semana"  && <WeekView    todayStr={todayStr} comps={comps} toggle={toggle} jc={jc}/>}
        {view==="mes"     && <MonthView   todayStr={todayStr} comps={comps} toggle={toggle} jc={jc}/>}
        {view==="resumen" && <ResumenView todayStr={todayStr} comps={comps}/>}
      </div>
    </div>
  );
}
