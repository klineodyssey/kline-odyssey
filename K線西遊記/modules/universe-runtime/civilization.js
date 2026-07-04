/*
 * KGEN Universe Runtime — Civilization Module V1.0
 * Civilization progress, quests, faction standing
 */
(function(global) {
  'use strict';

  var STORAGE_KEY = 'kgen_civilization_v1';

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      level: 1,
      xp: 0,
      faction: 'neutral',
      questsCompleted: [],
      nodesVisited: [],
      equipment: { weapon: '木棍', ship: '筋斗雲 Lv.1' },
      skills: { fortune: 1, ignite: 1, warp: 1 },
    };
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  var QUEST_TABLE = [
    { id: 'q-visit-11520', name: '抵達花果山', xp: 50, node: '11520' },
    { id: 'q-visit-18888', name: '拜訪靈霄寶殿', xp: 50, node: '18888' },
    { id: 'q-visit-18921', name: '斬妖台儀式', xp: 50, node: '18921' },
    { id: 'q-visit-108000', name: '火星殖民', xp: 80, node: '108000' },
    { id: 'q-game-win', name: '峽谷推塔勝利', xp: 120, node: 'game' },
    { id: 'q-wallet', name: '連接宇宙錢包', xp: 30, node: 'any' },
  ];

  var CivilizationRuntime = {
    state: loadState(),
    quests: QUEST_TABLE,

    visitNode: function(nodeId) {
      var id = String(nodeId);
      if (this.state.nodesVisited.indexOf(id) < 0) {
        this.state.nodesVisited.push(id);
        this.addXP(10);
        this.checkQuests(id);
        saveState(this.state);
      }
    },

    addXP: function(amount) {
      this.state.xp += amount;
      while (this.state.xp >= this.state.level * 100) {
        this.state.xp -= this.state.level * 100;
        this.state.level++;
        if (global.KGEN_UNIVERSE_STATUS_BUS) {
          global.KGEN_UNIVERSE_STATUS_BUS.emit('civ:levelup', { level: this.state.level });
        }
      }
      saveState(this.state);
    },

    completeQuest: function(questId) {
      if (this.state.questsCompleted.indexOf(questId) >= 0) return false;
      var q = QUEST_TABLE.find(function(x) { return x.id === questId; });
      if (!q) return false;
      this.state.questsCompleted.push(questId);
      this.addXP(q.xp);
      if (global.KGEN_UNIVERSE_STATUS_BUS) {
        global.KGEN_UNIVERSE_STATUS_BUS.emit('civ:quest', { quest: q });
      }
      saveState(this.state);
      return true;
    },

    checkQuests: function(nodeId) {
      var self = this;
      QUEST_TABLE.forEach(function(q) {
        if (q.node === nodeId || q.node === 'any') {
          if (q.node === 'any' && nodeId !== 'wallet') return;
          if (self.state.questsCompleted.indexOf(q.id) < 0 && q.node === nodeId) {
            self.completeQuest(q.id);
          }
        }
      });
    },

    onWalletConnected: function() {
      this.completeQuest('q-wallet');
    },

    setFaction: function(side) {
      this.state.faction = side;
      saveState(this.state);
    },

    getProgress: function() {
      return {
        level: this.state.level,
        xp: this.state.xp,
        nextLevel: this.state.level * 100,
        faction: this.state.faction,
        quests: this.state.questsCompleted.length + '/' + QUEST_TABLE.length,
        equipment: this.state.equipment,
        skills: this.state.skills,
      };
    },

    renderHUD: function(containerId) {
      var el = document.getElementById(containerId);
      if (!el) return;
      var p = this.getProgress();
      el.innerHTML =
        '<div class="kgen-civ-hud">' +
        '<span>Lv.' + p.level + '</span>' +
        '<span>XP ' + p.xp + '/' + p.nextLevel + '</span>' +
        '<span>任務 ' + p.quests + '</span>' +
        '<span>' + p.equipment.weapon + '</span>' +
        '</div>';
    },

    upgradeSkill: function(name) {
      if (!this.state.skills[name]) this.state.skills[name] = 1;
      if (this.state.level < this.state.skills[name] + 2) return false;
      this.state.skills[name]++;
      saveState(this.state);
      return true;
    },
  };

  global.KGEN_UNIVERSE_CIVILIZATION = CivilizationRuntime;
})(window);
