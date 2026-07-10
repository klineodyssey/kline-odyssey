/*
 * KLINE 5D Game Engine V1.1
 * Full game: world map, NPC, Boss, quests, equipment, skills, warp, K-line battlefield
 * V1.1: win/lose overlay, score accumulation, faster tower regen, better auto-battle
 * Requires: kgen-game-core.js + Universe Runtime modules
 */
(function(global) {
  'use strict';

  var ENGINE_VERSION = 'V1.1';

  function GameEngine(opts) {
    opts = opts || {};
    this.canvas = opts.canvas || document.getElementById('game-canvas');
    this.worldCanvas = opts.worldCanvas || document.getElementById('world-map-canvas');
    this.statusBus = global.KGEN_UNIVERSE_STATUS_BUS;
    this.civ = global.KGEN_UNIVERSE_CIVILIZATION;
    this.physics = global.KGEN_UNIVERSE_PHYSICS;
    this.camera = new global.KGEN_UNIVERSE_CAMERA({ x: 300, y: 90, zoom: 1 });

    this.state = {
      round: 1,
      timer: 90,
      bullBase: 100,
      bearBase: 100,
      towers: {},
      bullMinions: 4,
      bearMinions: 4,
      nodes: { '11520': 'neutral', '18888': 'neutral', '18921': 'neutral' },
      kPrice: 0,
      kChange: 0,
      events: [],
      bossHp: 500,
      bossActive: false,
      playerHp: 100,
      warpCooldown: 0,
      bullScore: 0,
      bearScore: 0,
      gameOver: false,
      gameWinner: null,
    };

    this.boss = {
      name: '五指山封印魔',
      emoji: '⛰️',
      rewardXp: 200,
    };

    this._initFromMap();
  }

  GameEngine.prototype._initFromMap = function() {
    var map = global.KGEN_UNIVERSE_MAP;
    var g5 = map && map.game5d;
    if (g5 && g5.towers) {
      var self = this;
      g5.towers.forEach(function(t) {
        self.state.towers[t.id] = t.hp || 100;
      });
    } else {
      this.state.towers = {
        't1-bull': 100, 't2-bull': 100, 't1-bear': 100, 't2-bear': 100,
      };
    }
  };

  GameEngine.prototype.log = function(msg, color) {
    var ts = new Date().toTimeString().slice(0, 8);
    this.state.events.unshift({ ts: ts, msg: msg, color: color || 'var(--kgen-muted)' });
    if (this.state.events.length > 25) this.state.events.length = 25;
    if (this.statusBus) this.statusBus.emit('game:log', { msg: msg });
    this._renderLog();
  };

  GameEngine.prototype._renderLog = function() {
    var el = document.getElementById('event-log');
    if (!el) return;
    el.innerHTML = this.state.events.map(function(e) {
      return '<div class="ev-line"><span class="ev-time">' + e.ts + '</span> <span style="color:' + e.color + ';">' + e.msg + '</span></div>';
    }).join('');
  };

  GameEngine.prototype.drawBattlefield = function() {
    var canvas = this.canvas;
    if (!canvas) return;
    canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth || 600 : 600;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = 200;
    canvas.height = H;
    var G = this.state;
    var change = G.kChange;
    var pct = 0.5 + (change / 10) * 0.3;
    pct = Math.max(0.15, Math.min(0.85, pct));

    var bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#051208');
    bgGrad.addColorStop(0.5, '#050810');
    bgGrad.addColorStop(1, '#120505');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    if (G.bossActive) {
      ctx.fillStyle = 'rgba(255,68,68,.15)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(G.boss.emoji + ' ' + this.boss.name + ' HP:' + G.bossHp, W / 2, 24);
    }

    var lineX = W * pct;
    ctx.fillStyle = 'rgba(255,215,120,.7)';
    ctx.fillRect(lineX - 1, 0, 2, H);

    function drawBase(x, y, color, label) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 3);
    }
    drawBase(28, H / 2, 'rgba(124,255,197,.75)', '12345');
    drawBase(W - 28, H / 2, 'rgba(255,68,68,.75)', '16888');

    var towerPos = { 't1-bull': 0.18, 't2-bull': 0.32, 't1-bear': 0.68, 't2-bear': 0.82 };
    Object.keys(towerPos).forEach(function(k) {
      var x = W * towerPos[k];
      var hp = G.towers[k] || 0;
      var col = k.indexOf('bull') >= 0 ? '#7cffc5' : '#ff4444';
      var h = (hp / 100) * 32;
      ctx.fillStyle = col;
      ctx.fillRect(x - 5, H / 2 - h / 2, 10, h);
    });

    ['11520', '18888', '18921'].forEach(function(id, i) {
      var xs = [0.4, 0.5, 0.6];
      var st = G.nodes[id] || 'neutral';
      var col = st === 'bull' ? '#7cffc5' : st === 'bear' ? '#ff4444' : '#ffd778';
      ctx.strokeStyle = col;
      ctx.strokeRect(W * xs[i] - 12, H / 2 - 8, 24, 16);
      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.fillText(id, W * xs[i], H / 2 + 3);
    });

    for (var mi = 0; mi < G.bullMinions; mi++) {
      ctx.fillStyle = '#7cffc5';
      ctx.beginPath();
      ctx.arc(W * 0.2 + mi * 12 + pct * 40, H / 2 - 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var mj = 0; mj < G.bearMinions; mj++) {
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(W * 0.8 - mj * 12 - pct * 40, H / 2 + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = 'left';
  };

  GameEngine.prototype.drawWorldMap = function() {
    var canvas = this.worldCanvas;
    if (!canvas || !global.KGEN_UNIVERSE_MAP) return;
    global.KGEN_UNIVERSE_MAP.drawCosmicMap(canvas, { height: 180, highlight: 'game' });
  };

  GameEngine.prototype.updateFromKline = function(d) {
    this.state.kPrice = d.price;
    this.state.kChange = d.change;
    var dir = this.physics && this.physics.vkDirection(d.change);
    if (dir && this.civ) this.civ.setFaction(dir.side === 'neutral' ? 'neutral' : dir.side);

    if (d.change > 2 && this.state.towers['t1-bear'] > 0) {
      this.state.towers['t1-bear'] -= 2;
      this.log('K線強漲 +K！多方壓制空方一塔', '#7cffc5');
    } else if (d.change < -2 && this.state.towers['t1-bull'] > 0) {
      this.state.towers['t1-bull'] -= 2;
      this.log('K線暴跌 -K！空方反撲多方一塔', '#ff4444');
    }

    var priceEl = document.getElementById('live-price');
    var chgEl = document.getElementById('live-chg');
    if (priceEl) priceEl.textContent = d.price.toFixed(2);
    if (chgEl && global.KGEN_priceDir) {
      var pd = global.KGEN_priceDir(d.change);
      chgEl.textContent = pd.text;
      chgEl.style.color = pd.color;
    }
    this.renderAll();
  };

  GameEngine.prototype.action = function(act) {
    var G = this.state;
    switch (act) {
      case 'buy':
        G.bullMinions = Math.min(10, G.bullMinions + 1);
        this.log('📈 做多加兵 · 共 ' + G.bullMinions, '#7cffc5');
        break;
      case 'sell':
        G.bearMinions = Math.min(10, G.bearMinions + 1);
        this.log('📉 做空加兵 · 共 ' + G.bearMinions, '#ff4444');
        break;
      case 'hold':
        ['t1-bull', 't2-bull'].forEach(function(k) {
          if (G.towers[k] < 100) G.towers[k] = Math.min(100, G.towers[k] + 12);
        });
        this.log('⏸️ 持倉修復塔 +12', '#ffd778');
        break;
      case 'fortune':
        if (G.towers['t1-bear'] > 0) G.towers['t1-bear'] -= 25;
        G.bullMinions = Math.min(10, G.bullMinions + 2);
        if (this.civ) this.civ.upgradeSkill('fortune');
        this.log('🧧 神兵·發財金！空方塔重創', '#7cffc5');
        break;
      case 'ignite':
        if (G.towers['t1-bull'] > 0) G.towers['t1-bull'] -= 25;
        G.bearMinions = Math.min(10, G.bearMinions + 2);
        if (this.civ) this.civ.upgradeSkill('ignite');
        this.log('🌬️ 轉日呼吸！多方塔重創', '#ff4444');
        break;
      case 'warp':
        if (G.warpCooldown > 0) {
          this.log('曲速冷卻中 ' + G.warpCooldown + 's', '#ffd778');
          return;
        }
        G.warpCooldown = 30;
        G.bullMinions += 1;
        G.bearMinions += 1;
        if (this.civ) this.civ.upgradeSkill('warp');
        this.log('🚀 宇宙飛船 Warp！全線推進', '#00f2ff');
        break;
      case 'boss':
        G.bossActive = true;
        this.log('⛰️ Boss 戰開始：' + this.boss.name, '#ff4444');
        break;
      case 'skill':
        G.bossHp -= 40 + (this.civ ? this.civ.state.level * 5 : 0);
        if (G.bossHp <= 0) {
          G.bossActive = false;
          G.bossHp = 500;
          if (this.civ) {
            this.civ.addXP(this.boss.rewardXp);
            this.civ.completeQuest('q-game-win');
          }
          this.log('🏆 Boss 擊敗！文明 XP +' + this.boss.rewardXp, '#7cffc5');
        } else {
          this.log('⚔️ 神兵攻擊！Boss HP ' + G.bossHp, '#ffd778');
        }
        break;
    }
    this.renderAll();
    this.checkWin();
  };

  GameEngine.prototype.claimNode = function(id) {
    if (!this.state.nodes.hasOwnProperty(id)) return;
    this.state.nodes[id] = 'bull';
    this.log('🌿 佔領節點 ' + id, '#ffd778');
    if (this.civ) this.civ.visitNode(id);
    this.renderAll();
  };

  GameEngine.prototype.newRound = function() {
    this.state.round++;
    this.state.timer = 90;
    this.state.bullMinions = 4;
    this.state.bearMinions = 4;
    this.log('🔄 回合 #' + this.state.round, '#ffd778');
    this.renderAll();
  };

  GameEngine.prototype.checkWin = function() {
    var G = this.state;
    if (G.gameOver) return;

    var bullTowersDown = G.towers['t1-bear'] <= 0 && G.towers['t2-bear'] <= 0;
    var bearTowersDown = G.towers['t1-bull'] <= 0 && G.towers['t2-bull'] <= 0;

    if (bullTowersDown) {
      G.bearBase = Math.max(0, G.bearBase - 15);
      G.bullScore += 10;
      if (G.bearBase <= 0) {
        G.gameOver = true;
        G.gameWinner = 'bull';
        this.log('🏆 多方大勝！16888 廣寒宮陷落！最終比分：多方 ' + G.bullScore + ' : 空方 ' + G.bearScore, '#7cffc5');
        if (this.civ) this.civ.completeQuest('q-game-win');
        this._showGameOver('bull');
        return;
      }
    }
    if (bearTowersDown) {
      G.bullBase = Math.max(0, G.bullBase - 15);
      G.bearScore += 10;
      if (G.bullBase <= 0) {
        G.gameOver = true;
        G.gameWinner = 'bear';
        this.log('💀 空方大勝！12345 神殿陷落！最終比分：多方 ' + G.bullScore + ' : 空方 ' + G.bearScore, '#ff4444');
        this._showGameOver('bear');
        return;
      }
    }
    this.renderScore();
  };

  GameEngine.prototype._showGameOver = function(winner) {
    var overlay = document.getElementById('game-over-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'game-over-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
      document.body.appendChild(overlay);
    }
    var G = this.state;
    var isBull = winner === 'bull';
    var self = this;
    overlay.innerHTML =
      '<div style="font-size:56px;">' + (isBull ? '🏆' : '⚔️') + '</div>' +
      '<div style="font-size:28px;font-weight:950;color:' + (isBull ? '#7cffc5' : '#ff4444') + ';">' +
        (isBull ? '多方勝利！' : '空方勝利！') +
      '</div>' +
      '<div style="font-size:16px;color:#ffd778;">回合 ' + G.round + ' · 比分 多方 ' + G.bullScore + ' — 空方 ' + G.bearScore + '</div>' +
      '<button style="margin-top:10px;padding:14px 32px;border-radius:999px;border:1px solid #ffd778;background:rgba(255,215,120,.2);color:#ffd778;font-size:16px;font-weight:900;cursor:pointer;" id="btn-restart-game">🔄 重新開始</button>';
    overlay.querySelector('#btn-restart-game').onclick = function() {
      overlay.remove();
      self.resetGame();
    };
  };

  GameEngine.prototype.resetGame = function() {
    var G = this.state;
    G.round = 1; G.timer = 90;
    G.bullBase = 100; G.bearBase = 100;
    G.bullScore = 0; G.bearScore = 0;
    G.bullMinions = 4; G.bearMinions = 4;
    G.gameOver = false; G.gameWinner = null;
    G.nodes = { '11520': 'neutral', '18888': 'neutral', '18921': 'neutral' };
    this._initFromMap();
    this.log('🔄 遊戲重新開始！', '#ffd778');
    this.renderAll();
  };

  GameEngine.prototype.renderTowers = function() {
    var self = this;
    Object.keys(this.state.towers).forEach(function(k) {
      var hp = Math.max(0, self.state.towers[k]);
      var bar = document.getElementById(k + '-bar');
      var hpEl = document.getElementById(k + '-hp');
      if (bar) bar.style.width = hp + '%';
      if (hpEl) hpEl.textContent = hp + '/100';
    });
  };

  GameEngine.prototype.renderMinions = function() {
    var G = this.state;
    var bullEl = document.getElementById('bull-minions');
    var bearEl = document.getElementById('bear-minions');
    if (bullEl) {
      var b = '';
      for (var i = 0; i < G.bullMinions; i++) b += '<span class="minion-chip mc-bull">🐂' + (i + 1) + '</span>';
      bullEl.innerHTML = b || '—';
    }
    if (bearEl) {
      var r = '';
      for (var j = 0; j < G.bearMinions; j++) r += '<span class="minion-chip mc-bear">🐻' + (j + 1) + '</span>';
      bearEl.innerHTML = r || '—';
    }
  };

  GameEngine.prototype.renderScore = function() {
    var G = this.state;
    var bh = document.getElementById('bull-hp');
    var rh = document.getElementById('bear-hp');
    if (bh) bh.textContent = G.bullBase;
    if (rh) rh.textContent = G.bearBase;
    var re = document.getElementById('game-round');
    var te = document.getElementById('game-timer');
    if (re) re.textContent = G.round;
    if (te) te.textContent = G.timer + 's';
  };

  GameEngine.prototype.renderQuests = function() {
    var el = document.getElementById('quest-list');
    if (!el || !this.civ) return;
    var done = this.civ.state.questsCompleted;
    el.innerHTML = this.civ.quests.map(function(q) {
      var ok = done.indexOf(q.id) >= 0;
      return '<div class="kgen-card" style="padding:8px;margin-bottom:6px;opacity:' + (ok ? 0.6 : 1) + '">' +
        (ok ? '✅' : '⬜') + ' ' + q.name + ' <span style="color:var(--kgen-gold)">+' + q.xp + ' XP</span></div>';
    }).join('');
  };

  GameEngine.prototype.renderAll = function() {
    this.drawBattlefield();
    this.drawWorldMap();
    this.renderTowers();
    this.renderMinions();
    this.renderScore();
    this.renderQuests();
    if (this.civ) this.civ.renderHUD('civ-hud');
  };

  GameEngine.prototype.start = function() {
    var self = this;
    this.renderAll();
    this.log('🎮 K線5D峽谷 V1.1 引擎啟動 · 勝負系統 / 分數累計', '#ffd778');

    if (global.KGEN_KlineFeed) {
      global.KGEN_KlineFeed.poll('BNBUSDT', function(d) { self.updateFromKline(d); }, 15000);
    }

    setInterval(function() {
      if (self.state.gameOver) return;
      self.state.timer--;
      if (self.state.warpCooldown > 0) self.state.warpCooldown--;

      if (self.state.timer <= 0) {
        self.state.timer = 90;
        self.state.round++;
        self.log('⏰ 新回合 #' + self.state.round + ' · 比分 多方 ' + self.state.bullScore + ' — 空方 ' + self.state.bearScore, '#ffd778');
        /* Passive tower regen each round */
        ['t1-bull','t2-bull'].forEach(function(k) {
          if (self.state.towers[k] > 0 && self.state.towers[k] < 100)
            self.state.towers[k] = Math.min(100, self.state.towers[k] + 5);
        });
      }

      /* Auto battle every 10s */
      if (self.state.timer % 10 === 0) {
        var kFactor = self.state.kChange > 0 ? 1.3 : 0.8;
        var bd = Math.ceil(self.state.bullMinions * 2 * kFactor);
        var rd = Math.ceil(self.state.bearMinions * 2 / kFactor);

        /* Node bonuses */
        if (self.state.nodes['18888'] === 'bull') bd += 3;
        if (self.state.nodes['11520'] === 'bull') bd += 2;
        if (self.state.nodes['18921'] === 'bull') bd += 2;

        if (self.state.towers['t1-bear'] > 0) self.state.towers['t1-bear'] = Math.max(0, self.state.towers['t1-bear'] - bd);
        else if (self.state.towers['t2-bear'] > 0) self.state.towers['t2-bear'] = Math.max(0, self.state.towers['t2-bear'] - bd);
        if (self.state.towers['t1-bull'] > 0) self.state.towers['t1-bull'] = Math.max(0, self.state.towers['t1-bull'] - rd);
        else if (self.state.towers['t2-bull'] > 0) self.state.towers['t2-bull'] = Math.max(0, self.state.towers['t2-bull'] - rd);

        self.checkWin();
      }
      self.renderAll();
    }, 1000);

    if (global.KGEN_UNIVERSE_ANIMATION) {
      global.KGEN_UNIVERSE_ANIMATION.add(function() {
        /* rAF hook for future particle effects */
      });
    }
  };

  global.KLINE_5D_GAME_ENGINE = GameEngine;
  global.KLINE_5D_ENGINE_VERSION = ENGINE_VERSION;
})(window);
