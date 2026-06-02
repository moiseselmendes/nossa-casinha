import { useState } from "react";

const fmt = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v??0);
const fmtDate = (d) => new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
const today = () => new Date().toISOString().split("T")[0];
const isEntrada = (t) => t.startsWith("guardado");
const isPayment = (t) => t.startsWith("pagamento");
const personOf  = (t) => t.endsWith("moises") ? "Moisés" : "Norrara";
const labelOf   = (t) => ({"guardado-moises":"💙 Guardado Moisés","guardado-norrara":"💜 Guardado Norrara","retirada-moises":"↙ Retirada Moisés","retirada-norrara":"↙ Retirada Norrara","pagamento-moises":"💳 Pagamento Moisés","pagamento-norrara":"💳 Pagamento Norrara"}[t]??t);
const colorOf   = (t) => isEntrada(t)?(personOf(t)==="Moisés"?"#2563eb":"#7c3aed"):isPayment(t)?"#d97706":"#dc2626";
const parseCurr = (s) => parseFloat(s.replace(/[^\d,]/g,"").replace(",","."))||0;

const DEFAULT_CATS_FIN = [
  {id:"doc",label:"Documentação Financiamento",color:"#6366f1",bg:"#eef2ff",border:"#c7d2fe",icon:"📄"},
  {id:"obra",label:"Entrada Obra",color:"#0284c7",bg:"#e0f2fe",border:"#bae6fd",icon:"🏗️"},
  {id:"construtora",label:"Construtora",color:"#2563eb",bg:"#eff6ff",border:"#bfdbfe",icon:"🏢"},
  {id:"terreno",label:"Terreno",color:"#059669",bg:"#ecfdf5",border:"#a7f3d0",icon:"🌍"},
];
const PRESET_COLORS=[
  {color:"#6366f1",bg:"#eef2ff",border:"#c7d2fe"},{color:"#0284c7",bg:"#e0f2fe",border:"#bae6fd"},
  {color:"#2563eb",bg:"#eff6ff",border:"#bfdbfe"},{color:"#059669",bg:"#ecfdf5",border:"#a7f3d0"},
  {color:"#d97706",bg:"#fffbeb",border:"#fde68a"},{color:"#dc2626",bg:"#fef2f2",border:"#fecaca"},
  {color:"#7c3aed",bg:"#faf5ff",border:"#e9d5ff"},{color:"#0891b2",bg:"#ecfeff",border:"#a5f3fc"},
];
const DEFAULT_CATS_LISTA={"Sala":"🛋️","Quarto":"🛏️","Cozinha":"🍳","Banheiro":"🚿","Área externa":"🌿","Eletrodoméstico":"⚡","Decoração":"🎨"};
const EMOJI_LISTA=["📦","🪑","🛁","🪞","🖼️","💡","🔧","🧺","🪴","🛒","🎁","🧸","🪟","🚪","🧹","🧴","🪣","🍽️","🥄","🫙","🧊","🔌"];
const SEED_CUSTOS=[
  {id:"1",category:"doc",desc:"Certidão de matrícula",amount:147.56,paidAmount:0},
  {id:"2",category:"doc",desc:"ART do CREA",amount:271.47,paidAmount:0},
  {id:"3",category:"doc",desc:"Taxa de Engenharia Caixa",amount:750.00,paidAmount:0},
  {id:"4",category:"doc",desc:"Alvará de Construção",amount:80.92,paidAmount:0},
  {id:"5",category:"doc",desc:"Certidão de inteiro teor",amount:468.24,paidAmount:0},
  {id:"6",category:"doc",desc:"Vistorias Engenharia CAIXA (2)",amount:1500.00,paidAmount:0},
  {id:"7",category:"doc",desc:"Guias INSS da Obra",amount:2278.35,paidAmount:0},
  {id:"8",category:"doc",desc:"Habite-se",amount:100.00,paidAmount:0},
  {id:"9",category:"doc",desc:"Averbação da construção",amount:501.39,paidAmount:0},
  {id:"10",category:"doc",desc:"Renov. da Certidão Matrícula",amount:168.78,paidAmount:0},
  {id:"11",category:"doc",desc:"Taxa contratação Caixa (1,5%)",amount:2433.64,paidAmount:0},
  {id:"12",category:"doc",desc:"Reg. Alienação Fiduciária 1 (50%)",amount:571.18,paidAmount:0},
  {id:"13",category:"doc",desc:"Reg. Alienação Fiduciária 2 (50%)",amount:1199.71,paidAmount:0},
  {id:"14",category:"doc",desc:"Certidão Atualizada",amount:168.78,paidAmount:0},
  {id:"15",category:"doc",desc:"Juros de obra",amount:2649.53,paidAmount:0},
  {id:"16",category:"obra",desc:"Entrada Obra",amount:7756.00,paidAmount:0},
  {id:"17",category:"construtora",desc:"Construtora",amount:6000.00,paidAmount:0},
];
const SEED_TX=[
  {id:"tx101",type:"guardado-norrara",desc:"Economia inicial Norrara",amount:5533.00,date:"2026-04-21"},
  {id:"tx102",type:"guardado-moises",desc:"Economia inicial Moisés",amount:5291.24,date:"2026-04-21"},
];

// ─── Firebase ────────────────────────────────────────────────────
import { db } from './firebase';
import { ref, set as fbSet, onValue } from 'firebase/database';

const DB = {
  TX:"casa-transacoes", CUSTOS:"casa-custos", CATS_FIN:"casa-categorias-fin",
  LISTA:"casa-lista-items", CATS_LISTA:"casa-categorias-lista",
};

function useFirebase(key, seed, transform) {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  useState(() => {
    const r = ref(db, key);
    const unsub = onValue(r, (snap) => {
      const val = snap.val();
      if (val !== null && val !== undefined) {
        const arr = Array.isArray(val)?val:(typeof val==="object"?Object.values(val):val);
        setData(transform?transform(arr):arr);
      } else { setData(seed); if(seed!==null) fbSet(r,seed); }
      setReady(true);
    });
    return unsub;
  });
  const save=(d)=>{setData(d);fbSet(ref(db,key),d);};
  return [data,save,ready];
}

/* ══════ ROOT ══════ */
export default function Root() {
  const [page,setPage]=useState("home");
  const [catsFin,saveCatsFin,catsFin_ok]      = useFirebase(DB.CATS_FIN, DEFAULT_CATS_FIN,null);
  const [transactions,saveTx,tx_ok]           = useFirebase(DB.TX,       SEED_TX,null);
  const [costs,saveCosts,costs_ok]            = useFirebase(DB.CUSTOS,   SEED_CUSTOS,s=>s.map(c=>({paidAmount:0,...c})));
  const [listaItems,saveListaItems,lista_ok]  = useFirebase(DB.LISTA,    [],null);
  const [catsLista,saveCatsLista,catsLista_ok]= useFirebase(DB.CATS_LISTA,DEFAULT_CATS_LISTA,null);
  const ready=catsFin_ok&&tx_ok&&costs_ok&&lista_ok&&catsLista_ok;
  if(!ready||!catsFin||!transactions||!costs||listaItems===null||!catsLista) return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f2557,#1e3a8a,#1d4ed8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:52}}>🏡</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"rgba(255,255,255,.7)",letterSpacing:2}}>Carregando...</div>
    </div>
  );
  if(page==="financeiro") return <FinanceiroApp catsFin={catsFin} setCatsFin={saveCatsFin} transactions={transactions} setTx={saveTx} costs={costs} setCosts={saveCosts} onHome={()=>setPage("home")}/>;
  if(page==="lista")      return <ListaApp listaItems={listaItems} setListaItems={saveListaItems} catsLista={catsLista} setCatsLista={saveCatsLista} onHome={()=>setPage("home")}/>;
  return <HomePage onNavigate={setPage} transactions={transactions} costs={costs} listaItems={listaItems}/>;
}

