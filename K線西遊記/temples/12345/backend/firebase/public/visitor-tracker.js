// 12345 visitor tracker — anonymous off-chain analytics only.
// Set window.KGEN_12345_VISITOR_ENDPOINT after Firebase Functions deployment.
(function(){
  const endpoint = window.KGEN_12345_VISITOR_ENDPOINT || '';
  if (!endpoint) return;
  const key = 'kgen_12345_visitor_id_v1';
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random());
    localStorage.setItem(key, id);
  }
  fetch(endpoint, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({page:'12345', clientId:id})
  }).catch(()=>{});
})();
