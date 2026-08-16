let trades=JSON.parse(localStorage.getItem("sahilTrades")||"[]");
let equityChart,strategyChart,instrumentChart;let calDate=new Date();

const $=id=>document.getElementById(id);
function money(n){return (n<0?"-":"")+"$"+Math.abs(n).toFixed(2)}
function save(){localStorage.setItem("sahilTrades",JSON.stringify(trades));updateAll()}
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const page=$(id); if(page) page.classList.add("active");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
  if(id==="calendar")renderCalendar();
  if(id==="analytics")renderAnalytics();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>showPage(n.dataset.page));

function openJournalForm(){
  showPage("journal");
  setTimeout(()=>$("tradeForm").scrollIntoView({behavior:"smooth",block:"start"}),80);
}
$("date").value=new Date().toISOString().slice(0,10);

$("form").addEventListener("submit",e=>{
  e.preventDefault();
  trades.push({
    id:Date.now(),date:$("date").value,instrument:$("instrument").value.trim().toUpperCase(),
    direction:$("direction").value,entry:+$("entry").value,exit:+$("exit").value,
    sl:+$("sl").value||null,tp:+$("tp").value||null,pnl:+$("pnl").value,risk:+$("risk").value||0,
    strategy:$("strategy").value||"Unspecified",session:$("session").value,emotion:$("emotion").value,
    reason:$("reason").value,lesson:$("lesson").value
  });
  save();e.target.reset();$("date").value=new Date().toISOString().slice(0,10);
  alert("Trade saved to Trade X.");
});
$("search").addEventListener("input",renderTable);

function renderTable(){
  let q=$("search").value.toLowerCase();
  let rows=trades.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(t=>(t.instrument+" "+t.strategy).toLowerCase().includes(q));
  $("tradeTable").innerHTML=rows.map(t=>`<tr>
    <td>${t.date}</td><td>${t.instrument}</td><td>${t.direction}</td><td>${t.strategy}</td>
    <td class="${t.pnl>=0?"positive":"negative"}">${money(t.pnl)}</td><td>${t.emotion}</td>
    <td><button onclick="deleteTrade(${t.id})" style="background:none;border:0;color:#ff718e;cursor:pointer">Delete</button></td>
  </tr>`).join("")||'<tr><td colspan="7" style="text-align:center;color:#756d80;padding:30px">No trades yet.</td></tr>';
}
function deleteTrade(id){trades=trades.filter(t=>t.id!==id);save()}