/* ══════ HOME ══════ */
function HomePage({onNavigate,transactions,costs,listaItems}){
  const totalSaved=transactions.reduce((a,t)=>isEntrada(t.type)?a+t.amount:a-t.amount,0);
  const totalGross=costs.reduce((a,c)=>a+c.amount,0);
  const progressSaved=totalGross>0?Math.min(totalSaved/totalGross*100,100):0;
  const listaTotal=listaItems.reduce((s,i)=>s+i.valor,0);
  const listaComprado=listaItems.filter(i=>i.comprado).reduce((s,i)=>s+i.valor,0);
  const listaProgress=listaTotal>0?(listaComprado/listaTotal)*100:0;
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f2557 0%,#1e3a8a 40%,#1d4ed8 75%,#0ea5e9 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",fontFamily:"'DM Sans',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}.hcard{transition:transform .25s ease,box-shadow .25s ease!important}.hcard:hover{transform:translateY(-8px)!important;box-shadow:0 28px 64px rgba(0,0,0,.4)!important}.hcard:hover .arr{transform:translateX(8px)!important}.arr{transition:transform .2s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.12}50%{opacity:.22}}`}</style>
      {[{s:380,t:-100,l:-100,d:0},{s:220,b:-80,r:-60,d:1},{s:140,t:60,r:180,d:2}].map((b,i)=><div key={i} style={{position:"absolute",width:b.s,height:b.s,borderRadius:"50%",background:"white",opacity:.12,top:b.t,bottom:b.b,left:b.l,right:b.r,animation:`pulse ${3+i}s ${b.d}s ease-in-out infinite`,pointerEvents:"none"}}/>)}
      <div style={{textAlign:"center",marginBottom:52,animation:"fadeUp .6s ease both"}}>
        <div style={{fontSize:56,marginBottom:16}}>🏡</div>
        <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:5,color:"rgba(255,255,255,.5)",textTransform:"uppercase",marginBottom:10}}>MOISÉS & NORRARA</p>
        <h1 style={{fontFamily:"'DM Sans',sans-serif",fontSize:36,fontWeight:800,color:"white",lineHeight:1.1,marginBottom:8}}>Nossa Casinha</h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,.5)"}}>Selecione o que deseja acessar</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,width:"100%",maxWidth:640,animation:"fadeUp .6s .12s ease both",opacity:0,animationFillMode:"forwards"}}>
        <button className="hcard" onClick={()=>onNavigate("financeiro")} style={{background:"rgba(255,255,255,.11)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,.2)",borderRadius:22,padding:"28px 26px",cursor:"pointer",textAlign:"left",boxShadow:"0 8px 32px rgba(0,0,0,.2)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#818cf8,#2563eb,#38bdf8)"}}/>
          <div style={{fontSize:38,marginBottom:14}}>📊</div>
          <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Planejamento Financeiro</h2>
          <p style={{fontSize:13,color:"rgba(255,255,255,.55)",marginBottom:20,lineHeight:1.5}}>Controle de economias, custos do financiamento e pagamentos da obra</p>
          <div style={{background:"rgba(255,255,255,.09)",borderRadius:10,padding:"12px 14px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.45)",letterSpacing:1}}>GUARDADO</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#818cf8",fontWeight:600}}>{progressSaved.toFixed(1)}%</span></div>
            <div style={{background:"rgba(255,255,255,.15)",borderRadius:3,height:4,overflow:"hidden",marginBottom:8}}><div style={{width:`${progressSaved}%`,height:"100%",background:"linear-gradient(90deg,#818cf8,#60a5fa)",borderRadius:3}}/></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.35)"}}>{fmt(totalSaved)}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.35)"}}>meta {fmt(totalGross)}</span></div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:13,color:"rgba(255,255,255,.65)",fontWeight:500}}>Acessar dashboard</span><span className="arr" style={{fontSize:20,color:"rgba(255,255,255,.65)"}}>→</span></div>
        </button>
        <button className="hcard" onClick={()=>onNavigate("lista")} style={{background:"rgba(255,255,255,.11)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,.2)",borderRadius:22,padding:"28px 26px",cursor:"pointer",textAlign:"left",boxShadow:"0 8px 32px rgba(0,0,0,.2)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#38bdf8,#6366f1,#a78bfa)"}}/>
          <div style={{fontSize:38,marginBottom:14}}>🛒</div>
          <h2 style={{fontFamily:"'DM Sans',sans-serif",fontSize:24,fontWeight:800,color:"white",marginBottom:6}}>Lista de Compras</h2>
          <p style={{fontSize:13,color:"rgba(255,255,255,.55)",marginBottom:20,lineHeight:1.5}}>Móveis, eletrodomésticos e tudo que vai fazer parte do novo lar</p>
          <div style={{background:"rgba(255,255,255,.09)",borderRadius:10,padding:"12px 14px",marginBottom:18}}>
            {listaItems.length===0?<div style={{textAlign:"center",padding:"4px 0"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.35)"}}>Nenhum item cadastrado ainda</span></div>
            :<><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.45)",letterSpacing:1}}>COMPRADO</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#34d399",fontWeight:600}}>{listaProgress.toFixed(0)}%</span></div><div style={{background:"rgba(255,255,255,.15)",borderRadius:3,height:4,overflow:"hidden",marginBottom:8}}><div style={{width:`${listaProgress}%`,height:"100%",background:"linear-gradient(90deg,#34d399,#059669)",borderRadius:3}}/></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.35)"}}>{listaItems.filter(i=>i.comprado).length}/{listaItems.length} itens</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(255,255,255,.35)"}}>total {fmt(listaTotal)}</span></div></>}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:13,color:"rgba(255,255,255,.65)",fontWeight:500}}>Acessar lista</span><span className="arr" style={{fontSize:20,color:"rgba(255,255,255,.65)"}}>→</span></div>
        </button>
      </div>
      <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:"rgba(255,255,255,.2)",marginTop:52,textTransform:"uppercase",animation:"fadeUp .6s .25s ease both",opacity:0,animationFillMode:"forwards"}}>Construindo nosso sonho juntos 💙</p>
    </div>
  );
}

