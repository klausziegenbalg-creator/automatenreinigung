const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.loadLastCleaning = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {

    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false });
    }

    try {
      const { automatCode } = req.body || {};

      if (!automatCode) {
        return res.json({ ok: true, last: null });
      }

      let doc = null;

      try {
        const snap = await admin
          .firestore()
          .collection("reinigungen")
          .where("automatCode", "==", automatCode)
          .orderBy("datum", "desc")
          .limit(1)
          .get();

        if (!snap.empty) {
          doc = snap.docs[0].data();
        }
      } catch (err) {
        console.warn("loadLastCleaning fallback:", err?.message || err);
        const snap = await admin
          .firestore()
          .collection("reinigungen")
          .where("automatCode", "==", automatCode)
          .limit(50)
          .get();

        if (!snap.empty) {
          doc = snap.docs
            .map(entry => entry.data())
            .filter(entry => entry?.datum?.toDate)
            .sort((a, b) => b.datum.toDate() - a.datum.toDate())[0];
        }
      }

      if (!doc) {
        return res.json({ ok: true, last: null });
      }

      return res.json({
        ok: true,
        last: {
          datum: doc.datum.toDate().toISOString().slice(0, 10),
          name: doc.mitarbeiter || ""
        }
      });

    } catch (err) {
      console.error("loadLastCleaning error:", err);
      return res.status(500).json({ ok: false });
    }
  });
