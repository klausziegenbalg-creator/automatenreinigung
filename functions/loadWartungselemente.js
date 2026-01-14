/**
 * Cloud Function: loadWartungselemente
 * Zweck:
 * - Liefert Wartungselemente (typ = "Checkheft")
 * - Wird vom Frontend per fetch (POST) aufgerufen
 * - CORS-sicher
 * - Region: us-central1
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Firebase Admin initialisieren (nur einmal)
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.loadWartungselemente = functions
  .region("us-central1")
  .https.onRequest((req, res) => {

    // CORS-Handling
    cors(req, res, async () => {

      // Preflight-Request
      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      // Nur POST erlauben
      if (req.method !== "POST") {
        return res.status(405).json({
          ok: false,
          error: "Method not allowed"
        });
      }

      try {
        // Wartungselemente laden (nur Checkheft)
        const snap = await admin
          .firestore()
          .collection("Wartungselemente")
          .where("typ", "==", "Checkheft")
          .get();

        const items = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return res.json({
          ok: true,
          items
        });

      } catch (err) {
        console.error("loadWartungselemente error:", err);
        return res.status(500).json({
          ok: false,
          error: "Internal server error"
        });
      }
    });
  });
