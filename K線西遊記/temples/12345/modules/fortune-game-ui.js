(function(){
  "use strict";

  function render(){
    const root = document.getElementById("bet-live-panel");
    if(!root) return;
    root.classList.remove("kgen-v3-dead");
    root.classList.add("v34-fortune-game");
    root.style.display = "block";
    root.innerHTML = [
      '<button class="v34-panel-close" id="v34-game-close" type="button" aria-label="關閉漲跌遊戲面板">×</button>',
      '<div class="v34-game-title">🎮 玩漲跌</div>',
      '<div class="v34-game-status" id="v34-game-status">漲跌遊戲建設中</div>',
      '<p id="v34-game-detail">正式 FortuneGame Proxy／ABI 尚未公布，目前禁止下注與領取。</p>',
      '<div class="v34-game-gates">',
      '<span>FortuneGame address: PENDING</span>',
      '<span>ABI: PENDING</span>',
      '<span>Heart 1888 gate: WAITING</span>',
      '</div>',
      '<button class="v34-write" type="button" disabled>UP／DOWN 尚未開放</button>'
    ].join("");
    const close = document.getElementById("v34-game-close");
    if(close) close.addEventListener("click", function(){ root.classList.remove("v34-panel-open","kgen-v30-overlay-open"); root.style.display="none"; });
    window.addEventListener("kgen:fortune-game-state", function(event){
      const state = event.detail || {};
      const status = document.getElementById("v34-game-status");
      const detail = document.getElementById("v34-game-detail");
      if(status) status.textContent = state.message || "漲跌遊戲建設中";
      if(detail && state.reason === "HEART_BELOW_1888") detail.textContent = "遊戲區已停止下注與領取；Wallet、Wish 與玩家自有 KGEN 不受影響。";
    });
    window.KGENFortuneGameUI = {
      open: function(){ root.style.display="block"; root.classList.add("v34-panel-open","kgen-v30-overlay-open"); },
      close: function(){ root.style.display="none"; root.classList.remove("v34-panel-open","kgen-v30-overlay-open"); },
      toggle: function(){ if(root.classList.contains("v34-panel-open") || getComputedStyle(root).display!=="none") this.close(); else this.open(); }
    };
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
})();
