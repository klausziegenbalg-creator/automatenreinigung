const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.verifyPin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { pin } = req.body || {};
      if (!pin) {
        return res.json({ ok: false, error: "PIN fehlt" });
      }

      const snap = await db.collection("pins").where("pin", "==", String(pin)).get();

      if (snap.empty) {
        return res.json({ ok: false, error: "PIN ungültig" });
      }

      const data = snap.docs[0].data();

      return res.json({
        ok: true,
        name: data.name || "",
        role: data.role || "",
        stadt: data.stadt || ""
      });

    } catch (err) {
      console.error("verifyPin error:", err);
      return res.status(500).json({ ok: false, error: "Serverfehler" });
    }
  });
});