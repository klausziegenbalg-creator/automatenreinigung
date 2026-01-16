/**
 * Cloud Function: submitWartung
 * Zweck:
 * - Speichert Wartung / Reparatur aus der Reiniger-App
 * - Wird per fetch (POST) aufgerufen
 * - CORS-sicher
 * - Region: us-central1
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Firebase Admin initialisieren (nur einmal)
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.submitWartung = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {

    // -------------------------------
    // CORS
    // -------------------------------
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    try {
      const data = req.body || {};

      const {
        automatCode,
        stadt,
        center,
        datum,
        name,
        wartungselementId,
        bezeichnung,
        bemerkung,
        photoUrl
      } = data;

      // -------------------------------
      // Pflichtfelder prüfen
      // -------------------------------
      if (!automatCode || !datum || !name) {
        return res.json({
          ok: false,
          error: "Pflichtfelder fehlen"
        });
      }

      if (!wartungselementId && !bezeichnung) {
        return res.json({
          ok: false,
          error: "Keine Wartung angegeben"
        });
      }

      // -------------------------------
      // Bezeichnung bestimmen
      // -------------------------------
      let finalBezeichnung = bezeichnung || "";

      if (wartungselementId) {
        const ref = await admin
          .firestore()
          .collection("Wartungselemente")
          .doc(wartungselementId)
          .get();

        if (ref.exists) {
          finalBezeichnung = ref.data().bezeichnung || finalBezeichnung;
        }
      }

      // -------------------------------
      // In Firestore speichern
      // -------------------------------
      await admin.firestore().collection("Wartungsprotokolle").add({
        automatCode,
        stadt: stadt || "",
        center: center || "",
        datum: admin.firestore.Timestamp.fromDate(new Date(datum)),
        name,
        bezeichnung: finalBezeichnung,
        wartungselementId: wartungselementId || null,
        bemerkung: bemerkung || "",
        photoUrl:
          typeof photoUrl === "string" && photoUrl.startsWith("https://")
            ? photoUrl
            : "",
        quelle: "reiniger-app",
        erstelltAm: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({ ok: true });

    } catch (err) {
      console.error("submitWartung error:", err);
      return res.status(500).json({
        ok: false,
        error: "Wartung konnte nicht gespeichert werden"
      });
    }
  });
