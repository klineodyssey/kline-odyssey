/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-recording-engine.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  window.KGEN_RECORDING_RUNTIME = {
    version: "V10.39.0_RUNTIME_GOVERNANCE",
    supported() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.MediaRecorder);
    },
    explainFallback() {
      alert("此瀏覽器或手機環境不支援直接螢幕錄影。請使用系統內建錄影，或改用 Chrome 桌面版。");
    },
    async startScreenRecord() {
      if (!this.supported()) return this.explainFallback();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, {type:"video/webm"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kgen-12345-recording.webm";
        a.click();
      };
      recorder.start();
      setTimeout(() => recorder.stop(), 30000);
    }
  };
})();
