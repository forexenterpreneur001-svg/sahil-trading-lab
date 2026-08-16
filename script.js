let trades=JSON.parse(localStorage.getItem("sahilTrades")||"[]");let equityChart,strategyChart,instrumentChart,analyticsEquityChart;let calDate=new Date();let analyticsRange="all";

const $=id=>document.getElementById(id);
function money(n){return (n<0?"-":"")+"$"+Math.abs(n).toFixed(2)}
function save(){localStorage.setItem("sahilTrades",JSON.stringify(trades));updateAll()}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.querySelector("#"+id).classList.add("active");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));if(id==="calendar")renderCalendar();if(id==="analytics")renderAnalytics()}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>showPage(n.dataset.page));
$("date").value=new Date().toISOString().slice(0,10);

$("form").addEventListener("submit",e=>{e.preventDefault();trades.push({id:Date.now(),date:$("date").value,instrument:$("instrument").value.trim().toUpperCase(),direction:$("direction").value,entry:+$("entry").value,exit:+$("exit").value,sl:+$("sl").value||null,tp:+$("tp").value||null,pnl:+$("pnl").value,risk:+$("risk").value||0,strategy:$("strategy").value||"Unspecified",session:$("session").value,emotion:$("emotion").value,reason:$("reason").value,lesson:$("lesson").value});save();e.target.reset();$("date").value=new Date().toISOString().slice(0,10);alert("Trade saved!");});
$("search").addEventListener("input",renderTable);
function renderTable(){let q=$("search").value.toLowerCase();let rows=trades.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(t=>(t.instrument+" "+t.strategy).toLowerCase().includes(q));$("tradeTable").innerHTML=rows.map(t=>`<tr><td>${t.date}</td><td>${t.instrument}</td><td>${t.direction}</td><td>${t.strategy}</td><td class="${t.pnl>=0?"positive":"negative"}">${money(t.pnl)}</td><td>${t.emotion}</td><td><button onclick="deleteTrade(${t.id})" style="background:none;border:0;color:#ef7180;cursor:pointer">Delete</button></td></tr>`).join("")||'<tr><td colspan="7" style="text-align:center;color:#65748a;padding:30px">No trades yet.</td></tr>'}
function deleteTrade(id){trades=trades.filter(t=>t.id!==id);save()}
function metrics(){let wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0),pnl=trades.reduce((s,t)=>s+t.pnl,0),grossW=wins.reduce((s,t)=>s+t.pnl,0),grossL=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));return {wins,losses,pnl,grossW,grossL,wr:trades.length?wins.length/trades.length*100:0,pf:grossL?grossW/grossL:0}}
function updateAll(){let m=metrics();$("netPnl").textContent=money(m.pnl);$("netPnl").className=m.pnl>=0?"positive":"negative";$("winRate").textContent=m.wr.toFixed(1)+"%";$("tradeCount").textContent=trades.length;$("profitFactor").textContent=m.pf.toFixed(2);$("wins").textContent=m.wins.length;$("losses").textContent=m.losses.length;$("avgWin").textContent=money(m.wins.length?m.grossW/m.wins.length:0);$("avgLoss").textContent=money(m.losses.length?-m.grossL/m.losses.length:0);$("best").textContent=money(trades.length?Math.max(...trades.map(t=>t.pnl)):0);$("worst").textContent=money(trades.length?Math.min(...trades.map(t=>t.pnl)):0);renderTable();renderEquity();renderAnalytics();renderCalendar()}
function renderEquity(){let sorted=trades.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id),sum=0,labels=[],vals=[];sorted.forEach(t=>{sum+=t.pnl;labels.push(t.date);vals.push(sum)});if(equityChart)equityChart.destroy();equityChart=new Chart($("equityChart"),{type:"line",data:{labels, datasets:[{label:"Equity",data:vals,tension:.25,borderWidth:2,pointRadius:3}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#718096"}},y:{ticks:{color:"#718096"}}}}})}
function groupPnl(key){let g={};trades.forEach(t=>g[t[key]]=(g[t[key]]||0)+t.pnl);return g}
function filteredAnalyticsTrades(){
  if(analyticsRange==="all") return trades.slice();
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-Number(analyticsRange));
  return trades.filter(t=>new Date(t.date+"T23:59:59")>=cutoff);
}
function analyticsMetrics(ts){
  const wins=ts.filter(t=>t.pnl>0),losses=ts.filter(t=>t.pnl<0),pnl=ts.reduce((s,t)=>s+t.pnl,0);
  const grossW=wins.reduce((s,t)=>s+t.pnl,0),grossL=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
  let equity=0,peak=0,maxDD=0;ts.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id).forEach(t=>{equity+=t.pnl;peak=Math.max(peak,equity);maxDD=Math.min(maxDD,equity-peak)});
  let streak=0,bestStreak=0;ts.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id).forEach(t=>{if(t.pnl>0){streak++;bestStreak=Math.max(bestStreak,streak)}else if(t.pnl<0)streak=0});
  return {pnl,wins,losses,grossW,grossL,wr:ts.length?wins.length/ts.length*100:0,pf:grossL?grossW/grossL:0,maxDD,bestStreak,avg:ts.length?pnl/ts.length:0,avgRisk:ts.length?ts.reduce((s,t)=>s+(+t.risk||0),0)/ts.length:0,best:ts.length?Math.max(...ts.map(t=>t.pnl)):0,worst:ts.length?Math.min(...ts.map(t=>t.pnl)):0};
}
function chartBaseOptions(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"rgba(255,255,255,.045)"},ticks:{color:"#817c92",maxTicksLimit:8}},y:{grid:{color:"rgba(255,255,255,.045)"},ticks:{color:"#817c92"}}}}}
function renderAnalytics(){
  const ts=filteredAnalyticsTrades(),m=analyticsMetrics(ts);
  if($("aNetPnl")){ $("aNetPnl").textContent=money(m.pnl); $("aNetPnl").className=m.pnl>=0?"positive":"negative"; $("aWinRate").textContent=m.wr.toFixed(1)+"%"; $("aAvgRisk").textContent=m.avgRisk.toFixed(2)+"%"; $("aDrawdown").textContent=money(m.maxDD); $("aBestStreak").textContent=m.bestStreak; $("aAvgTrade").textContent=money(m.avg); $("aBest").textContent=money(m.best); $("aWorst").textContent=money(m.worst); $("aPf").textContent=m.pf.toFixed(2); $("aTrades").textContent=ts.length; $("aPnlHint").textContent=analyticsRange==="all"?"All recorded trades":analyticsRange+" day window"; }
  const sorted=ts.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id); let sum=0,labels=[],vals=[]; sorted.forEach(t=>{sum+=t.pnl;labels.push(t.date);vals.push(sum)});
  if(analyticsEquityChart)analyticsEquityChart.destroy();
  analyticsEquityChart=new Chart($("analyticsEquityChart"),{type:"line",data:{labels,datasets:[{data:vals,borderColor:"#b783ff",backgroundColor:"rgba(155,92,255,.12)",fill:true,tension:.35,borderWidth:2.5,pointRadius:0,pointHoverRadius:5,pointHoverBackgroundColor:"#ff61dc"}]},options:chartBaseOptions()});
  $("analyticsEmpty").classList.toggle("hidden",!!ts.length);
  const s=groupPnlFrom(ts,"strategy"),i=groupPnlFrom(ts,"instrument");
  if(strategyChart)strategyChart.destroy();if(instrumentChart)instrumentChart.destroy();
  const barOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#817c92"}},y:{grid:{color:"rgba(255,255,255,.045)"},ticks:{color:"#817c92"}}}};
  strategyChart=new Chart($("strategyChart"),{type:"bar",data:{labels:Object.keys(s),datasets:[{data:Object.values(s),borderRadius:7,backgroundColor:"rgba(155,92,255,.72)"}]},options:barOptions});
  instrumentChart=new Chart($("instrumentChart"),{type:"bar",data:{labels:Object.keys(i),datasets:[{data:Object.values(i),borderRadius:7,backgroundColor:"rgba(255,79,216,.62)"}]},options:barOptions});
  let ins=[];if(ts.length){let best=Object.entries(s).sort((a,b)=>b[1]-a[1])[0];let inst=Object.entries(i).sort((a,b)=>b[1]-a[1])[0];if(best)ins.push(`<div class="insight">🏆 Strongest strategy by P&L: <b>${best[0]}</b> (${money(best[1])}).</div>`);if(inst)ins.push(`<div class="insight">📊 Best instrument by P&L: <b>${inst[0]}</b> (${money(inst[1])}).</div>`);let f=ts.filter(t=>t.emotion==="FOMO"||t.emotion==="Revenge");if(f.length)ins.push(`<div class="insight">🧠 ${f.length} trade(s) were marked FOMO/Revenge. Review your reason and lesson fields.</div>`)}
  $("insights").innerHTML=ins.join("")||"Add some trades to generate insights.";
}
function groupPnlFrom(list,key){let g={};list.forEach(t=>g[t[key]]=(g[t[key]]||0)+t.pnl);return g}
function renderCalendar(){let y=calDate.getFullYear(),m=calDate.getMonth();$("monthTitle").textContent=calDate.toLocaleString("default",{month:"long",year:"numeric"});let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),html="";for(let i=0;i<first;i++)html+="<div></div>";for(let d=1;d<=days;d++){let key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,ts=trades.filter(t=>t.date===key),p=ts.reduce((s,t)=>s+t.pnl,0),cl=p>0?"win":p<0?"loss":"";html+=`<div class="calday ${cl}"><strong>${d}</strong>${ts.length?`<div class="daypnl ${p>=0?"positive":"negative"}">${money(p)} · ${ts.length} trade${ts.length>1?"s":""}</div>`:""}</div>`}$("calendarGrid").innerHTML=html}
function changeMonth(n){calDate.setMonth(calDate.getMonth()+n);renderCalendar()}
function calcSize(){let b=+$("balance").value,r=+$("riskPct").value,e=+$("rEntry").value,s=+$("rSl").value,v=+$("valueUnit").value;let risk=b*r/100,d=Math.abs(e-s),size=d&&v?risk/(d*v):0;$("sizeResult").textContent=size?`Risk amount: ${money(risk)} • Suggested size: ${size.toFixed(4)}`:"Enter valid values."}
function calcRR(){let e=+$("rrEntry").value,s=+$("rrSl").value,t=+$("rrTp").value,r=Math.abs(e-s),reward=Math.abs(t-e);$("rrResult").textContent=r?`Risk: ${r.toFixed(4)} • Reward: ${reward.toFixed(4)} • R:R = ${(reward/r).toFixed(2)}R`:"Enter valid levels."}
updateAll();
document.querySelectorAll(".range").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".range").forEach(b=>b.classList.remove("active"));btn.classList.add("active");analyticsRange=btn.dataset.range;renderAnalytics()}));
// Trade X premium theme engine
(function(){
  const themeToggle=document.getElementById('themeToggle');
  const themePanel=document.getElementById('themePanel');
  const buttons=[...document.querySelectorAll('.themeBtn')];
  const saved=localStorage.getItem('tradeXTheme')||'1';
  function applyTheme(n){
    document.body.className=document.body.className.replace(/\btheme-\d+\b/g,'').trim();
    if(n!=='1') document.body.classList.add('theme-'+n);
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.theme===n));
    localStorage.setItem('tradeXTheme',n);
  }
  applyTheme(saved);
  themeToggle.addEventListener('click',()=>themePanel.classList.toggle('open'));
  buttons.forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.theme)));
  document.addEventListener('click',e=>{if(themePanel.classList.contains('open')&&!themePanel.contains(e.target)&&e.target!==themeToggle)themePanel.classList.remove('open')});
})();
