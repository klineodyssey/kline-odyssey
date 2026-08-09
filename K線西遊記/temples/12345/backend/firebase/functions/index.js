const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

// Anonymous visitor analytics only. NOT a TempleHeart monetary ledger.
// Production should enable Firebase App Check / rate limiting.
exports.trackTempleVisit = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("METHOD_NOT_ALLOWED");
  const page = String(req.body?.page || "12345").slice(0, 64);
  const clientId = String(req.body?.clientId || "").slice(0, 160);
  if (!clientId) return res.status(400).send("MISSING_CLIENT_ID");

  const day = new Date().toISOString().slice(0, 10);
  const hash = crypto.createHash("sha256").update(clientId).digest("hex");
  const statsRef = db.collection("templeStats").doc(page);
  const visitorRef = statsRef.collection("visitors").doc(hash);
  const dayRef = statsRef.collection("days").doc(day);

  await db.runTransaction(async (tx) => {
    const visitor = await tx.get(visitorRef);
    tx.set(statsRef, { pageViews: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(dayRef, { pageViews: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (!visitor.exists) {
      tx.set(visitorRef, { firstSeenAt: FieldValue.serverTimestamp() });
      tx.set(statsRef, { approximateUniqueVisitors: FieldValue.increment(1) }, { merge: true });
      tx.set(dayRef, { newApproximateUniqueVisitors: FieldValue.increment(1) }, { merge: true });
    }
  });

  const current = await statsRef.get();
  return res.json({ ok: true, page, stats: current.data() || {} });
});