function metrics(){
  let wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0),pnl=trades.reduce((s,t)=>s+t.pnl,0),
  grossW=wins.reduce((s,t)=>s+t.pnl,0),grossL=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  return {wins,losses,pnl,grossW,grossL,wr:trades.length?wins.length/trades.length*100:0,pf:grossL?grossW/grossL:0}
}
function streaks(){
  let sorted=trades.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id),cur=0,best=0;
  sorted.forEach(t=>{if(t.pnl>0){cur++;best=Math.max(best,cur)}else if(t.pnl<0)cur=0});
  return best;
}
function updateAll(){
  let m=metrics(),bestStreak=streaks();
  $("netPnl").textContent=money(m.pnl);$("netPnl").className=m.pnl>=0?"positive":"negative";
  $("winRate").textContent=m.wr.toFixed(1)+"%";$("winRing").textContent=Math.round(m.wr)+"%";
  $("tradeCount").textContent=trades.length;$("bestStreak").textContent=bestStreak;
  $("profitFactor").textContent=m.pf.toFixed(2);$("wins").textContent=m.wins.length;$("losses").textContent=m.losses.length;
  $("avgWin").textContent=money(m.wins.length?m.grossW/m.wins.length:0);
  $("avgLoss").textContent=money(m.losses.length?-m.grossL/m.losses.length:0);
  $("best").textContent=money(trades.length?Math.max(...trades.map(t=>t.pnl)):0);
  $("worst").textContent=money(trades.length?Math.min(...trades.map(t=>t.pnl)):0);
  $("streak").textContent=trades.length?`${bestStreak} best win streak`:"No trades yet";
  const deg=Math.min(360,m.wr*3.6);document.documentElement.style.setProperty("--ring-deg",deg+"deg");
  const ring=document.querySelector(".ring");if(ring)ring.style.background=`conic-gradient(#a14cff ${deg}deg,rgba(255,255,255,.08) ${deg}deg)`;
  renderTable();renderEquity();renderAnalytics();renderCalendar();
}
function chartOptions(){
  return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
    scales:{x:{ticks:{color:"#8e879a"},grid:{color:"rgba(180,110,255,.07)"}},
            y:{ticks:{color:"#8e879a"},grid:{color:"rgba(180,110,255,.07)"}}}};
}
function renderEquity(){
  let sorted=trades.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id),sum=0,labels=[],vals=[];
  sorted.forEach(t=>{sum+=t.pnl;labels.push(t.date);vals.push(sum)});
  if(equityChart)equityChart.destroy();
  equityChart=new Chart($("equityChart"),{type:"line",data:{labels,datasets:[{label:"Equity",data:vals,tension:.35,borderWidth:2,pointRadius:3,borderColor:"#b14dff",backgroundColor:"rgba(177,77,255,.10)",fill:true}]},options:chartOptions()});
}
function groupPnl(key){let g={};trades.forEach(t=>g[t[key]]=(g[t[key]]||0)+t.pnl);return g}
function renderAnalytics(){
  let s=groupPnl("strategy"),i=groupPnl("instrument");
  if(strategyChart)strategyChart.destroy();if(instrumentChart)instrumentChart.destroy();
  strategyChart=new Chart($("strategyChart"),{type:"bar",data:{labels:Object.keys(s),datasets:[{label:"P&L",data:Object.values(s),backgroundColor:"#a64cff",borderRadius:8}]},options:chartOptions()});
  instrumentChart=new Chart($("instrumentChart"),{type:"bar",data:{labels:Object.keys(i),datasets:[{label:"P&L",data:Object.values(i),backgroundColor:"#e13caf",borderRadius:8}]},options:chartOptions()});
  let ins=[];
  if(trades.length){
    let best=Object.entries(s).sort((a,b)=>b[1]-a[1])[0],inst=Object.entries(i).sort((a,b)=>b[1]-a[1])[0];
    ins.push(`<div class="insight">🏆 Strongest strategy by P&L: <b>${best?.[0]}</b> (${money(best?.[1]||0)}).</div>`);
    ins.push(`<div class="insight">📊 Best instrument by P&L: <b>${inst?.[0]}</b> (${money(inst?.[1]||0)}).</div>`);
    let f=trades.filter(t=>t.emotion==="FOMO"||t.emotion==="Revenge");
    if(f.length)ins.push(`<div class="insight">🧠 ${f.length} trade(s) were marked FOMO/Revenge. Review the reason and lesson fields before repeating the setup.</div>`);
  }
  $("insights").innerHTML=ins.join("")||"Add some trades to generate insights.";
}
function renderCalendar(){
  let y=calDate.getFullYear(),m=calDate.getMonth();
  $("monthTitle").textContent=calDate.toLocaleString("default",{month:"long",year:"numeric"});
  let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),html="";
  for(let i=0;i<first;i++)html+="<div></div>";
  for(let d=1;d<=days;d++){
    let key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,ts=trades.filter(t=>t.date===key),
    p=ts.reduce((s,t)=>s+t.pnl,0),cl=p>0?"win":p<0?"loss":"";
    html+=`<div class="calday ${cl}"><strong>${d}</strong>${ts.length?`<div class="daypnl ${p>=0?"positive":"negative"}">${money(p)} · ${ts.length} trade${ts.length>1?"s":""}</div>`:""}</div>`;
  }
  $("calendarGrid").innerHTML=html;
}
function changeMonth(n){calDate.setMonth(calDate.getMonth()+n);renderCalendar()}
function calcSize(){
  let b=+$("balance").value,r=+$("riskPct").value,e=+$("rEntry").value,s=+$("rSl").value,v=+$("valueUnit").value;
  let risk=b*r/100,d=Math.abs(e-s),size=d&&v?risk/(d*v):0;
  $("sizeResult").textContent=size?`Risk amount: ${money(risk)} • Suggested size: ${size.toFixed(4)}`:"Enter valid values.";
}
function calcRR(){
  let e=+$("rrEntry").value,s=+$("rrSl").value,t=+$("rrTp").value,r=Math.abs(e-s),reward=Math.abs(t-e);
  $("rrResult").textContent=r?`Risk: ${r.toFixed(4)} • Reward: ${reward.toFixed(4)} • R:R = ${(reward/r).toFixed(2)}R`:"Enter valid levels.";
}

document.querySelectorAll(".theme-card").forEach(card=>{
  card.addEventListener("click",()=>{
    const theme=card.dataset.theme;
    document.body.dataset.theme=theme;
    localStorage.setItem("tradeXTheme",theme);
    document.querySelectorAll(".theme-card").forEach(c=>c.classList.toggle("selected",c===card));
  });
});
function loadTheme(){
  const theme=localStorage.getItem("tradeXTheme")||"obsidian";
  document.body.dataset.theme=theme;
  const card=document.querySelector(`.theme-card[data-theme="${theme}"]`);
  if(card)card.classList.add("selected");
}
loadTheme();updateAll();
