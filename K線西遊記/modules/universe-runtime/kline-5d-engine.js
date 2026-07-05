/*
KGEN 5D Game Engine V0.2 — Production Build
K-line canyon MOBA: towers, waves, boss, skills, equipment, quests, warp, mobile HUD
Demo mode only — no real wallet transactions
*/
(function(global){
  'use strict';

  var DEFAULT_STATE = {
    round: 1, timer: 90, demo: true,
    bullBase: 100, bearBase: 100,
    towers: { 't1-bull':100,'t2-bull':100,'t1-bear':100,'t2-bear':100 },
    bullMinions: 3, bearMinions: 3,
    nodes: { '11520':'neutral','18888':'neutral','18921':'neutral','8888':'neutral','20888':'neutral' },
    player: {
      faction: 'bull', hp: 100, maxHp: 100, mp: 50, maxMp: 50, gold: 500, kgen: 888,
      level: 1, xp: 0,
      skills: { slash:1, shield:1, warp:1, fortune:1 },
      equipment: { weapon:'K線劍', armor:'悟空甲', accessory:'發財符' },
      quests: [
        { id:'q1', title:'佔領 11520 交易所', desc:'控制中路節點獲得交易加成', reward:'+200 KGEN', done:false },
        { id:'q2', title:'斬妖台淨化', desc:'在 18921 模擬投入 LP', reward:'技能點 +1', done:false },
        { id:'q3', title:'推塔勝利', desc:'摧毀空方雙塔', reward:'Boss 召喚券', done:false },
      ],
    },
    wave: 1, bossActive: false, bossHp: 0, bossMaxHp: 500,
    monsters: [], projectiles: [], particles: [],
    kPrice: 600, kChange: 0, events: [],
    npcs: [
      { id:'wukong', name:'悟空', role:'多方指揮', x:0.08, dialog:'K線上漲，牛氣沖天！' },
      { id:'chang', name:'嫦娥', role:'空方指揮', x:0.92, dialog:'廣寒宮永不陷落。' },
      { id:'trader', name:'神猴交易員', role:'11520 NPC', x:0.42, dialog:'App 上架需抵押保證金。' },
    ],
  };

  function GameEngine(canvas, statusBus) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.status = statusBus;
    this.G = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.animFrame = 0;
    this.lastTick = Date.now();
    this.running = true;
    this.touchSide = null;
  }

  GameEngine.prototype.log = function(msg, color) {
    var ts = new Date().toTimeString().slice(0,8);
    this.G.events.unshift({ ts: ts, msg: msg, color: color || 'var(--kgen-muted)' });
    if (this.G.events.length > 25) this.G.events.length = 25;
    if (this.status) this.status.push(msg);
    var el = document.getElementById('event-log');
    if (el) {
      el.innerHTML = this.G.events.map(function(e){
        return '<div class="ev-line"><span class="ev-time">' + e.ts + '</span> <span style="color:' + e.color + '">' + e.msg + '</span></div>';
      }).join('');
    }
  };

  GameEngine.prototype.spawnWave = function() {
    var w = this.G.wave;
    var count = 2 + Math.min(w, 6);
    this.G.monsters = [];
    for (var i = 0; i < count; i++) {
      this.G.monsters.push({
        side: i % 2 === 0 ? 'bull' : 'bear',
        x: i % 2 === 0 ? 0.15 + Math.random()*0.1 : 0.75 + Math.random()*0.1,
        y: 0.3 + Math.random()*0.4,
        hp: 30 + w * 5,
        maxHp: 30 + w * 5,
        speed: 0.002 + w * 0.0003,
        type: 'kline-ghost',
      });
    }
    this.log('👹 K線怪物波 #' + w + ' 來襲！', '#ffd778');
  };

  GameEngine.prototype.spawnBoss = function() {
    this.G.bossActive = true;
    this.G.bossHp = 500;
    this.G.bossMaxHp = 500;
    this.log('🔥 Boss「貪婪魔影」降臨峽谷！', '#ff4444');
  };

  GameEngine.prototype.action = function(act) {
    var G = this.G, p = G.player;
    switch(act) {
      case 'buy':
        G.bullMinions = Math.min(12, G.bullMinions + 1);
        p.gold -= 10;
        this.log('📈 做多加兵！多方兵線 ' + G.bullMinions, '#7cffc5');
        break;
      case 'sell':
        G.bearMinions = Math.min(12, G.bearMinions + 1);
        this.log('📉 做空加兵！空方兵線 ' + G.bearMinions, '#ff4444');
        break;
      case 'hold':
        ['t1-bull','t2-bull'].forEach(function(k){ if(G.towers[k]<100) G.towers[k]=Math.min(100,G.towers[k]+15); });
        p.mp = Math.min(p.maxMp, p.mp + 10);
        this.log('⏸️ 持倉修塔 +15 HP', '#ffd778');
        break;
      case 'skill-slash':
        if (p.mp < 15) { this.log('MP 不足', '#ff4444'); return; }
        p.mp -= 15;
        if (G.towers['t1-bear']>0) G.towers['t1-bear'] -= 25;
        if (G.towers['t2-bear']>0) G.towers['t2-bear'] -= 15;
        if (G.bossActive) G.bossHp -= 40;
        this.addParticles(0.65, 0.5, '#7cffc5', 12);
        this.log('⚔️ 技能「K線斬」！空方塔受創！', '#7cffc5');
        break;
      case 'skill-shield':
        if (p.mp < 20) return;
        p.mp -= 20;
        ['t1-bull','t2-bull'].forEach(function(k){ G.towers[k]=Math.min(100,G.towers[k]+30); });
        this.log('🛡️ 技能「悟空盾」！塔 HP +30', '#7cffc5');
        break;
      case 'skill-warp':
        if (p.mp < 25) return;
        p.mp -= 25;
        this.log('🌀 Warp 航道啟動！瞬移至中路節點', '#00f2ff');
        this.claimNode('11520', G.kChange >= 0 ? 'bull' : 'bear');
        break;
      case 'fortune':
        G.bullMinions = Math.min(12, G.bullMinions + 3);
        if (G.towers['t1-bear']>0) G.towers['t1-bear'] -= 30;
        p.kgen += 50;
        this.log('🧧 發財金大招！KGEN +50', '#ffd778');
        break;
      case 'ignite':
        G.bearMinions = Math.min(12, G.bearMinions + 3);
        if (G.towers['t1-bull']>0) G.towers['t1-bull'] -= 30;
        this.log('🌬️ 轉日呼吸！空方反擊', '#ff4444');
        break;
      case 'equip':
        this.log('🎒 裝備：' + p.equipment.weapon + ' / ' + p.equipment.armor, '#ffd778');
        break;
    }
    this.checkWin();
    this.renderUI();
  };

  GameEngine.prototype.claimNode = function(id, side) {
    if (!this.G.nodes.hasOwnProperty(id)) return;
    side = side || (this.G.kChange >= 0 ? 'bull' : 'bear');
    this.G.nodes[id] = side;
    var q = this.G.player.quests.find(function(x){ return x.id === 'q1' && id === '11520'; });
    if (q && !q.done) { q.done = true; this.log('✅ 任務完成：佔領 11520', '#7cffc5'); }
    this.log((side === 'bull' ? '🐂' : '🐻') + ' 佔領節點 ' + id, '#ffd778');
  };

  GameEngine.prototype.addParticles = function(x, y, color, n) {
    var W = this.canvas.width;
    for (var i = 0; i < (n||8); i++) {
      this.G.particles.push({
        x: x * W, y: y * this.canvas.height,
        vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
        life: 30 + Math.random()*20, color: color, size: 2+Math.random()*3,
      });
    }
  };

  GameEngine.prototype.updatePrice = function(d) {
    this.G.kPrice = d.price;
    this.G.kChange = d.change;
    if (d.change > 1.5) {
      if (Math.random() < 0.3 && this.G.towers['t1-bear'] > 0) {
        this.G.towers['t1-bear'] -= 2;
        this.addParticles(0.65, 0.5, '#7cffc5', 4);
      }
    } else if (d.change < -1.5) {
      if (Math.random() < 0.3 && this.G.towers['t1-bull'] > 0) {
        this.G.towers['t1-bull'] -= 2;
        this.addParticles(0.35, 0.5, '#ff4444', 4);
      }
    }
    var priceEl = document.getElementById('live-price');
    var chgEl = document.getElementById('live-chg');
    if (priceEl) priceEl.textContent = d.price.toFixed(2);
    if (chgEl && global.KGEN_priceDir) {
      var dir = KGEN_priceDir(d.change);
      chgEl.textContent = dir.text;
      chgEl.style.color = dir.color;
    }
  };

  GameEngine.prototype.tick = function() {
    var G = this.G, now = Date.now(), dt = now - this.lastTick;
    this.lastTick = now;
    this.animFrame++;

    G.timer -= dt / 1000;
    if (G.timer <= 0) {
      G.timer = 90;
      G.round++;
      G.wave++;
      this.spawnWave();
      if (G.round % 3 === 0) this.spawnBoss();
      this.log('⏰ 回合 #' + G.round + ' · 波次 #' + G.wave, '#ffd778');
    }

    var pct = 0.5 + (G.kChange / 10) * 0.35;
    pct = Math.max(0.12, Math.min(0.88, pct));

    G.monsters.forEach(function(m){
      if (m.side === 'bull') m.x += m.speed * (G.kChange >= 0 ? 1.2 : 0.6);
      else m.x -= m.speed * (G.kChange < 0 ? 1.2 : 0.6);
      if (m.x < 0.1 || m.x > 0.9) m.hp = 0;
    });
    G.monsters = G.monsters.filter(function(m){ return m.hp > 0; });

    if (G.bossActive && G.bossHp > 0) {
      G.bossHp -= G.bullMinions * 0.05;
      if (G.bossHp <= 0) {
        G.bossActive = false;
        G.player.kgen += 500;
        this.log('🏆 Boss 擊敗！獎勵 500 KGEN', '#7cffc5');
      }
    }

    if (this.animFrame % 120 === 0) {
      var bd = G.bullMinions * 2, rd = G.bearMinions * 2;
      if (G.towers['t1-bear'] > 0) G.towers['t1-bear'] = Math.max(0, G.towers['t1-bear'] - bd);
      if (G.towers['t1-bull'] > 0) G.towers['t1-bull'] = Math.max(0, G.towers['t1-bull'] - rd);
      this.checkWin();
    }

    G.particles.forEach(function(p){ p.x += p.vx; p.y += p.vy; p.life--; });
    G.particles = G.particles.filter(function(p){ return p.life > 0; });

    this.draw(pct);
    this.renderUI();
  };

  GameEngine.prototype.checkWin = function() {
    var G = this.G;
    if (G.towers['t1-bear'] <= 0 && G.towers['t2-bear'] <= 0) {
      G.bearBase = Math.max(0, G.bearBase - 8);
      var q = G.player.quests.find(function(x){ return x.id === 'q3'; });
      if (q && !q.done && G.bearBase <= 50) { q.done = true; this.log('✅ 任務：推塔進展良好', '#7cffc5'); }
      if (G.bearBase <= 0) this.log('🏆 多方勝利！', '#7cffc5');
    }
    if (G.towers['t1-bull'] <= 0 && G.towers['t2-bull'] <= 0) {
      G.bullBase = Math.max(0, G.bullBase - 8);
      if (G.bullBase <= 0) this.log('💀 空方勝利！', '#ff4444');
    }
  };

  GameEngine.prototype.draw = function(pct) {
    var canvas = this.canvas, ctx = this.ctx, G = this.G;
    canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 600;
    var W = canvas.width, H = canvas.height || 220;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    var bg = ctx.createLinearGradient(0, 0, W, 0);
    bg.addColorStop(0, '#041208'); bg.addColorStop(0.5, '#050810'); bg.addColorStop(1, '#140505');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    for (var gx = 0; gx < W; gx += 50) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    }

    var lineX = W * pct;
    var lg = ctx.createLinearGradient(lineX-3,0,lineX+3,0);
    lg.addColorStop(0,'rgba(255,215,120,0)'); lg.addColorStop(0.5,'rgba(255,215,120,0.9)'); lg.addColorStop(1,'rgba(255,215,120,0)');
    ctx.fillStyle = lg; ctx.fillRect(lineX-2, 0, 4, H);

    ctx.fillStyle = 'rgba(255,215,120,0.7)'; ctx.font = 'bold 11px monospace';
    ctx.fillText('K ' + (G.kChange>=0?'▲':'▼') + ' $' + G.kPrice.toFixed(0), lineX+6, 14);

    function base(x, col, lbl) {
      ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, H/2, 22, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x, H/2+3);
    }
    base(35, 'rgba(124,255,197,0.75)', '12345');
    base(W-35, 'rgba(255,68,68,0.75)', '16888');

    function tower(x, hp, col) {
      var h = (hp/100)*42;
      ctx.fillStyle = col; ctx.globalAlpha = 0.75;
      ctx.fillRect(x-7, H/2-h/2, 14, h); ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.strokeRect(x-7, H/2-21, 14, 42);
    }
    tower(W*0.18, G.towers['t1-bull'], '#7cffc5');
    tower(W*0.32, G.towers['t2-bull'], '#7cffc5');
    tower(W*0.68, G.towers['t1-bear'], '#ff4444');
    tower(W*0.82, G.towers['t2-bear'], '#ff4444');

    var nodePos = { '11520':[0.45,H/2-35], '18888':[0.5,H/2], '18921':[0.55,H/2+35], '8888':[0.38,H/2+50], '20888':[0.62,H/2-50] };
    Object.keys(nodePos).forEach(function(id){
      if (!G.nodes[id]) return;
      var st = G.nodes[id];
      var col = st==='bull'?'#7cffc5':st==='bear'?'#ff4444':'#ffd778';
      var nx = nodePos[id][0]*W, ny = nodePos[id][1];
      ctx.fillStyle = col; ctx.globalAlpha = 0.45;
      ctx.fillRect(nx-16, ny-11, 32, 22); ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.strokeRect(nx-16, ny-11, 32, 22);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(id, nx, ny+3);
    });

    G.monsters.forEach(function(m){
      ctx.fillStyle = m.side==='bull'?'#7cffc5':'#ff4444';
      ctx.beginPath(); ctx.arc(m.x*W, m.y*H, 6, 0, Math.PI*2); ctx.fill();
    });

    if (G.bossActive) {
      var bx = W*0.5, by = H*0.25;
      ctx.fillStyle = 'rgba(255,68,68,0.8)'; ctx.beginPath();
      ctx.arc(bx, by, 28, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('BOSS', bx, by+4);
      ctx.fillStyle = '#ff4444'; ctx.fillRect(bx-30, by+35, 60*(G.bossHp/G.bossMaxHp), 5);
    }

    var bullX = W*0.2 + (pct-0.5)*W*0.35, bearX = W*0.8 - (pct-0.5)*W*0.35;
    for (var i = 0; i < G.bullMinions; i++) {
      ctx.fillStyle = '#7cffc5'; ctx.beginPath();
      ctx.arc(bullX+i*12, H/2-12, 5, 0, Math.PI*2); ctx.fill();
    }
    for (var j = 0; j < G.bearMinions; j++) {
      ctx.fillStyle = '#ff4444'; ctx.beginPath();
      ctx.arc(bearX-j*12, H/2+12, 5, 0, Math.PI*2); ctx.fill();
    }

    G.particles.forEach(function(p){
      ctx.globalAlpha = p.life/50; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    var warpY = H - 8;
    ctx.strokeStyle = 'rgba(0,242,255,0.4)'; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(W*0.1, warpY); ctx.lineTo(W*0.9, warpY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,242,255,0.6)'; ctx.font = '9px sans-serif';
    ctx.fillText('━━ Warp 航道 ━━', W/2-40, warpY-4);
  };

  GameEngine.prototype.renderUI = function() {
    var G = this.G, p = G.player;
    var set = function(id, v){ var e=document.getElementById(id); if(e) e.textContent = v; };
    set('bull-hp', G.bullBase); set('bear-hp', G.bearBase);
    set('game-round', G.round);
    set('game-timer', Math.ceil(G.timer) + 's');
    set('player-hp', p.hp + '/' + p.maxHp);
    set('player-mp', p.mp + '/' + p.maxMp);
    set('player-gold', p.gold);
    set('player-kgen', p.kgen);
    set('player-level', p.level);

    ['t1-bull','t2-bull','t1-bear','t2-bear'].forEach(function(k){
      var hp = G.towers[k];
      var bar = document.getElementById(k+'-bar');
      var hpEl = document.getElementById(k+'-hp');
      if (bar) bar.style.width = Math.max(0,hp)+'%';
      if (hpEl) hpEl.textContent = Math.max(0,hp)+'/100';
    });

    var bullEl = document.getElementById('bull-minions');
    var bearEl = document.getElementById('bear-minions');
    if (bullEl) {
      var bh = '';
      for (var i=0;i<G.bullMinions;i++) bh += '<span class="minion-chip mc-bull">🐂'+((i%3)+1)+'</span>';
      bullEl.innerHTML = bh || '<span style="color:var(--kgen-muted)">—</span>';
    }
    if (bearEl) {
      var rh = '';
      for (var j=0;j<G.bearMinions;j++) rh += '<span class="minion-chip mc-bear">🐻'+((j%3)+1)+'</span>';
      bearEl.innerHTML = rh || '<span style="color:var(--kgen-muted)">—</span>';
    }

    if (global.KGEN_TempleHub) {
      var qp = document.getElementById('quest-panel');
      if (qp) KGEN_TempleHub.renderQuestPanel(qp, p.quests);
    }
  };

  GameEngine.prototype.start = function() {
    var self = this;
    this.spawnWave();
    this.log('🎮 K線5D峽谷戰場 V0.2 Production 啟動', '#ffd778');
    function loop() {
      if (!self.running) return;
      self.tick();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    setInterval(function(){ self.tick(); }, 1000);
  };

  GameEngine.prototype.bindMobile = function() {
    var self = this;
    ['touch-left','touch-mid','touch-right'].forEach(function(id, i){
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', function(e){ e.preventDefault();
        if (i===0) self.action('buy');
        else if (i===1) self.action('hold');
        else self.action('sell');
      });
    });
  };

  global.KGEN_5D_Engine = GameEngine;
})(window);