/* ══════ FINANCEIRO ══════ */
function FinanceiroApp({catsFin,setCatsFin,transactions,setTx,costs,setCosts,onHome}){
  const [tab,setTab]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [txForm,setTxForm]=useState({desc:"",amount:"",type:"guardado-moises",date:today()});
  const [costForm,setCostForm]=useState({desc:"",amount:"",category:"doc"});
  const [editCost,setEditCost]=useState(null);
  const [showNewCat,setShowNewCat]=useState(false);
  const [newCat,setNewCat]=useState({label:"",icon:"📦",colorIdx:0});
  const [editCat,setEditCat]=useState(null);
  const [payModal,setPayModal]=useState({open:false,person:null});
  const [payForm,setPayForm]=useState({costId:null,value:"",desc:""});
  const showToast=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),2800);};

  // ── Computed ──
  const isFullyPaid=c=>(c.paidAmount||0)>=c.amount;
  const paidPct=c=>c.amount>0?Math.min((c.paidAmount||0)/c.amount*100,100):0;
  const totalSaved=transactions.reduce((a,t)=>isEntrada(t.type)?a+t.amount:a-t.amount,0);
  const totalPaidOut=costs.reduce((a,c)=>a+(c.paidAmount||0),0);
  const totalGross=costs.reduce((a,c)=>a+c.amount,0);
  const totalCosts=costs.reduce((a,c)=>a+Math.max(c.amount-(c.paidAmount||0),0),0);
  const remaining=Math.max(totalCosts-totalSaved,0);
  const progress=totalGross>0?Math.min(totalPaidOut/totalGross*100,100):0;
  const progressSaved=totalCosts>0?Math.min(totalSaved/totalCosts*100,100):0;
  const pSaved=p=>transactions.filter(t=>personOf(t.type)===p).reduce((a,t)=>isEntrada(t.type)?a+t.amount:a-t.amount,0);
  const activeCosts=costs.filter(c=>!isFullyPaid(c));
  const paidCosts=costs.filter(c=>isFullyPaid(c));

  // ── Actions ──
  const addTx=()=>{
    if(isPayment(txForm.type)){openPayModal(txForm.type.replace("pagamento-",""));return;}
    if(!txForm.desc.trim()||!txForm.amount)return showToast("Preencha todos os campos.",false);
    const v=parseFloat(txForm.amount);if(isNaN(v)||v<=0)return showToast("Valor inválido.",false);
    setTx([{id:"tx"+Date.now(),desc:txForm.desc.trim(),amount:v,type:txForm.type,date:txForm.date},...transactions]);
    setTxForm(p=>({desc:"",amount:"",type:p.type,date:today()}));
    showToast(isEntrada(txForm.type)?`Economia de ${personOf(txForm.type)} registrada! 🏠`:"Retirada registrada.");
  };
  const removeTx=id=>{setTx(transactions.filter(t=>t.id!==id));showToast("Lançamento removido.");};
  const addCost=()=>{
    if(!costForm.desc.trim()||!costForm.amount)return showToast("Preencha todos os campos.",false);
    const v=parseFloat(costForm.amount);if(isNaN(v)||v<=0)return showToast("Valor inválido.",false);
    if(editCost){setCosts(costs.map(c=>c.id===editCost?{...c,desc:costForm.desc.trim(),amount:v,category:costForm.category}:c));setEditCost(null);showToast("Custo atualizado.");}
    else{setCosts([...costs,{id:"c"+Date.now(),desc:costForm.desc.trim(),amount:v,category:costForm.category,paidAmount:0}]);showToast("Custo adicionado.");}
    setCostForm(p=>({desc:"",amount:"",category:p.category}));
  };
  const startEditCost=c=>{setEditCost(c.id);setCostForm({desc:c.desc,amount:String(c.amount),category:c.category??"doc"});};
  const removeCost=id=>{setCosts(costs.filter(c=>c.id!==id));showToast("Custo removido.");};

  // ── TOGGLE QUITADO ──
  const toggleCostPaid=id=>{
    setCosts(costs.map(c=>{
      if(c.id!==id) return c;
      const nowPaid=!isFullyPaid(c);
      if(nowPaid) showToast(`"${c.desc}" marcado como quitado! ✅`);
      else showToast(`"${c.desc}" desmarcado.`);
      return {...c,paidAmount:nowPaid?c.amount:0};
    }));
  };

  const addCatFin=()=>{
    if(!newCat.label.trim())return showToast("Digite o nome da categoria.",false);
    const p=PRESET_COLORS[newCat.colorIdx];
    if(editCat){setCatsFin(catsFin.map(x=>x.id===editCat?{...x,label:newCat.label.trim(),icon:newCat.icon||"📦",...p}:x));showToast("Categoria atualizada!");}
    else{setCatsFin([...catsFin,{id:"cat_"+Date.now(),label:newCat.label.trim(),icon:newCat.icon||"📦",...p}]);showToast("Categoria criada!");}
    cancelCatForm();
  };
  const startEditCat=cat=>{const ci=PRESET_COLORS.findIndex(p=>p.color===cat.color);setNewCat({label:cat.label,icon:cat.icon,colorIdx:ci>=0?ci:0});setEditCat(cat.id);setShowNewCat(true);};
  const cancelCatForm=()=>{setNewCat({label:"",icon:"📦",colorIdx:0});setEditCat(null);setShowNewCat(false);};
  const removeCatFin=id=>{if(DEFAULT_CATS_FIN.find(c=>c.id===id))return showToast("Não é possível remover categorias padrão.",false);setCatsFin(catsFin.filter(c=>c.id!==id));showToast("Categoria removida.");};
  const openPayModal=p=>{setPayModal({open:true,person:p});setPayForm({costId:null,value:"",desc:""});};
  const selectPayCost=id=>{const c=costs.find(x=>x.id===id);if(!c)return;setPayForm(p=>({...p,costId:id,desc:`Pagamento - ${c.desc}`,value:""}));};
  const selRem=()=>{const c=costs.find(x=>x.id===payForm.costId);return c?Math.max(c.amount-(c.paidAmount||0),0):0;};
  const submitPayment=()=>{
    if(!payForm.costId)return showToast("Selecione um custo.",false);
    const amount=parseFloat(payForm.value);if(isNaN(amount)||amount<=0)return showToast("Valor inválido.",false);
    const mx=selRem();if(amount>mx+0.01)return showToast(`Máximo: ${fmt(mx)}`,false);
    const cost=costs.find(c=>c.id===payForm.costId);
    const newPaid=Math.min((cost.paidAmount||0)+amount,cost.amount);
    setTx([{id:"tx"+Date.now(),type:`pagamento-${payModal.person}`,desc:payForm.desc||`Pagamento - ${cost.desc}`,amount,date:today()},...transactions]);
    setCosts(costs.map(c=>c.id===cost.id?{...c,paidAmount:newPaid}:c));
    setPayModal({open:false,person:null});setPayForm({costId:null,value:"",desc:""});
    showToast(newPaid>=cost.amount?`${cost.desc} pago 100%! ✅`:`Pagamento de ${fmt(amount)} registrado! 💳`);
  };

  const TABS=[{id:"dashboard",l:"Visão Geral"},{id:"lancamentos",l:"Lançamentos"},{id:"custos",l:"Custos"}];

  return(
    <div style={{minHeight:"100vh",background:"#eef3fb",color:"#1a3050",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=DM+Sans:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#93b8e0;border-radius:2px}input,select{outline:none}input::placeholder{color:#a8c4e0}input:focus,select:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.tbtn:hover{background:rgba(37,99,235,.06)!important}.rh:hover{background:rgba(37,99,235,.04)!important}.bpri:hover{filter:brightness(.9)}.bgh:hover{background:rgba(37,99,235,.08)!important}.crow:hover .ca{opacity:1!important}.sw:hover{transform:scale(1.18)}.hb:hover{background:rgba(255,255,255,.25)!important}.chk:hover{transform:scale(1.08)!important}@keyframes sIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes fIn{from{opacity:0}to{opacity:1}}`}</style>

      {toast&&<div style={{position:"fixed",top:24,right:24,zIndex:2000,background:toast.ok?"#eff8ff":"#fff0f0",border:`1px solid ${toast.ok?"#93c5fd":"#fca5a5"}`,color:toast.ok?"#1d4ed8":"#dc2626",padding:"10px 18px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,animation:"sIn .2s ease",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>{toast.msg}</div>}

      {/* Payment Modal */}
      {payModal.open&&(
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(10,20,50,.45)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fIn .2s ease",padding:16}} onClick={e=>e.target===e.currentTarget&&setPayModal({open:false,person:null})}>
          <div style={{background:"#fff",borderRadius:14,width:"min(96vw,500px)",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.22)"}}>
            <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #dae6f5",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff"}}>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:payModal.person==="moises"?"#2563eb":"#7c3aed",marginBottom:4}}>{payModal.person==="moises"?"💙 PAGAMENTO MOISÉS":"💜 PAGAMENTO NORRARA"}</div><div style={{fontSize:19,color:"#1a3050"}}>Registrar Pagamento de Custo</div></div>
              <button onClick={()=>setPayModal({open:false,person:null})} style={{background:"none",border:"none",fontSize:22,color:"#9ab8d8",cursor:"pointer"}}>×</button>
            </div>
            <div style={{padding:"14px 20px 0"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"#7aa0c8",marginBottom:8}}>SELECIONE O CUSTO</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:240,overflowY:"auto"}}>
                {activeCosts.length===0
                  ?<div style={{textAlign:"center",padding:"16px 0",color:"#9ab8d8",fontSize:13}}>Todos os custos já foram pagos! 🎉</div>
                  :activeCosts.map(c=>{
                    const cat=catsFin.find(x=>x.id===c.category);const sel=payForm.costId===c.id;
                    const pp=paidPct(c);const rem=Math.max(c.amount-(c.paidAmount||0),0);
                    return(<div key={c.id} onClick={()=>selectPayCost(c.id)} style={{padding:"9px 11px",borderRadius:8,border:`1.5px solid ${sel?(cat?.color||"#2563eb"):"#dae6f5"}`,background:sel?(cat?.bg||"#eff6ff"):"#f8fbff",cursor:"pointer",transition:"all .15s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?(cat?.color||"#2563eb"):"#ccdcf0"}`,background:sel?(cat?.color||"#2563eb"):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<span style={{color:"#fff",fontSize:9,fontWeight:700}}>✓</span>}</div>
                          <div><div style={{fontSize:13,color:"#1a3050"}}>{c.desc}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>{cat?.icon} {cat?.label}{pp>0?` · ${pp.toFixed(0)}% pago`:""}</div></div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:cat?.color||"#2563eb"}}>{fmt(rem)}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>restante</div></div>
                      </div>
                      {pp>0&&<div style={{marginTop:5,background:"rgba(255,255,255,.7)",borderRadius:3,height:3}}><div style={{width:`${pp}%`,height:"100%",background:cat?.color||"#2563eb",borderRadius:3,opacity:.6}}/></div>}
                    </div>);
                  })}
              </div>
            </div>
            {payForm.costId&&(
              <div style={{padding:"12px 20px 0"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                  <div><label style={F.il}>VALOR PAGO (R$)</label><input style={F.inp} type="number" min="0.01" step="0.01" placeholder="0,00" autoFocus value={payForm.value} onChange={e=>setPayForm(p=>({...p,value:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submitPayment()}/><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8",marginTop:4}}>Máximo: <strong style={{color:"#0284c7"}}>{fmt(selRem())}</strong></div></div>
                  <div style={{paddingTop:20}}>{parseFloat(payForm.value)>0&&<div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"8px 12px",textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#0284c7",letterSpacing:2,marginBottom:3}}>EQUIVALE A</div><div style={{fontSize:20,color:"#0284c7"}}>{(()=>{const c=costs.find(x=>x.id===payForm.costId);return c&&c.amount>0?(parseFloat(payForm.value)/c.amount*100).toFixed(1)+"%":"-";})()}</div></div>}</div>
                </div>
                <div style={{marginBottom:4}}><label style={F.il}>DESCRIÇÃO (OPCIONAL)</label><input style={F.inp} placeholder="Descrição do pagamento" value={payForm.desc} onChange={e=>setPayForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submitPayment()}/></div>
              </div>
            )}
            <div style={{padding:"12px 20px 18px",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="bgh" onClick={()=>setPayModal({open:false,person:null})} style={F.bg}>Cancelar</button>
              <button className="bpri" onClick={submitPayment} style={{...F.bp,width:"auto",padding:"10px 22px",background:payModal.person==="moises"?"#2563eb":"#7c3aed"}}>Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 28px",background:"linear-gradient(135deg,#1e4d9b,#2563eb,#3b82f6)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button className="hb" onClick={onHome} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:10,padding:"8px 14px",color:"white",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"background .2s",whiteSpace:"nowrap"}}>🏡 Home</button>
          <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:4,color:"rgba(255,255,255,.55)",marginBottom:4}}>NOSSA CASINHA — MOISÉS E NORRARA</div><h1 style={{fontSize:22,fontWeight:800,color:"#fff",letterSpacing:.5}}>Planejamento Financeiro</h1></div>
        </div>
        <div style={{textAlign:"right"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:"rgba(255,255,255,.55)",display:"block",marginBottom:4}}>PROGRESSO</span><span style={{fontSize:28,fontWeight:800,color:"#fff",display:"block",lineHeight:1}}>{progressSaved.toFixed(1)}%</span></div>
      </header>

      <nav style={{display:"flex",padding:"0 28px",background:"#fff",borderBottom:"1px solid #dae6f5",boxShadow:"0 1px 4px rgba(30,77,155,.06)",overflowX:"auto"}}>
        {TABS.map(t=><button key={t.id} className="tbtn" onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",padding:"13px 18px",color:tab===t.id?"#2563eb":"#7aa0c8",fontSize:13,cursor:"pointer",borderBottom:`2px solid ${tab===t.id?"#2563eb":"transparent"}`,transition:"all .2s",whiteSpace:"nowrap"}}>{t.l}</button>)}
      </nav>

      <main style={{padding:"20px 28px 40px",maxWidth:860,margin:"0 auto"}}>

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard"&&<div style={{animation:"sIn .3s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:14}}>
            {[{l:"TOTAL GUARDADO",v:fmt(totalSaved),s:`em ${transactions.filter(t=>isEntrada(t.type)).length} depósitos`,a:"#2563eb",i:"🏦"},{l:"CUSTOS TOTAIS",v:fmt(totalCosts),s:`${activeCosts.length} custo(s) em aberto`,a:"#6366f1",i:"📋"},{l:"FALTA GUARDAR",v:fmt(remaining),s:remaining<=0?"Meta atingida! 🎉":`${(100-progress).toFixed(1)}% do objetivo`,a:remaining<=0?"#16a34a":"#0284c7",i:remaining<=0?"✅":"🎯"}].map((k,i)=>(
              <div key={i} style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",boxShadow:"0 1px 6px rgba(30,77,155,.06)",borderTop:`3px solid ${k.a}`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:10,right:12,fontSize:20,opacity:.2}}>{k.i}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase"}}>{k.l}</div>
                <div style={{fontSize:24,color:k.a,fontWeight:800,margin:"6px 0 3px",lineHeight:1}}>{k.v}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>{k.s}</div>
              </div>
            ))}
          </div>
          {[{l:"💙 META GUARDADO",s:"quanto do total já foi guardado",pct:progressSaved,lft:`${fmt(totalSaved)} guardado`,rgt:`meta: ${fmt(totalCosts)}`,c:"#2563eb",g:"linear-gradient(90deg,#1e4d9b,#2563eb,#60a5fa)"},{l:"✅ CUSTOS PAGOS",s:"quanto do total de custos já foi quitado",pct:progress,lft:`${fmt(totalPaidOut)} pago`,rgt:`total: ${fmt(totalGross)}`,c:"#059669",g:"linear-gradient(90deg,#065f46,#059669,#34d399)"}].map((pb,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}><div><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase"}}>{pb.l}</span><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8",marginTop:1}}>{pb.s}</div></div><span style={{fontSize:22,color:pb.c,fontWeight:800}}>{pb.pct.toFixed(1)}%</span></div>
              <div style={{height:9,background:"#dae6f5",borderRadius:4,overflow:"hidden",marginBottom:7}}><div style={{height:"100%",background:pb.g,borderRadius:4,width:`${pb.pct}%`,transition:"width 1s cubic-bezier(.16,1,.3,1)"}}/></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:pb.c}}>{pb.lft}</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8"}}>{pb.rgt}</span></div>
            </div>
          ))}
          <div style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase",marginBottom:12}}>ÚLTIMOS LANÇAMENTOS</div>
            {transactions.length===0?<div style={{textAlign:"center",padding:"20px",color:"#9ab8d8",fontSize:13}}>Nenhum lançamento ainda.</div>:
            <div>{[...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(t=>(
              <div key={t.id} className="rh" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 8px",borderRadius:6,transition:"background .15s",borderBottom:"1px solid #d0e3f5"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:15}}>{isEntrada(t.type)?"⬆":isPayment(t.type)?"💳":"⬇"}</span><div><div style={{fontSize:13,color:"#1a3050"}}>{t.desc}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8",marginTop:1}}>{fmtDate(t.date)} · {labelOf(t.type)}</div></div></div>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:isEntrada(t.type)?"#16a34a":isPayment(t.type)?"#d97706":"#dc2626"}}>{isEntrada(t.type)?"+":"-"}{fmt(t.amount)}</span>
              </div>
            ))}{transactions.length>5&&<button className="bgh" onClick={()=>setTab("lancamentos")} style={{...F.bg,marginTop:8,fontSize:12}}>Ver todos →</button>}</div>}
          </div>
          <div style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase",marginBottom:14}}>COMPOSIÇÃO DOS CUSTOS</div>
            {costs.length===0?<div style={{textAlign:"center",padding:"20px",color:"#9ab8d8",fontSize:13}}>Nenhum custo cadastrado.</div>:
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {catsFin.map(cat=>{
                const items=costs.filter(c=>c.category===cat.id);if(!items.length)return null;
                const tot=items.reduce((a,c)=>a+c.amount,0);const paid=items.reduce((a,c)=>a+(c.paidAmount||0),0);
                const pct=totalGross>0?(tot/totalGross)*100:0;
                return(<div key={cat.id} style={{background:cat.bg,border:`1px solid ${cat.border}`,borderRadius:8,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:15}}>{cat.icon}</span><span style={{fontSize:13,fontWeight:500,color:cat.color}}>{cat.label}</span></div><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:cat.color}}>{fmt(tot-paid)}</span></div>
                  <div style={{background:"rgba(255,255,255,.7)",borderRadius:3,height:4,marginBottom:8}}><div style={{width:`${pct}%`,height:"100%",background:cat.color,borderRadius:3,opacity:.75}}/></div>
                  {items.map((item,idx)=>{const fp=isFullyPaid(item);return(<div key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:idx<items.length-1?"1px solid rgba(255,255,255,.7)":"none",opacity:fp?.6:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>{fp&&<span style={{fontSize:12}}>✅</span>}<span style={{fontSize:12,color:"#4a6080",textDecoration:fp?"line-through":"none"}}>· {item.desc}</span></div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:cat.color}}>{fmt(Math.max(item.amount-(item.paidAmount||0),0))}</span>
                  </div>);})}
                </div>);
              })}
            </div>}
          </div>
        </div>}

        {/* ══ LANÇAMENTOS ══ */}
        {tab==="lancamentos"&&<div style={{animation:"sIn .3s ease"}}>
          <div style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase",marginBottom:14}}>NOVO LANÇAMENTO</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
              <div><label style={F.il}>Tipo</label><select style={F.inp} value={txForm.type} onChange={e=>setTxForm(p=>({...p,type:e.target.value}))}><optgroup label="Guardar"><option value="guardado-moises">💙 Guardado Moisés</option><option value="guardado-norrara">💜 Guardado Norrara</option></optgroup><optgroup label="Retiradas"><option value="retirada-moises">↙ Retirada Moisés</option><option value="retirada-norrara">↙ Retirada Norrara</option></optgroup><optgroup label="Pagamentos"><option value="pagamento-moises">💳 Pagamento Moisés</option><option value="pagamento-norrara">💳 Pagamento Norrara</option></optgroup></select></div>
              {isPayment(txForm.type)?<div style={{display:"flex",alignItems:"flex-end",gridColumn:"span 3"}}><div style={{flex:1,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 13px"}}><span style={{fontSize:13,color:"#92400e"}}>💳 Clique em <strong>"Selecionar Custo"</strong> para registrar o pagamento.</span></div></div>
              :<><div><label style={F.il}>Descrição</label><input style={F.inp} placeholder="Ex.: Reserva de junho…" value={txForm.desc} onChange={e=>setTxForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTx()}/></div><div><label style={F.il}>Valor (R$)</label><input style={F.inp} type="number" min="0" step="0.01" placeholder="0,00" value={txForm.amount} onChange={e=>setTxForm(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTx()}/></div><div><label style={F.il}>Data</label><input style={F.inp} type="date" value={txForm.date} onChange={e=>setTxForm(p=>({...p,date:e.target.value}))}/></div></>}
              <div style={{display:"flex",alignItems:"flex-end"}}><button className="bpri" onClick={addTx} style={{...F.bp,background:isPayment(txForm.type)?"#d97706":txForm.type.includes("norrara")?"#7c3aed":"#2563eb"}}>{isPayment(txForm.type)?"Selecionar Custo →":"Registrar"}</button></div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {[{p:"Moisés",c:"#2563eb",bg:"#eff6ff",br:"#bfdbfe",e:"💙"},{p:"Norrara",c:"#7c3aed",bg:"#faf5ff",br:"#e9d5ff",e:"💜"}].map(x=>(
              <div key={x.p} style={{background:x.bg,border:`1px solid ${x.br}`,borderRadius:10,padding:"12px 16px",borderTop:`3px solid ${x.c}`}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:x.c,marginBottom:5}}>{x.e} {x.p.toUpperCase()}</div>
                <div style={{fontSize:22,fontWeight:800,color:x.c}}>{fmt(pSaved(x.p))}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#7aa0c8",marginTop:2}}>{transactions.filter(t=>personOf(t.type)===x.p&&isEntrada(t.type)).length} depósito(s)</div>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase"}}>HISTÓRICO ({transactions.length})</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#2563eb"}}>Saldo: {fmt(totalSaved)}</span></div>
            {transactions.length===0?<div style={{textAlign:"center",padding:"20px",color:"#9ab8d8",fontSize:13}}>Nenhum lançamento registrado.</div>:
            <div>{[...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t=>{
              const en=isEntrada(t.type),pay=isPayment(t.type),col=colorOf(t.type);
              return(<div key={t.id} className="rh" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 8px",borderRadius:6,transition:"background .15s",borderBottom:"1px solid #d0e3f5"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:30,height:30,borderRadius:"50%",background:`${col}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:col,flexShrink:0}}>{en?"↑":pay?"💳":"↓"}</div><div><div style={{fontSize:13,color:"#1a3050"}}>{t.desc}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8",marginTop:1}}>{fmtDate(t.date)} · {labelOf(t.type)}</div></div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:en?"#16a34a":pay?"#d97706":"#dc2626"}}>{en?"+":"-"}{fmt(t.amount)}</span><button className="bgh" onClick={()=>removeTx(t.id)} style={{...F.bg,padding:"3px 7px",fontSize:11,color:"#dc2626",borderColor:"#fecaca"}}>✕</button></div>
              </div>);
            })}</div>}
          </div>
        </div>}

        {/* ══ CUSTOS ══ */}
        {tab==="custos"&&<div style={{animation:"sIn .3s ease"}}>
          {/* Form */}
          <div style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase",marginBottom:14}}>{editCost?"EDITAR CUSTO":"NOVO CUSTO"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
              <div style={{gridColumn:"1 / -1"}}><label style={F.il}>Categoria</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{catsFin.map(cat=><button key={cat.id} onClick={()=>setCostForm(p=>({...p,category:cat.id}))} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${costForm.category===cat.id?cat.color:"#ccdcf0"}`,background:costForm.category===cat.id?cat.bg:"transparent",color:costForm.category===cat.id?cat.color:"#7aa0c8",fontSize:12,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:4}}><span>{cat.icon}</span>{cat.label}</button>)}</div></div>
              <div style={{gridColumn:"1 / -1"}}><label style={F.il}>Descrição do Item</label><input style={F.inp} placeholder="Ex.: ITBI, Escritura…" value={costForm.desc} onChange={e=>setCostForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCost()}/></div>
              <div><label style={F.il}>Valor (R$)</label><input style={F.inp} type="number" min="0" step="0.01" placeholder="0,00" value={costForm.amount} onChange={e=>setCostForm(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCost()}/></div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8}}><button className="bpri" onClick={addCost} style={F.bp}>{editCost?"Salvar":"Adicionar"}</button>{editCost&&<button className="bgh" onClick={()=>{setEditCost(null);setCostForm({desc:"",amount:"",category:"doc"});}} style={F.bg}>Cancelar</button>}</div>
            </div>
          </div>

          {/* Categorias */}
          <div style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showNewCat?14:0}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase"}}>CATEGORIAS ({catsFin.length})</span>
              <button className="bgh" onClick={()=>{if(showNewCat)cancelCatForm();else setShowNewCat(true);}} style={{...F.bg,padding:"5px 12px",fontSize:12,color:showNewCat?"#dc2626":"#2563eb",borderColor:showNewCat?"#fecaca":"#ccdcf0"}}>{showNewCat?"✕ Cancelar":"+ Nova Categoria"}</button>
            </div>
            {showNewCat&&<div style={{padding:12,background:"#f4f8ff",borderRadius:8,border:`1.5px solid ${editCat?"#c7d2fe":"#ccdcf0"}`,marginBottom:12}}>
              {editCat&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"#6366f1",marginBottom:8}}>✎ EDITANDO</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:10}}><div><label style={F.il}>NOME</label><input style={F.inp} placeholder="Ex.: Mobília…" value={newCat.label} onChange={e=>setNewCat(p=>({...p,label:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCatFin()}/></div><div><label style={F.il}>ÍCONE</label><input style={{...F.inp,width:56,textAlign:"center",fontSize:18}} maxLength={2} value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))}/></div></div>
              <label style={{...F.il,marginBottom:6}}>COR</label>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>{PRESET_COLORS.map((c,i)=><div key={i} className="sw" onClick={()=>setNewCat(p=>({...p,colorIdx:i}))} style={{width:26,height:26,borderRadius:"50%",background:c.color,cursor:"pointer",transition:"transform .15s",border:`3px solid ${newCat.colorIdx===i?"#1a3050":"transparent"}`,boxShadow:newCat.colorIdx===i?`0 0 0 2px #fff,0 0 0 4px ${c.color}`:"none"}}/>)}</div>
              <button className="bpri" onClick={addCatFin} style={{...F.bp,background:PRESET_COLORS[newCat.colorIdx].color}}>{editCat?"Salvar Alterações":"Criar Categoria"}</button>
            </div>}
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {catsFin.map(cat=>{const isDef=!!DEFAULT_CATS_FIN.find(d=>d.id===cat.id);return(
                <div key={cat.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 9px",borderRadius:6,background:cat.bg,border:`1.5px solid ${editCat===cat.id?cat.color:cat.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:17}}>{cat.icon}</span><div><div style={{fontSize:13,color:cat.color,fontWeight:500}}>{cat.label}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>{costs.filter(c=>c.category===cat.id).length} item(ns)</div></div></div>
                  <div style={{display:"flex",gap:5}}><button className="bgh" onClick={()=>editCat===cat.id?cancelCatForm():startEditCat(cat)} style={{...F.bg,padding:"3px 9px",fontSize:11,color:editCat===cat.id?"#dc2626":cat.color,borderColor:editCat===cat.id?"#fecaca":cat.border}}>{editCat===cat.id?"✕":"✎"}</button>{!isDef&&<button className="bgh" onClick={()=>removeCatFin(cat.id)} style={{...F.bg,padding:"3px 9px",fontSize:11,color:"#dc2626",borderColor:"#fecaca"}}>🗑</button>}</div>
                </div>
              );})}
            </div>
          </div>

          {/* Totalizador */}
          {costs.length>0&&<div style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"1px solid #93c5fd",borderRadius:10,padding:"16px 18px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase",marginBottom:3}}>CUSTOS TOTAIS ATIVOS</div><div style={{fontSize:28,fontWeight:800,color:"#1e4d9b"}}>{fmt(totalCosts)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase",marginBottom:3}}>FALTA GUARDAR</div><div style={{fontSize:22,fontWeight:800,color:remaining<=0?"#16a34a":"#0284c7"}}>{fmt(remaining)}</div></div>
            </div>
          </div>}

          {/* Instrução */}
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>💡</span>
            <span style={{fontSize:13,color:"#92400e"}}>Clique no <strong>quadradinho</strong> ao lado de cada item para marcá-lo como quitado. O valor é descontado dos custos totais automaticamente.</span>
          </div>

          {/* Cards por categoria — todos os itens, quitados ficam verdes no lugar */}
          {catsFin.map(cat=>{
            const allItems=costs.filter(c=>c.category===cat.id);
            const subtotal=allItems.reduce((a,c)=>a+Math.max(c.amount-(c.paidAmount||0),0),0);
            const quitados=allItems.filter(c=>isFullyPaid(c)).length;
            return(<div key={cat.id} style={{background:"#fff",border:"1px solid #dae6f5",borderRadius:10,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,77,155,.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:allItems.length>0?10:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:17}}>{cat.icon}</span>
                  <span style={{fontSize:14,fontWeight:500,color:cat.color}}>{cat.label}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`,borderRadius:10,padding:"2px 7px"}}>{allItems.length} item(ns)</span>
                  {quitados>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,background:"#dcfce7",color:"#16a34a",border:"1px solid #86efac",borderRadius:10,padding:"2px 7px"}}>✅ {quitados} quitado(s)</span>}
                </div>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:cat.color}}>{fmt(subtotal)}</span>
              </div>
              {allItems.length===0
                ?<div style={{fontSize:12,color:"#9ab8d8",paddingTop:4}}>Selecione esta categoria para adicionar itens.</div>
                :<div>
                  {allItems.map((c,i)=>{
                    const fp=isFullyPaid(c);
                    const pp=paidPct(c);
                    const rem=Math.max(c.amount-(c.paidAmount||0),0);
                    return(
                      <div key={c.id} className="crow" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 8px",borderRadius:6,transition:"all .2s",borderBottom:"1px solid #d0e3f5",background:fp?"#f0fdf4":"transparent"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                          {/* Checkbox */}
                          <button className="chk" title={fp?"Desmarcar quitado":"Marcar como quitado"} onClick={()=>toggleCostPaid(c.id)}
                            style={{width:22,height:22,borderRadius:5,border:`2px solid ${fp?"#16a34a":cat.color}`,background:fp?"#16a34a":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,color:"white",fontWeight:900,transition:"all .2s"}}>
                            {fp?"✓":""}
                          </button>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:fp?"#86efac":"#b0c8e0",minWidth:16}}>{String(i+1).padStart(2,"0")}</div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:13,color:fp?"#166534":"#1a3050",textDecoration:fp?"line-through":"none"}}>{c.desc}</span>
                              {fp&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,background:"#dcfce7",color:"#16a34a",border:"1px solid #86efac",borderRadius:99,padding:"1px 7px",flexShrink:0}}>QUITADO</span>}
                            </div>
                            {!fp&&pp>0&&pp<100&&<div style={{display:"flex",alignItems:"center",gap:7,marginTop:2}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>{pp.toFixed(0)}% pago</span>
                              <div style={{flex:1,maxWidth:70,background:"#dae6f5",borderRadius:2,height:3}}><div style={{width:`${pp}%`,height:"100%",background:cat.color,borderRadius:2}}/></div>
                            </div>}
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:fp?"#16a34a":cat.color,textDecoration:fp?"line-through":"none"}}>{fmt(fp?c.amount:rem)}</div>
                            {!fp&&pp>0&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>de {fmt(c.amount)}</div>}
                          </div>
                          <div className="ca" style={{display:"flex",gap:5,opacity:0,transition:"opacity .2s"}}>
                            {!fp&&<button className="bgh" onClick={()=>startEditCost(c)} style={{...F.bg,padding:"3px 7px",fontSize:11,color:"#6366f1"}}>✎</button>}
                            <button className="bgh" onClick={()=>removeCost(c.id)} style={{...F.bg,padding:"3px 7px",fontSize:11,color:"#dc2626",borderColor:"#fecaca"}}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{borderTop:"1px solid #dae6f5",marginTop:5,paddingTop:8,display:"flex",justifyContent:"flex-end",gap:14}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase"}}>SUBTOTAL RESTANTE</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:cat.color}}>{fmt(subtotal)}</span>
                  </div>
                </div>
              }
            </div>);
          })}
        </div>}
      </main>
    </div>
  );
}

/* ══════ LISTA DE COMPRAS ══════ */
function ListaApp({listaItems,setListaItems,catsLista,setCatsLista,onHome}){
  const [toast,setToast]=useState(null);
  const [form,setForm]=useState({descricao:"",valor:"",link:"",categoria:"Sala",prioridade:"média"});
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [filter,setFilter]=useState("todos");
  const [sortBy,setSortBy]=useState("recente");
  const [search,setSearch]=useState("");
  const [deletingId,setDeletingId]=useState(null);
  const [showCatModal,setShowCatModal]=useState(false);
  const [newCatName,setNewCatName]=useState("");
  const [newCatEmoji,setNewCatEmoji]=useState("📦");
  const showToast=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),2800);};
  const allCats=typeof catsLista==="object"&&!Array.isArray(catsLista)?{...DEFAULT_CATS_LISTA,...catsLista}:{...DEFAULT_CATS_LISTA};
  const handleSubmit=()=>{
    if(!form.descricao.trim()||!form.valor)return showToast("Preencha todos os campos.",false);
    const v=parseCurr(form.valor);
    if(editId){setListaItems(listaItems.map(i=>i.id===editId?{...i,...form,valor:v}:i));setEditId(null);}
    else{setListaItems([...listaItems,{id:"li"+Date.now(),descricao:form.descricao.trim(),valor:v,link:form.link.trim(),categoria:form.categoria,prioridade:form.prioridade,comprado:false,dataCriacao:new Date().toISOString()}]);}
    showToast("Item salvo! ✅");setForm({descricao:"",valor:"",link:"",categoria:"Sala",prioridade:"média"});setShowForm(false);
  };
  const toggleComprado=item=>setListaItems(listaItems.map(i=>i.id===item.id?{...i,comprado:!i.comprado}:i));
  const deleteItem=id=>{setDeletingId(id);setTimeout(()=>{setListaItems(listaItems.filter(i=>i.id!==id));setDeletingId(null);},300);};
  const startEdit=item=>{setForm({descricao:item.descricao,valor:item.valor.toFixed(2).replace(".",","),link:item.link||"",categoria:item.categoria,prioridade:item.prioridade});setEditId(item.id);setShowForm(true);};
  const handleCatChange=val=>{if(val==="__novo__"){setShowCatModal(true);return;}setForm(f=>({...f,categoria:val}));};
  const confirmNewCat=()=>{const n=newCatName.trim();if(!n)return;setCatsLista({...allCats,[n]:newCatEmoji});setForm(f=>({...f,categoria:n}));setShowCatModal(false);setNewCatName("");setNewCatEmoji("📦");showToast(`Categoria "${n}" criada!`);};
  const handleValor=e=>{const raw=e.target.value.replace(/[^\d]/g,"");if(!raw){setForm(f=>({...f,valor:""}));return;}setForm(f=>({...f,valor:(parseInt(raw,10)/100).toFixed(2).replace(".",",")}));};
  const filtered=listaItems.filter(i=>filter==="todos"?true:filter==="pendentes"?!i.comprado:i.comprado).filter(i=>i.descricao.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{if(sortBy==="recente")return new Date(b.dataCriacao)-new Date(a.dataCriacao);if(sortBy==="valor-asc")return a.valor-b.valor;if(sortBy==="valor-desc")return b.valor-a.valor;return a.descricao.localeCompare(b.descricao);});
  const total=listaItems.reduce((s,i)=>s+i.valor,0);
  const comprado=listaItems.filter(i=>i.comprado).reduce((s,i)=>s+i.valor,0);
  const pendente=total-comprado;
  const progress=total>0?(comprado/total)*100:0;
  const PC={alta:{label:"Alta",color:"#dc2626",bg:"#fef2f2",border:"#fecaca"},média:{label:"Média",color:"#ea580c",bg:"#fff7ed",border:"#fed7aa"},baixa:{label:"Baixa",color:"#ca8a04",bg:"#fefce8",border:"#fde68a"}};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#eff6ff,#dbeafe 40%,#e0f2fe 100%)",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#93c5fd;border-radius:2px}input,select{outline:none}input:focus,select:focus{border-color:#1d4ed8!important;box-shadow:0 0 0 3px rgba(29,78,216,.1)}.lhb:hover{background:rgba(255,255,255,.25)!important}.li:hover{box-shadow:0 4px 16px rgba(30,58,138,.13)!important}@keyframes sIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes fIn{from{opacity:0}to{opacity:1}}`}</style>
      {toast&&<div style={{position:"fixed",top:24,right:24,zIndex:2000,background:toast.ok?"#eff8ff":"#fff0f0",border:`1px solid ${toast.ok?"#93c5fd":"#fca5a5"}`,color:toast.ok?"#1d4ed8":"#dc2626",padding:"10px 18px",borderRadius:8,fontSize:13,animation:"sIn .2s ease",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>{toast.msg}</div>}
      {showCatModal&&(
        <div style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(15,23,66,.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fIn .18s ease"}}>
          <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(30,58,138,.22)",border:"1.5px solid #dbeafe",overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><p style={{color:"#bfdbfe",fontSize:10,margin:"0 0 2px",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Nova Categoria</p><h3 style={{color:"white",margin:0,fontSize:16,fontWeight:800}}>Criar categoria personalizada</h3></div>
              <button onClick={()=>setShowCatModal(false)} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"white",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{padding:"22px"}}>
              <div style={{marginBottom:16}}><label style={L.lbl}>Nome *</label><input style={L.inp} placeholder="Ex: Escritório, Lavanderia..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&confirmNewCat()}/></div>
              <div style={{marginBottom:18}}><label style={L.lbl}>Ícone</label><div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,padding:"9px",background:"#f8faff",borderRadius:10,border:"1.5px solid #dbeafe"}}>{EMOJI_LISTA.map(e=><button key={e} onClick={()=>setNewCatEmoji(e)} style={{fontSize:17,padding:"4px 0",borderRadius:7,cursor:"pointer",border:"2px solid",borderColor:newCatEmoji===e?"#1d4ed8":"transparent",background:newCatEmoji===e?"#eff6ff":"transparent",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",minWidth:0}}>{e}</button>)}</div><p style={{fontSize:12,color:"#64748b",margin:"7px 0 0"}}>Pré-visualização: <strong>{newCatEmoji} {newCatName||"..."}</strong></p></div>
              <div style={{display:"flex",gap:9}}><button onClick={()=>{setShowCatModal(false);setNewCatName("");}} style={{flex:1,padding:"11px",borderRadius:11,border:"1.5px solid #dbeafe",background:"white",color:"#1d4ed8",fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancelar</button><button onClick={confirmNewCat} disabled={!newCatName.trim()} style={{flex:2,padding:"11px",borderRadius:11,border:"none",background:newCatName.trim()?"linear-gradient(135deg,#1d4ed8,#0ea5e9)":"#e2e8f0",color:newCatName.trim()?"white":"#94a3b8",fontWeight:800,fontSize:13,cursor:newCatName.trim()?"pointer":"not-allowed"}}>✅ Criar categoria</button></div>
            </div>
          </div>
        </div>
      )}
      <div style={{background:"linear-gradient(135deg,#1e3a8a,#1d4ed8 60%,#0ea5e9 100%)",padding:"24px 22px 50px",position:"relative",overflow:"hidden"}}>
        {[{w:190,t:-55,r:-35,op:.08},{w:110,t:18,r:110,op:.06}].map((b,i)=><div key={i} style={{position:"absolute",top:b.t,right:b.r,width:b.w,height:b.w,borderRadius:"50%",background:"white",opacity:b.op,pointerEvents:"none"}}/>)}
        <div style={{maxWidth:700,margin:"0 auto",position:"relative"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button className="lhb" onClick={onHome} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:10,padding:"8px 13px",color:"white",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"background .2s",whiteSpace:"nowrap"}}>🏡 Home</button>
              <div><p style={{color:"#bfdbfe",fontSize:10,margin:"0 0 2px",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>NOSSA CASINHA — MOISÉS E NORRARA</p><h1 style={{color:"white",fontSize:22,fontWeight:700,margin:0}}>Lista de Compras</h1></div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[{l:"Total da Lista",v:fmt(total),i:"📋"},{l:"Já Comprado",v:fmt(comprado),i:"✅"},{l:"Ainda Falta",v:fmt(pendente),i:"⏳"}].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,.12)",backdropFilter:"blur(10px)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,.2)"}}>
                <div style={{fontSize:17,marginBottom:3}}>{s.i}</div><div style={{color:"white",fontWeight:800,fontSize:14,lineHeight:1.1}}>{s.v}</div><div style={{color:"#bfdbfe",fontSize:11,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          {total>0&&<div style={{marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:"#bfdbfe",fontSize:12}}>Progresso das compras</span><span style={{color:"white",fontSize:12,fontWeight:700}}>{progress.toFixed(0)}%</span></div><div style={{background:"rgba(255,255,255,.15)",borderRadius:99,height:7,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,#38bdf8,#818cf8)",width:`${progress}%`,transition:"width .6s ease"}}/></div></div>}
        </div>
      </div>
      <div style={{maxWidth:700,margin:"18px auto 0",padding:"0 14px 60px",animation:"sIn .3s ease"}}>
        <div style={{background:"white",borderRadius:14,boxShadow:"0 4px 20px rgba(30,58,138,.08)",marginBottom:14,overflow:"hidden",border:"1px solid #e0eaff"}}>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setForm({descricao:"",valor:"",link:"",categoria:"Sala",prioridade:"média"});}} style={{width:"100%",padding:"14px 18px",display:"flex",alignItems:"center",gap:11,background:"none",border:"none",cursor:"pointer",color:"#1d4ed8",fontWeight:700,fontSize:14}}>
            <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:19,flexShrink:0}}>+</div>
            {editId?"Editar item":"Adicionar novo item"}
            <span style={{marginLeft:"auto",fontSize:11,color:"#93c5fd",fontFamily:"'DM Mono',monospace"}}>{showForm?"▲ fechar":"▼ abrir"}</span>
          </button>
          {showForm&&<div style={{padding:"0 18px 18px",borderTop:"1px solid #eff6ff"}}>
            <div style={{display:"grid",gap:11,marginTop:14}}>
              <div><label style={L.lbl}>DESCRIÇÃO *</label><input style={L.inp} placeholder="Ex: Sofá 3 lugares…" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <div><label style={L.lbl}>VALOR (R$) *</label><input style={L.inp} placeholder="0,00" value={form.valor} onChange={handleValor} inputMode="numeric"/></div>
                <div><label style={L.lbl}>PRIORIDADE</label><select style={L.inp} value={form.prioridade} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))}><option value="alta">🔴 Alta</option><option value="média">🟠 Média</option><option value="baixa">🟡 Baixa</option></select></div>
              </div>
              <div><label style={L.lbl}>CATEGORIA</label><select style={L.inp} value={form.categoria} onChange={e=>handleCatChange(e.target.value)}>{Object.keys(allCats).map(c=><option key={c} value={c}>{allCats[c]} {c}</option>)}<option disabled>──────────</option><option value="__novo__">➕ Criar nova categoria...</option></select></div>
              <div><label style={L.lbl}>LINK DO PRODUTO</label><input style={L.inp} placeholder="https://..." value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))} type="url"/></div>
              <button onClick={handleSubmit} disabled={!form.descricao.trim()||!form.valor} style={{padding:"12px",background:form.descricao.trim()&&form.valor?"linear-gradient(135deg,#1d4ed8,#0ea5e9)":"#e2e8f0",color:form.descricao.trim()&&form.valor?"white":"#94a3b8",border:"none",borderRadius:9,fontWeight:700,fontSize:14,cursor:form.descricao.trim()&&form.valor?"pointer":"not-allowed",transition:"all .2s"}}>{editId?"💾 Salvar alterações":"✅ Adicionar à lista"}</button>
            </div>
          </div>}
        </div>
        {listaItems.length>0&&<div style={{marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
          <input style={{...L.inp,background:"white",boxShadow:"0 2px 8px rgba(30,58,138,.06)"}} placeholder="🔍 Buscar item..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {[{k:"todos",l:`Todos (${listaItems.length})`},{k:"pendentes",l:`Pendentes (${listaItems.filter(i=>!i.comprado).length})`},{k:"comprados",l:`Comprados (${listaItems.filter(i=>i.comprado).length})`}].map(f=>(
              <button key={f.k} onClick={()=>setFilter(f.k)} style={{padding:"5px 13px",borderRadius:99,border:"2px solid",borderColor:filter===f.k?"#1d4ed8":"#dbeafe",background:filter===f.k?"#1d4ed8":"white",color:filter===f.k?"white":"#1d4ed8",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .15s"}}>{f.l}</button>
            ))}
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{marginLeft:"auto",padding:"5px 11px",borderRadius:99,border:"2px solid #dbeafe",background:"white",color:"#1d4ed8",fontWeight:600,fontSize:12,cursor:"pointer",outline:"none"}}>
              <option value="recente">Mais recente</option><option value="az">A → Z</option><option value="valor-asc">Menor valor</option><option value="valor-desc">Maior valor</option>
            </select>
          </div>
        </div>}
        {filtered.length===0&&<div style={{textAlign:"center",padding:"52px 20px",color:"#94a3b8"}}><div style={{fontSize:44,marginBottom:10}}>🛒</div><p style={{fontWeight:700,fontSize:14,margin:"0 0 4px",color:"#64748b"}}>{listaItems.length===0?"Nenhum item ainda!":"Nenhum item encontrado"}</p><p style={{fontSize:13,margin:0}}>{listaItems.length===0?"Adicione os móveis e utensílios do seu novo lar 💙":"Tente outro filtro"}</p></div>}
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {filtered.map(item=>(
            <div key={item.id} className="li" style={{background:item.comprado?"#f0f9ff":"white",borderRadius:11,boxShadow:deletingId===item.id?"none":"0 2px 10px rgba(30,58,138,.07)",border:`1.5px solid ${item.comprado?"#bae6fd":"#e0eaff"}`,transition:"all .3s ease",opacity:deletingId===item.id?0:1,transform:deletingId===item.id?"translateX(40px)":"none"}}>
              <div style={{padding:"13px 15px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:11}}>
                  <button onClick={()=>toggleComprado(item)} style={{width:23,height:23,borderRadius:6,flexShrink:0,marginTop:2,border:`2px solid ${item.comprado?"#0ea5e9":"#bfdbfe"}`,background:item.comprado?"linear-gradient(135deg,#0ea5e9,#1d4ed8)":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{item.comprado&&<span style={{color:"white",fontSize:11,fontWeight:900}}>✓</span>}</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}><span style={{fontSize:15}}>{allCats[item.categoria]||"📦"}</span><span style={{fontWeight:700,fontSize:14,color:item.comprado?"#64748b":"#1a3050",textDecoration:item.comprado?"line-through":"none",lineHeight:1.3}}>{item.descricao}</span></div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:99,background:"#eff6ff",color:"#1d4ed8",border:"1px solid #dbeafe"}}>{item.categoria}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:99,background:PC[item.prioridade]?.bg,color:PC[item.prioridade]?.color,border:`1px solid ${PC[item.prioridade]?.border}`}}>{PC[item.prioridade]?.label} prioridade</span>
                      {item.comprado&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:99,background:"#f0f9ff",color:"#0ea5e9",border:"1px solid #bae6fd"}}>✓ Comprado</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:7}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:16,color:item.comprado?"#64748b":"#1d4ed8"}}>{fmt(item.valor)}</span>
                      <div style={{display:"flex",gap:5}}>
                        {item.link&&<a href={item.link} target="_blank" rel="noopener noreferrer" style={{padding:"4px 9px",borderRadius:6,fontSize:11,background:"#eff6ff",color:"#1d4ed8",border:"1px solid #dbeafe",textDecoration:"none",fontWeight:600}}>🔗 Ver</a>}
                        <button onClick={()=>startEdit(item)} style={{padding:"4px 9px",borderRadius:6,fontSize:11,background:"#eff6ff",color:"#6366f1",border:"1px solid #e0e7ff",cursor:"pointer",fontWeight:600}}>✎</button>
                        <button onClick={()=>deleteItem(item.id)} style={{padding:"4px 9px",borderRadius:6,fontSize:11,background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",cursor:"pointer",fontWeight:600}}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {listaItems.length>0&&<div style={{marginTop:18,background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 20px rgba(30,58,138,.25)"}}>
          <div><p style={{color:"rgba(255,255,255,.6)",fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:2,margin:"0 0 3px",textTransform:"uppercase"}}>TOTAL GERAL DA LISTA</p><p style={{color:"white",fontSize:26,fontWeight:700,margin:0}}>{fmt(total)}</p></div>
          <div style={{textAlign:"right"}}><p style={{color:"rgba(255,255,255,.6)",fontSize:10,fontFamily:"'DM Mono',monospace",margin:"0 0 2px"}}>{listaItems.filter(i=>!i.comprado).length} item(s) pendentes</p><p style={{color:"#60a5fa",fontSize:14,fontFamily:"'DM Mono',monospace",fontWeight:700,margin:0}}>{fmt(pendente)} restando</p></div>
        </div>}
      </div>
    </div>
  );
}

const F={
  il:{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"#7aa0c8",display:"block",marginBottom:5},
  inp:{width:"100%",background:"#f4f8ff",border:"1px solid #ccdcf0",borderRadius:6,padding:"9px 11px",color:"#1a3050",fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"border-color .2s"},
  bp:{width:"100%",padding:"10px 14px",background:"#2563eb",border:"none",borderRadius:6,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",transition:"filter .2s"},
  bg:{background:"transparent",border:"1px solid #ccdcf0",borderRadius:6,padding:"9px 13px",color:"#7aa0c8",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",transition:"background .2s"},
};
const L={
  lbl:{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"#1d4ed8",display:"block",marginBottom:5,fontWeight:700},
  inp:{width:"100%",background:"#f8faff",border:"1.5px solid #dbeafe",borderRadius:8,padding:"9px 12px",color:"#1a3050",fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"border-color .2s"},
};
