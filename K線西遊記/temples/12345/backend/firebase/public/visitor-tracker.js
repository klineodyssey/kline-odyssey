// Anonymous off-chain visitor analytics. Failure never blocks Temple Web3.
(function(){
  "use strict";
  const endpoint = window.KGEN_12345_VISITOR_ENDPOINT || "";
  function publish(available, stats){
    const detail = {
      available: !!available,
      uniqueVisitors: stats && (stats.approximateUniqueVisitors || stats.uniqueVisitors) || null,
      pageViews: stats && stats.pageViews || null
    };
    window.dispatchEvent(new CustomEvent("kgen:visitor-stats", { detail: detail }));
    const target = document.getElementById("v34-site-visitors");
    if(target) target.textContent = available && detail.uniqueVisitors != null ? String(detail.uniqueVisitors) : "訪客統計暫不可用";
  }
  if(!endpoint){ publish(false); return; }
  try{
    const key = "kgen_12345_visitor_id_v1";
    let id = localStorage.getItem(key);
    if(!id){ id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random(); localStorage.setItem(key,id); }
    fetch(endpoint, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({page:"12345",clientId:id}) })
      .then(response => { if(!response.ok) throw new Error("VISITOR_HTTP_" + response.status); return response.json(); })
      .then(payload => publish(true,payload && payload.stats ? payload.stats : payload))
      .catch(error => { console.warn("[KGEN visitor] unavailable",error); publish(false); });
  }catch(error){ console.warn("[KGEN visitor] unavailable",error); publish(false); }
})();
