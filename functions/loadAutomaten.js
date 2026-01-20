const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.loadAutomaten = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      const { role, name, stadt } = req.body;

      if (!role) {
        return res.json({ ok: false, error: "role fehlt" });
      }

      let automaten = [];

      // =========================
      // ADMIN → ALLE AUTOMATEN
      // =========================
      if (role === "admin") {
        const snap = await db.collection("automaten").get();
        automaten = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // =========================
      // TEAMLEITER → NUR STADT
      // =========================
      else if (role === "teamleiter") {
        const trimmedName = (name || "").trim();

        if (stadt) {
          const snap = await db
            .collection("automaten")
            .where("stadt", "==", stadt)
            .get();

          automaten = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (trimmedName) {
          const snap = await db
            .collection("automaten")
            .where("leitung", "==", trimmedName)
            .get();

          automaten = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          return res.json({ ok: false, error: "stadt oder name fehlt" });
        }
      }

      // =========================
      // MITARBEITER → NUR SEINE
      // =========================
      else if (role === "mitarbeiter") {
        if (!name) {
          return res.json({ ok: false, error: "name fehlt" });
        }

        const snap = await db.collection("automaten").get();
        const target = name.trim().toLowerCase();

        automaten = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(a =>
            (a.mitarbeiter || "")
              .trim()
              .toLowerCase() === target
          );
      }

      else {
        return res.json({ ok: false, error: "unbekannte Rolle" });
      }

      return res.json({
        ok: true,
        count: automaten.length,
        automaten
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        error: err.message
      });
    }
  });
