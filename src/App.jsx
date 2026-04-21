import { useState, useEffect } from "react";

const TX_KEY   = "casa-transacoes";
const COST_KEY = "casa-custos";
const CATS_KEY = "casa-categorias";

const storage = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, val); } catch {} },
};

const DEFAULT_CATS = [
  { id:"doc",         label:"Documentação Financiamento", color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe", icon:"📄" },
  { id:"obra",        label:"Entrada Obra",               color:"#0284c7", bg:"#e0f2fe", border:"#bae6fd", icon:"🏗️" },
  { id:"construtora", label:"Construtora",                color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe", icon:"🏢" },
  { id:"terreno",     label:"Terreno",                    color:"#059669", bg:"#ecfdf5", border:"#a7f3d0", icon:"🌍" },
];

const PRESET_COLORS = [
  { color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe" },
  { color:"#0284c7", bg:"#e0f2fe", border:"#bae6fd" },
  { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
  { color:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
  { color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
  { color:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
  { color:"#7c3aed", bg:"#faf5ff", border:"#e9d5ff" },
  { color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc" },
  { color:"#65a30d", bg:"#f7fee7", border:"#d9f99d" },
  { color:"#db2777", bg:"#fdf2f8", border:"#f9a8d4" },
];

const fmt = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v??0);
const fmtDate = (d) => new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
const today   = () => new Date().toISOString().split("T")[0];
const isEntrada = (t) => t.startsWith("guardado");
const isPayment = (t) => t.startsWith("pagamento");
const personOf  = (t) => t.endsWith("moises") ? "Moisés" : "Norrara";
const labelOf   = (t) => ({"guardado-moises":"💙 Guardado Moisés","guardado-norrara":"💜 Guardado Norrara","retirada-moises":"↙ Retirada Moisés","retirada-norrara":"↙ Retirada Norrara","pagamento-moises":"💳 Pagamento Moisés","pagamento-norrara":"💳 Pagamento Norrara"}[t]??t);
const colorOf   = (t) => isEntrada(t) ? (personOf(t)==="Moisés"?"#2563eb":"#7c3aed") : isPayment(t) ? "#d97706" : "#dc2626";

const SEED_COSTS = [
  {id:1, category:"doc",desc:"Certidão de matrícula",amount:147.56,paidAmount:0},
  {id:2, category:"doc",desc:"ART do CREA",amount:271.47,paidAmount:0},
  {id:3, category:"doc",desc:"Taxa de Engenharia Caixa",amount:750.00,paidAmount:0},
  {id:4, category:"doc",desc:"Alvará de Construção",amount:80.92,paidAmount:0},
  {id:5, category:"doc",desc:"Certidão de inteiro teor",amount:468.24,paidAmount:0},
  {id:6, category:"doc",desc:"Vistorias Engenharia CAIXA (2)",amount:1500.00,paidAmount:0},
  {id:7, category:"doc",desc:"Guias INSS da Obra",amount:2278.35,paidAmount:0},
  {id:8, category:"doc",desc:"Habite-se",amount:100.00,paidAmount:0},
  {id:9, category:"doc",desc:"Averbação da construção",amount:501.39,paidAmount:0},
  {id:10,category:"doc",desc:"Renov. da Certidão Matrícula",amount:168.78,paidAmount:0},
  {id:11,category:"doc",desc:"Taxa contratação Caixa (1,5%)",amount:2433.64,paidAmount:0},
  {id:12,category:"doc",desc:"Reg. Alienação Fiduciária 1 (50%)",amount:571.18,paidAmount:0},
  {id:13,category:"doc",desc:"Reg. Alienação Fiduciária 2 (50%)",amount:1199.71,paidAmount:0},
  {id:14,category:"doc",desc:"Certidão Atualizada",amount:168.78,paidAmount:0},
  {id:15,category:"doc",desc:"Juros de obra",amount:2649.53,paidAmount:0},
  {id:16,category:"obra",desc:"Entrada Obra",amount:7756.00,paidAmount:0},
  {id:17,category:"construtora",desc:"Construtora",amount:6000.00,paidAmount:0},
];
const SEED_TX = [
  {id:101,type:"guardado-norrara",desc:"Economia inicial Norrara",amount:5533.00,date:"2026-04-21"},
  {id:102,type:"guardado-moises", desc:"Economia inicial Moisés", amount:5291.24,date:"2026-04-21"},
];

export default function App() {
  const [tab,setTab]         = useState("dashboard");
  const [categories,setCats] = useState(DEFAULT_CATS);
  const [transactions,setTx] = useState([]);
  const [costs,setCosts]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [toast,setToast]     = useState(null);
  const [txForm,setTxForm]   = useState({desc:"",amount:"",type:"guardado-moises",date:today()});
  const [costForm,setCostForm]= useState({desc:"",amount:"",category:"doc"});
  const [editCost,setEditCost]= useState(null);
  const [showNewCat,setShowNewCat] = useState(false);
  const [newCat,setNewCat]   = useState({label:"",icon:"📦",colorIdx:0});
  const [editCat,setEditCat] = useState(null); // id da categoria sendo editada
  const [payModal,setPayModal]= useState({open:false,person:null});
  const [payForm,setPayForm]  = useState({costId:null,value:"",desc:""});

  const showToast = (msg,ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),2800); };

  useEffect(()=>{
    const loadKey = (key,seed,setter,transform) => {
      try {
        const r=storage.get(key); const s=r?JSON.parse(r.value):null;
        if(s&&(Array.isArray(s)?s.length>0:true)){ setter(transform?transform(s):s); }
        else { setter(seed); if(seed) storage.set(key,JSON.stringify(seed)); }
      } catch { setter(seed); if(seed) storage.set(key,JSON.stringify(seed)); }
    };
    loadKey(CATS_KEY, DEFAULT_CATS, setCats, null);
    loadKey(TX_KEY,   SEED_TX,      setTx,  null);
    loadKey(COST_KEY, SEED_COSTS,   setCosts, s=>s.map(c=>({paidAmount:0,...c})));
    setLoading(false);
  },[]);

  const saveTx    = d => { setTx(d);    storage.set(TX_KEY,  JSON.stringify(d)); };
  const saveCosts = d => { setCosts(d); storage.set(COST_KEY,JSON.stringify(d)); };
  const saveCats  = d => { setCats(d);  storage.set(CATS_KEY,JSON.stringify(d)); };

  // ── Computed ────────────────────────────────────────────────────
  const totalSaved   = transactions.reduce((a,t)=>isEntrada(t.type)?a+t.amount:a-t.amount,0);
  const totalPaidOut = costs.reduce((a,c)=>a+(c.paidAmount||0),0);
  const totalGross   = costs.reduce((a,c)=>a+c.amount,0);
  const totalCosts   = costs.reduce((a,c)=>a+Math.max(c.amount-(c.paidAmount||0),0),0);
  const remaining    = Math.max(totalCosts-totalSaved,0);
  const progress      = totalGross>0 ? Math.min(totalPaidOut/totalGross*100,100) : 0;
  const progressSaved = totalGross>0 ? Math.min(totalSaved/totalGross*100,100)   : 0;
  const catTotal     = id => costs.filter(c=>c.category===id).reduce((a,c)=>a+Math.max(c.amount-(c.paidAmount||0),0),0);
  const personSaved  = p  => transactions.filter(t=>personOf(t.type)===p).reduce((a,t)=>isEntrada(t.type)?a+t.amount:a-t.amount,0);
  const totalMoises  = personSaved("Moisés");
  const totalNorrara = personSaved("Norrara");
  const isFullyPaid  = c => (c.paidAmount||0)>=c.amount;
  const paidPct      = c => c.amount>0?Math.min((c.paidAmount||0)/c.amount*100,100):0;

  // ── Tx actions ──────────────────────────────────────────────────
  const addTx = () => {
    if(isPayment(txForm.type)){ openPayModal(txForm.type.replace("pagamento-","")); return; }
    if(!txForm.desc.trim()||!txForm.amount) return showToast("Preencha todos os campos.",false);
    const v=parseFloat(txForm.amount);
    if(isNaN(v)||v<=0) return showToast("Valor inválido.",false);
    saveTx([{id:Date.now(),desc:txForm.desc.trim(),amount:v,type:txForm.type,date:txForm.date},...transactions]);
    setTxForm(p=>({desc:"",amount:"",type:p.type,date:today()}));
    showToast(isEntrada(txForm.type)?`Economia de ${personOf(txForm.type)} registrada! 🏠`:`Retirada de ${personOf(txForm.type)} registrada.`);
  };
  const removeTx = id => { saveTx(transactions.filter(t=>t.id!==id)); showToast("Lançamento removido."); };

  // ── Cost actions ────────────────────────────────────────────────
  const addCost = () => {
    if(!costForm.desc.trim()||!costForm.amount) return showToast("Preencha todos os campos.",false);
    const v=parseFloat(costForm.amount);
    if(isNaN(v)||v<=0) return showToast("Valor inválido.",false);
    if(editCost){
      saveCosts(costs.map(c=>c.id===editCost?{...c,desc:costForm.desc.trim(),amount:v,category:costForm.category}:c));
      setEditCost(null); showToast("Custo atualizado.");
    } else {
      saveCosts([...costs,{id:Date.now(),desc:costForm.desc.trim(),amount:v,category:costForm.category,paidAmount:0}]);
      showToast("Custo adicionado.");
    }
    setCostForm(p=>({desc:"",amount:"",category:p.category}));
  };
  const startEditCost = c => { setEditCost(c.id); setCostForm({desc:c.desc,amount:String(c.amount),category:c.category??"doc"}); };
  const removeCost    = id => { saveCosts(costs.filter(c=>c.id!==id)); showToast("Custo removido."); };

  // ── Category actions ────────────────────────────────────────────
  const addCategory = () => {
    if(!newCat.label.trim()) return showToast("Digite o nome da categoria.",false);
    const preset=PRESET_COLORS[newCat.colorIdx];
    if(editCat){
      // Editar categoria existente
      const updated=categories.map(c=>c.id===editCat?{...c,label:newCat.label.trim(),icon:newCat.icon||"📦",...preset}:c);
      saveCats(updated);
      showToast(`Categoria atualizada!`);
    } else {
      // Criar nova categoria
      const cat={id:"cat_"+Date.now(),label:newCat.label.trim(),icon:newCat.icon||"📦",...preset};
      saveCats([...categories,cat]);
      showToast(`Categoria "${cat.label}" criada!`);
    }
    cancelCatForm();
  };
  const startEditCat = (cat) => {
    const colorIdx=PRESET_COLORS.findIndex(p=>p.color===cat.color);
    setNewCat({label:cat.label,icon:cat.icon,colorIdx:colorIdx>=0?colorIdx:0});
    setEditCat(cat.id);
    setShowNewCat(true);
  };
  const cancelCatForm = () => {
    setNewCat({label:"",icon:"📦",colorIdx:0});
    setEditCat(null);
    setShowNewCat(false);
  };
  const removeCategory = id => {
    if(DEFAULT_CATS.find(c=>c.id===id)) return showToast("Não é possível remover categorias padrão.",false);
    saveCats(categories.filter(c=>c.id!==id)); showToast("Categoria removida.");
  };

  // ── Payment modal ───────────────────────────────────────────────
  const openPayModal = person => { setPayModal({open:true,person}); setPayForm({costId:null,value:"",desc:""}); };
  const selectPayCost = costId => {
    const c=costs.find(x=>x.id===costId); if(!c) return;
    setPayForm(p=>({...p,costId,desc:`Pagamento - ${c.desc}`,value:""}));
  };
  const selectedCostRemaining = () => {
    const c=costs.find(x=>x.id===payForm.costId); if(!c) return 0;
    return Math.max(c.amount-(c.paidAmount||0),0);
  };
  const submitPayment = () => {
    if(!payForm.costId) return showToast("Selecione um custo.",false);
    const amount=parseFloat(payForm.value);
    if(isNaN(amount)||amount<=0) return showToast("Informe um valor válido.",false);
    const maxVal=selectedCostRemaining();
    if(amount>maxVal+0.01) return showToast(`Valor máximo disponível: ${fmt(maxVal)}`,false);
    const cost=costs.find(c=>c.id===payForm.costId);
    const type=`pagamento-${payModal.person}`;
    const newPaid=Math.min((cost.paidAmount||0)+amount,cost.amount);
    const fully=newPaid>=cost.amount;
    saveTx([{id:Date.now(),type,desc:payForm.desc||`Pagamento - ${cost.desc}`,amount,date:today()},...transactions]);
    saveCosts(costs.map(c=>c.id===cost.id?{...c,paidAmount:newPaid}:c));
    setPayModal({open:false,person:null});
    setPayForm({costId:null,value:"",desc:""});
    showToast(fully?`${cost.desc} pago 100%! ✅`:`Pagamento de ${fmt(amount)} registrado! 💳`);
  };

  const TABS=[{id:"dashboard",label:"Visão Geral"},{id:"lancamentos",label:"Lançamentos"},{id:"custos",label:"Custos"}];

  if(loading) return (
    <div style={S.root}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,letterSpacing:4,color:"#7aa0c8"}}>CARREGANDO…</span>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#eef3fb} ::-webkit-scrollbar-thumb{background:#93b8e0;border-radius:2px}
        input,select{outline:none} input::placeholder{color:#a8c4e0}
        input:focus,select:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
        .tab-btn:hover{background:rgba(37,99,235,.06)!important}
        .row-hover:hover{background:rgba(37,99,235,.04)!important}
        .btn-primary:hover{filter:brightness(.9)}
        .btn-ghost:hover{background:rgba(37,99,235,.08)!important}
        .cost-row:hover .cost-actions{opacity:1!important}
        .swatch:hover{transform:scale(1.18)}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:24,right:24,zIndex:1000,background:toast.ok?"#eff8ff":"#fff0f0",border:`1px solid ${toast.ok?"#93c5fd":"#fca5a5"}`,color:toast.ok?"#1d4ed8":"#dc2626",padding:"10px 18px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,animation:"slideIn .2s ease",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>{toast.msg}</div>}

      {/* ── Payment Modal ── */}
      {payModal.open&&(
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(10,20,50,.45)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s ease",padding:"16px"}} onClick={e=>e.target===e.currentTarget&&setPayModal({open:false,person:null})}>
          <div style={{background:"#fff",borderRadius:14,width:"min(96vw,520px)",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.22)"}}>

            {/* Modal header */}
            <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #dae6f5",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
              <div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:payModal.person==="moises"?"#2563eb":"#7c3aed",marginBottom:4}}>
                  {payModal.person==="moises"?"💙 PAGAMENTO MOISÉS":"💜 PAGAMENTO NORRARA"}
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#1a3050",fontWeight:400}}>Registrar Pagamento de Custo</div>
              </div>
              <button onClick={()=>setPayModal({open:false,person:null})} style={{background:"none",border:"none",fontSize:22,color:"#9ab8d8",cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
            </div>

            {/* Custo selector */}
            <div style={{padding:"16px 22px 0"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"#7aa0c8",marginBottom:10}}>SELECIONE O CUSTO</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:280,overflowY:"auto"}}>
                {costs.filter(c=>!isFullyPaid(c)).length===0
                  ? <div style={{textAlign:"center",padding:"20px 0",color:"#9ab8d8",fontSize:13}}>Todos os custos já foram pagos! 🎉</div>
                  : costs.filter(c=>!isFullyPaid(c)).map(c=>{
                      const cat=categories.find(x=>x.id===c.category);
                      const sel=payForm.costId===c.id;
                      const pp=paidPct(c);
                      const rem=Math.max(c.amount-(c.paidAmount||0),0);
                      return(
                        <div key={c.id} onClick={()=>selectPayCost(c.id)} style={{padding:"10px 12px",borderRadius:8,border:`1.5px solid ${sel?(cat?.color||"#2563eb"):"#dae6f5"}`,background:sel?(cat?.bg||"#eff6ff"):"#f8fbff",cursor:"pointer",transition:"all .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${sel?(cat?.color||"#2563eb"):"#ccdcf0"}`,background:sel?(cat?.color||"#2563eb"):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                {sel&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                              </div>
                              <div>
                                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a3050"}}>{c.desc}</div>
                                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8",marginTop:1}}>{cat?.icon} {cat?.label}{pp>0?` · ${pp.toFixed(0)}% já pago`:""}</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                              <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:cat?.color||"#2563eb"}}>{fmt(rem)}</div>
                              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>restante</div>
                            </div>
                          </div>
                          {pp>0&&<div style={{marginTop:6,background:"rgba(255,255,255,.7)",borderRadius:3,height:3}}><div style={{width:`${pp}%`,height:"100%",background:cat?.color||"#2563eb",borderRadius:3,opacity:.6}}/></div>}
                        </div>
                      );
                    })
                }
              </div>
            </div>

            {/* Valor e descrição */}
            {payForm.costId&&(
              <div style={{padding:"14px 22px 0"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div>
                    <label style={S.inputLabel}>VALOR PAGO (R$)</label>
                    <input style={S.input} type="number" min="0.01" step="0.01" placeholder="0,00" autoFocus
                      value={payForm.value} onChange={e=>setPayForm(p=>({...p,value:e.target.value}))}
                      onKeyDown={e=>e.key==="Enter"&&submitPayment()} />
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8",marginTop:5}}>
                      Máximo disponível: <strong style={{color:"#0284c7"}}>{fmt(selectedCostRemaining())}</strong>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-start",paddingTop:18}}>
                    {parseFloat(payForm.value)>0&&(
                      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#0284c7",letterSpacing:2,marginBottom:4}}>EQUIVALE A</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#0284c7",fontWeight:400}}>
                          {(() => { const c=costs.find(x=>x.id===payForm.costId); return c&&c.amount>0 ? (parseFloat(payForm.value)/c.amount*100).toFixed(1)+"%" : "-"; })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{marginBottom:4}}>
                  <label style={S.inputLabel}>DESCRIÇÃO (OPCIONAL)</label>
                  <input style={S.input} placeholder="Descrição do pagamento" value={payForm.desc}
                    onChange={e=>setPayForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submitPayment()} />
                </div>
              </div>
            )}

            <div style={{padding:"16px 22px 20px",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="btn-ghost" onClick={()=>setPayModal({open:false,person:null})} style={S.btnGhost}>Cancelar</button>
              <button className="btn-primary" onClick={submitPayment}
                style={{...S.btnPrimary,width:"auto",padding:"10px 24px",background:payModal.person==="moises"?"#2563eb":"#7c3aed"}}>
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>NOSSA CASINHA - MOISÉS E NORRARA</div>
          <h1 style={S.h1}>Planejamento Financeiro</h1>
        </div>
        <div style={{textAlign:"right"}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:"rgba(255,255,255,.6)",textTransform:"uppercase",display:"block",marginBottom:4}}>PROGRESSO GERAL</span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:"#fff",display:"block",lineHeight:1}}>{progressSaved.toFixed(1)}%</span>
        </div>
      </header>

      <nav style={S.nav}>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{...S.tabBtn,...(tab===t.id?S.tabActive:{})}}>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={S.main}>

        {/* ══════ VISÃO GERAL ══════ */}
        {tab==="dashboard"&&(
          <div style={{animation:"slideIn .3s ease"}}>

            <div style={S.kpiGrid}>
              <KpiCard label="TOTAL GUARDADO"   value={fmt(totalSaved)}  sub={`em ${transactions.filter(t=>isEntrada(t.type)).length} depósitos`} accent="#2563eb" icon="🏦"/>
              <KpiCard label="CUSTOS RESTANTES" value={fmt(totalCosts)}  sub={`${costs.filter(c=>!isFullyPaid(c)).length} custo(s) em aberto`}   accent="#6366f1" icon="📋"/>
              <KpiCard label="FALTA GUARDAR"    value={fmt(remaining)}   sub={remaining<=0?"Meta atingida! 🎉":`${(100-progress).toFixed(1)}% do objetivo`} accent={remaining<=0?"#16a34a":"#0284c7"} icon={remaining<=0?"✅":"🎯"}/>
            </div>

            {/* ── Barra: Meta Guardado ── */}
            <div style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <div>
                  <span style={S.label}>💙 META GUARDADO</span>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8",marginTop:2}}>quanto do total já foi guardado</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#2563eb",fontWeight:400}}>{progressSaved.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{...S.progressTrack,height:10,marginBottom:8}}>
                <div style={{...S.progressFill,width:`${progressSaved}%`,background:"linear-gradient(90deg,#1e4d9b 0%,#2563eb 60%,#60a5fa 100%)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#2563eb"}}>{fmt(totalSaved)} guardado</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8"}}>meta: {fmt(totalGross)}</span>
              </div>
            </div>

            {/* ── Barra: Custos Pagos ── */}
            <div style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <div>
                  <span style={S.label}>✅ CUSTOS PAGOS</span>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8",marginTop:2}}>quanto do total de custos já foi quitado</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#059669",fontWeight:400}}>{progress.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{...S.progressTrack,height:10,marginBottom:8}}>
                <div style={{...S.progressFill,width:`${progress}%`,background:"linear-gradient(90deg,#065f46 0%,#059669 60%,#34d399 100%)",boxShadow:"0 0 8px rgba(5,150,105,.3)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#059669"}}>{fmt(totalPaidOut)} pago</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8"}}>total: {fmt(totalGross)}</span>
              </div>
            </div>

            {/* ── ÚLTIMOS LANÇAMENTOS (acima de custos) ── */}
            <div style={S.card}>
              <div style={{...S.label,marginBottom:14}}>ÚLTIMOS LANÇAMENTOS</div>
              {transactions.length===0?<EmptyState msg="Nenhum lançamento ainda. Vá em Lançamentos para adicionar."/>:(
                <div>
                  {transactions.slice(0,5).map(t=>(
                    <div key={t.id} className="row-hover" style={S.txRow}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:16}}>{isEntrada(t.type)?"⬆":isPayment(t.type)?"💳":"⬇"}</span>
                        <div>
                          <div style={S.txDesc}>{t.desc}</div>
                          <div style={S.txDate}>{fmtDate(t.date)} · {labelOf(t.type)}</div>
                        </div>
                      </div>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:isEntrada(t.type)?"#16a34a":isPayment(t.type)?"#d97706":"#dc2626"}}>
                        {isEntrada(t.type)?"+":"-"}{fmt(t.amount)}
                      </span>
                    </div>
                  ))}
                  {transactions.length>5&&(
                    <button onClick={()=>setTab("lancamentos")} style={{...S.btnGhost,marginTop:8,fontSize:12}}>
                      Ver todos os {transactions.length} lançamentos →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── COMPOSIÇÃO DOS CUSTOS ── */}
            <div style={S.card}>
              <div style={{...S.label,marginBottom:16}}>COMPOSIÇÃO DOS CUSTOS</div>
              {costs.length===0?<EmptyState msg="Nenhum custo cadastrado. Vá em Custos para adicionar."/>:(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {categories.map(cat=>{
                    const items=costs.filter(c=>c.category===cat.id);
                    if(items.length===0) return null;
                    const total=items.reduce((a,c)=>a+c.amount,0);
                    const paid=items.reduce((a,c)=>a+(c.paidAmount||0),0);
                    const pct=totalGross>0?(total/totalGross)*100:0;
                    return(
                      <div key={cat.id} style={{background:cat.bg,border:`1px solid ${cat.border}`,borderRadius:8,padding:"12px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:16}}>{cat.icon}</span>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:cat.color}}>{cat.label}</span>
                          </div>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:cat.color}}>{fmt(total-paid)}</span>
                        </div>
                        <div style={{background:"rgba(255,255,255,.7)",borderRadius:3,height:5,marginBottom:10}}>
                          <div style={{width:`${pct}%`,height:"100%",background:cat.color,borderRadius:3,opacity:.75}}/>
                        </div>
                        {items.map((item,idx)=>{
                          const fp=isFullyPaid(item);
                          return(
                            <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:idx<items.length-1?"1px solid rgba(255,255,255,0.7)":"none",opacity:fp?.6:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                {fp&&<span style={{fontSize:13}}>✅</span>}
                                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#4a6080",textDecoration:fp?"line-through":"none"}}>· {item.desc}</span>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:cat.color,opacity:.85}}>{fmt(Math.max(item.amount-(item.paidAmount||0),0))}</span>
                                {(item.paidAmount||0)>0&&!fp&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>{paidPct(item).toFixed(0)}% pago</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ LANÇAMENTOS ══════ */}
        {tab==="lancamentos"&&(
          <div style={{animation:"slideIn .3s ease"}}>
            <div style={S.card}>
              <div style={{...S.label,marginBottom:16}}>NOVO LANÇAMENTO</div>
              <div style={S.formGrid}>
                <div>
                  <label style={S.inputLabel}>Tipo</label>
                  <select style={S.input} value={txForm.type} onChange={e=>setTxForm(p=>({...p,type:e.target.value}))}>
                    <optgroup label="Guardar"><option value="guardado-moises">💙 Guardado Moisés</option><option value="guardado-norrara">💜 Guardado Norrara</option></optgroup>
                    <optgroup label="Retiradas"><option value="retirada-moises">↙ Retirada Moisés</option><option value="retirada-norrara">↙ Retirada Norrara</option></optgroup>
                    <optgroup label="Pagamentos"><option value="pagamento-moises">💳 Pagamento Moisés</option><option value="pagamento-norrara">💳 Pagamento Norrara</option></optgroup>
                  </select>
                </div>
                {isPayment(txForm.type)?(
                  <div style={{display:"flex",alignItems:"flex-end",gridColumn:"span 3"}}>
                    <div style={{flex:1,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px"}}>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#92400e"}}>💳 Clique em <strong>"Selecionar Custo"</strong> para escolher qual custo está sendo pago e informar o valor.</span>
                    </div>
                  </div>
                ):(
                  <>
                    <div><label style={S.inputLabel}>Descrição</label><input style={S.input} placeholder="Ex.: Reserva de junho…" value={txForm.desc} onChange={e=>setTxForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTx()}/></div>
                    <div><label style={S.inputLabel}>Valor (R$)</label><input style={S.input} type="number" min="0" step="0.01" placeholder="0,00" value={txForm.amount} onChange={e=>setTxForm(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTx()}/></div>
                    <div><label style={S.inputLabel}>Data</label><input style={S.input} type="date" value={txForm.date} onChange={e=>setTxForm(p=>({...p,date:e.target.value}))}/></div>
                  </>
                )}
                <div style={{display:"flex",alignItems:"flex-end"}}>
                  <button className="btn-primary" onClick={addTx} style={{...S.btnPrimary,background:isPayment(txForm.type)?"#d97706":txForm.type.includes("norrara")?"#7c3aed":"#2563eb"}}>
                    {isPayment(txForm.type)?"Selecionar Custo →":"Registrar"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"14px 18px",borderTop:"3px solid #2563eb"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:"#2563eb",marginBottom:6}}>💙 MOISÉS</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#1e4d9b",fontWeight:400}}>{fmt(totalMoises)}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#7aa0c8",marginTop:3}}>{transactions.filter(t=>personOf(t.type)==="Moisés"&&isEntrada(t.type)).length} depósito(s)</div>
              </div>
              <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:10,padding:"14px 18px",borderTop:"3px solid #7c3aed"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:"#7c3aed",marginBottom:6}}>💜 NORRARA</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#5b21b6",fontWeight:400}}>{fmt(totalNorrara)}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#7aa0c8",marginTop:3}}>{transactions.filter(t=>personOf(t.type)==="Norrara"&&isEntrada(t.type)).length} depósito(s)</div>
              </div>
            </div>

            <div style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={S.label}>HISTÓRICO ({transactions.length})</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#2563eb"}}>Saldo: {fmt(totalSaved)}</span>
              </div>
              {transactions.length===0?<EmptyState msg="Nenhum lançamento registrado."/>:(
                <div>
                  {transactions.map(t=>{
                    const entrada=isEntrada(t.type),payment=isPayment(t.type),col=colorOf(t.type);
                    return(
                      <div key={t.id} className="row-hover" style={S.txRow}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:`${col}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:col}}>
                            {entrada?"↑":payment?"💳":"↓"}
                          </div>
                          <div><div style={S.txDesc}>{t.desc}</div><div style={S.txDate}>{fmtDate(t.date)} · {labelOf(t.type)}</div></div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:entrada?"#16a34a":payment?"#d97706":"#dc2626"}}>{entrada?"+":"-"}{fmt(t.amount)}</span>
                          <button className="btn-ghost" onClick={()=>removeTx(t.id)} style={{...S.btnGhost,padding:"4px 8px",fontSize:11,color:"#dc2626",borderColor:"#fecaca"}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ CUSTOS ══════ */}
        {tab==="custos"&&(
          <div style={{animation:"slideIn .3s ease"}}>
            <div style={S.card}>
              <div style={{...S.label,marginBottom:16}}>{editCost?"EDITAR CUSTO":"NOVO CUSTO"}</div>
              <div style={S.formGrid}>
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={S.inputLabel}>Categoria</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {categories.map(cat=>(
                      <button key={cat.id} onClick={()=>setCostForm(p=>({...p,category:cat.id}))}
                        style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${costForm.category===cat.id?cat.color:"#ccdcf0"}`,background:costForm.category===cat.id?cat.bg:"transparent",color:costForm.category===cat.id?cat.color:"#7aa0c8",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:costForm.category===cat.id?500:400,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:5}}>
                        <span>{cat.icon}</span> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{gridColumn:"1 / -1"}}><label style={S.inputLabel}>Descrição do Item</label><input style={S.input} placeholder="Ex.: ITBI, Escritura…" value={costForm.desc} onChange={e=>setCostForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCost()}/></div>
                <div><label style={S.inputLabel}>Valor (R$)</label><input style={S.input} type="number" min="0" step="0.01" placeholder="0,00" value={costForm.amount} onChange={e=>setCostForm(p=>({...p,amount:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCost()}/></div>
                <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                  <button className="btn-primary" onClick={addCost} style={S.btnPrimary}>{editCost?"Salvar":"Adicionar"}</button>
                  {editCost&&<button className="btn-ghost" onClick={()=>{setEditCost(null);setCostForm({desc:"",amount:"",category:"doc"});}} style={S.btnGhost}>Cancelar</button>}
                </div>
              </div>
            </div>

            {/* Categorias */}
            <div style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={S.label}>CATEGORIAS ({categories.length})</span>
                <button className="btn-ghost" onClick={()=>{ if(showNewCat) cancelCatForm(); else setShowNewCat(true); }}
                  style={{...S.btnGhost,padding:"6px 14px",fontSize:12,color:showNewCat?"#dc2626":"#2563eb",borderColor:showNewCat?"#fecaca":"#ccdcf0"}}>
                  {showNewCat?"✕ Cancelar":"+ Nova Categoria"}
                </button>
              </div>
              {showNewCat&&(
                <div style={{marginTop:14,padding:14,background:"#f4f8ff",borderRadius:8,border:`1.5px solid ${editCat?"#c7d2fe":"#ccdcf0"}`}}>
                  {editCat&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"#6366f1",marginBottom:10}}>✎ EDITANDO CATEGORIA</div>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:12}}>
                    <div><label style={S.inputLabel}>NOME DA CATEGORIA</label><input style={S.input} placeholder="Ex.: Mobília, Acabamento…" value={newCat.label} onChange={e=>setNewCat(p=>({...p,label:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCategory()}/></div>
                    <div><label style={S.inputLabel}>ÍCONE</label><input style={{...S.input,width:64,textAlign:"center",fontSize:20}} maxLength={2} value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))}/></div>
                  </div>
                  <label style={{...S.inputLabel,marginBottom:8}}>COR</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                    {PRESET_COLORS.map((c,i)=>(
                      <div key={i} className="swatch" onClick={()=>setNewCat(p=>({...p,colorIdx:i}))}
                        style={{width:28,height:28,borderRadius:"50%",background:c.color,cursor:"pointer",transition:"transform .15s",border:`3px solid ${newCat.colorIdx===i?"#1a3050":"transparent"}`,boxShadow:newCat.colorIdx===i?`0 0 0 2px #fff,0 0 0 4px ${c.color}`:"none"}}/>
                    ))}
                  </div>
                  <button className="btn-primary" onClick={addCategory} style={{...S.btnPrimary,background:PRESET_COLORS[newCat.colorIdx].color}}>
                    {editCat?"Salvar Alterações":"Criar Categoria"}
                  </button>
                </div>
              )}
              <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
                {categories.map(cat=>{
                  const isDefault=!!DEFAULT_CATS.find(d=>d.id===cat.id);
                  return(
                    <div key={cat.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:6,background:cat.bg,border:`1.5px solid ${editCat===cat.id?cat.color:cat.border}`,transition:"border-color .2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:18}}>{cat.icon}</span>
                        <div>
                          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:cat.color,fontWeight:500}}>{cat.label}</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>{costs.filter(c=>c.category===cat.id).length} item(ns)</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn-ghost" onClick={()=>editCat===cat.id?cancelCatForm():startEditCat(cat)}
                          style={{...S.btnGhost,padding:"4px 10px",fontSize:11,color:editCat===cat.id?"#dc2626":cat.color,borderColor:editCat===cat.id?"#fecaca":cat.border}}>
                          {editCat===cat.id?"✕":"✎"}
                        </button>
                        {!isDefault&&(
                          <button className="btn-ghost" onClick={()=>removeCategory(cat.id)}
                            style={{...S.btnGhost,padding:"4px 10px",fontSize:11,color:"#dc2626",borderColor:"#fecaca"}}>🗑</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {costs.length>0&&(
              <div style={{...S.card,background:"linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)",border:"1px solid #93c5fd"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={S.label}>CUSTOS TOTAIS ATIVOS</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:"#1e4d9b",fontWeight:400,marginTop:4}}>{fmt(totalCosts)}</div></div>
                  <div style={{textAlign:"right"}}><div style={S.label}>FALTA GUARDAR</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:remaining<=0?"#16a34a":"#0284c7",fontWeight:400,marginTop:4}}>{fmt(remaining)}</div></div>
                </div>
              </div>
            )}

            {categories.map(cat=>{
              const items=costs.filter(c=>c.category===cat.id);
              const subtotal=items.reduce((a,c)=>a+Math.max(c.amount-(c.paidAmount||0),0),0);
              return(
                <div key={cat.id} style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:items.length>0?12:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>{cat.icon}</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:cat.color}}>{cat.label}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,background:cat.bg,color:cat.color,border:`1px solid ${cat.border}`,borderRadius:10,padding:"2px 8px"}}>{items.length} item(ns)</span>
                    </div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:cat.color}}>{fmt(subtotal)}</span>
                  </div>
                  {items.length===0?(
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#9ab8d8",paddingTop:4}}>Selecione esta categoria no formulário acima para adicionar itens.</div>
                  ):(
                    <div>
                      {items.map((c,i)=>{
                        const fp=isFullyPaid(c),pp=paidPct(c),rem=Math.max(c.amount-(c.paidAmount||0),0);
                        return(
                          <div key={c.id} className="cost-row row-hover" style={{...S.txRow,opacity:fp?.65:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b0c8e0",minWidth:18}}>{String(i+1).padStart(2,"0")}</div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  {fp&&<span style={{fontSize:13}}>✅</span>}
                                  <span style={{...S.txDesc,textDecoration:fp?"line-through":"none"}}>{c.desc}</span>
                                </div>
                                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
                                  <span style={S.txDate}>{pp.toFixed(0)}% pago</span>
                                  {pp>0&&pp<100&&<div style={{flex:1,maxWidth:80,background:"#dae6f5",borderRadius:2,height:3}}><div style={{width:`${pp}%`,height:"100%",background:cat.color,borderRadius:2}}/></div>}
                                </div>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:cat.color}}>{fmt(rem)}</div>
                                {pp>0&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#9ab8d8"}}>de {fmt(c.amount)}</div>}
                              </div>
                              <div className="cost-actions" style={{display:"flex",gap:6,opacity:0,transition:"opacity .2s"}}>
                                <button className="btn-ghost" onClick={()=>startEditCost(c)} style={{...S.btnGhost,padding:"4px 8px",fontSize:11,color:"#6366f1"}}>✎</button>
                                <button className="btn-ghost" onClick={()=>removeCost(c.id)} style={{...S.btnGhost,padding:"4px 8px",fontSize:11,color:"#dc2626",borderColor:"#fecaca"}}>✕</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{borderTop:"1px solid #dae6f5",marginTop:6,paddingTop:10,display:"flex",justifyContent:"flex-end",gap:16}}>
                        <span style={{...S.label,fontSize:10}}>SUBTOTAL RESTANTE</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:cat.color}}>{fmt(subtotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({label,value,sub,accent,icon}){
  return(
    <div style={{...S.card,borderTop:`3px solid ${accent}`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:12,right:14,fontSize:22,opacity:.2}}>{icon}</div>
      <div style={S.label}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:accent,fontWeight:400,margin:"8px 0 4px",lineHeight:1}}>{value}</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8",marginTop:2}}>{sub}</div>
    </div>
  );
}
function EmptyState({msg}){
  return(
    <div style={{textAlign:"center",padding:"28px 16px",color:"#9ab8d8",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
      <div style={{fontSize:28,marginBottom:8,opacity:.5}}>🏗️</div>{msg}
    </div>
  );
}
const S={
  root:{minHeight:"100vh",background:"#eef3fb",color:"#1a3050",fontFamily:"'DM Sans',sans-serif"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"28px 28px 20px",background:"linear-gradient(135deg,#1e4d9b 0%,#2563eb 60%,#3b82f6 100%)"},
  eyebrow:{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:4,color:"rgba(255,255,255,.6)",marginBottom:6},
  h1:{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:400,color:"#ffffff",letterSpacing:1},
  label:{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:3,color:"#7aa0c8",textTransform:"uppercase"},
  nav:{display:"flex",padding:"0 28px",background:"#ffffff",borderBottom:"1px solid #dae6f5",boxShadow:"0 1px 4px rgba(30,77,155,.06)"},
  tabBtn:{background:"transparent",border:"none",padding:"14px 20px",color:"#7aa0c8",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",borderBottom:"2px solid transparent",transition:"all .2s"},
  tabActive:{color:"#2563eb",borderBottom:"2px solid #2563eb"},
  main:{padding:"20px 28px 40px",maxWidth:860,margin:"0 auto"},
  kpiGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:16},
  card:{background:"#ffffff",border:"1px solid #dae6f5",borderRadius:10,padding:"18px 20px",marginBottom:16,boxShadow:"0 1px 6px rgba(30,77,155,.06)"},
  progressTrack:{height:8,background:"#dae6f5",borderRadius:4,overflow:"hidden"},
  progressFill:{height:"100%",background:"linear-gradient(90deg,#1e4d9b 0%,#2563eb 60%,#60a5fa 100%)",borderRadius:4,transition:"width 1s cubic-bezier(.16,1,.3,1)",boxShadow:"0 0 8px rgba(37,99,235,.3)"},
  txRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 10px",borderRadius:6,transition:"background .15s",borderBottom:"1px solid #d0e3f5"},
  txDesc:{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a3050"},
  txDate:{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#9ab8d8",marginTop:2},
  formGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12},
  inputLabel:{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"#7aa0c8",display:"block",marginBottom:6},
  input:{width:"100%",background:"#f4f8ff",border:"1px solid #ccdcf0",borderRadius:6,padding:"9px 12px",color:"#1a3050",fontFamily:"'DM Sans',sans-serif",fontSize:13,transition:"border-color .2s,box-shadow .2s"},
  btnPrimary:{width:"100%",padding:"10px 16px",background:"#2563eb",border:"none",borderRadius:6,color:"#ffffff",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",transition:"filter .2s",letterSpacing:.5},
  btnGhost:{background:"transparent",border:"1px solid #ccdcf0",borderRadius:6,padding:"9px 14px",color:"#7aa0c8",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",transition:"background .2s"},
};
