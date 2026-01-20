const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.verifyPin = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { pin } = req.body || {};
    if (!pin) {
      return res.json({ ok: false, error: "PIN fehlt" });
    }

    // 1️⃣ PIN prüfen
    const snap = await db
      .collection("pins")
      .where("pin", "==", String(pin))
      .limit(1)
      .get();

    if (snap.empty) {
      return res.json({ ok: false, error: "PIN falsch" });
    }

    const pinData = snap.docs[0].data();
    const name = pinData.name;
    const role = (pinData.role || "").toLowerCase();

    if (!name || !role) {
      return res.json({ ok: false, error: "PIN unvollständig" });
    }

    // 2️⃣ Stadt aus Automaten ableiten
    let stadt = (pinData.stadt || "").trim();

    const autoSnap = await db.collection("automaten").get();
    autoSnap.forEach(doc => {
      const a = doc.data();

      if (!stadt && role === "teamleiter" && a.leitung === name && a.stadt) {
        stadt = a.stadt;
      }

      if (!stadt && role === "mitarbeiter" && a.mitarbeiter === name && a.stadt) {
        stadt = a.stadt;
      }
    });

    // Admin darf alles
    if (role === "admin") {
      stadt = "";
    }

    return res.json({
      ok: true,
      name,
      role,
      stadt
    });

  } catch (err) {
    console.error("verifyPin error:", err);
    return res.status(500).json({ ok: false, error: "Serverfehler" });
  }
});
