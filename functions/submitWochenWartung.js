const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.submitWochenWartung = functions
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
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    try {
      const data = req.body || {};
      const automatCode = (data.automatCode || "").toString().trim();
      const mitarbeiter = (data.mitarbeiter || "").toString().trim();
      const woche = (data.woche || "").toString().trim();
      const inTasks =
        data.tasks && typeof data.tasks === "object" ? data.tasks : null;

      if (!automatCode || !mitarbeiter || !woche || !inTasks) {
        return res
          .status(400)
          .json({ ok: false, error: "Missing required fields" });
      }

      // tasks normalisieren:
      // pro Task -> { done:true, doneAt: serverTimestamp(), optional photoUrl }
      const tasks = {};
      Object.keys(inTasks).forEach((k) => {
        const key = (k || "").toString().trim();
        if (!key) return;

        const t = inTasks[k] || {};
        if (t && t.done) {
          const task = {
            done: true,
            doneAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // ✅ PATCH: photoUrl gezielt erlauben
          if (
            typeof t.photoUrl === "string" &&
            t.photoUrl.startsWith("https://")
          ) {
            task.photoUrl = t.photoUrl;
          }

          tasks[key] = task;
        }
      });

      if (Object.keys(tasks).length === 0) {
        return res
          .status(400)
          .json({ ok: false, error: "No tasks selected" });
      }

      await admin.firestore().collection("wochenWartung").add({
        automatCode,
        mitarbeiter,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "erledigt",
        woche,
        tasks,
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error("submitWochenWartung error:", err);
      return res
        .status(500)
        .json({ ok: false, error: "Internal server error" });
    }
  });
