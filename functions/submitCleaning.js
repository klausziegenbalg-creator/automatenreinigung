/**
 * Cloud Function: submitCleaning
 * Zweck:
 * - Speichert Reinigungsprotokolle
 * - Wird per fetch (POST) aus der Reiniger App aufgerufen
 * - CORS-sicher
 * - Region: us-central1
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Firebase Admin initialisieren (nur einmal)
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.submitCleaning = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {

    // ===============================
    // CORS
    // ===============================
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

      // ===============================
      // Pflichtfelder prüfen
      // ===============================
      if (
        !data.automatCode ||
        !data.datum ||
        !data.mitarbeiter ||
        !data.stadt ||
        !data.center
      ) {
        return res.status(400).json({
          ok: false,
          error: "Missing required fields"
        });
      }

      // ===============================
      // Datum normalisieren
      // ===============================
      const datumDate = new Date(`${data.datum}T00:00:00`);

      // ===============================
      // Schreiben in Firestore
      // ===============================
      await admin.firestore().collection("reinigungen").add({
        // Meta
        automatCode: data.automatCode,
        stadt: data.stadt,
        center: data.center,
        mitarbeiter: data.mitarbeiter,
        datum: admin.firestore.Timestamp.fromDate(datumDate),
        erstelltAm: admin.firestore.FieldValue.serverTimestamp(),

        // ===============================
        // Punkt 2 – Aufgaben pro Automat
        // ===============================
        zucker_aufgefuellt: !!data.zucker_aufgefuellt,
        wasser_aufgefuellt: !!data.wasser_aufgefuellt,
        staebe_aufgefuellt: !!data.staebe_aufgefuellt,
        zuckerfach_gereinigt: !!data.zuckerfach_gereinigt,
        faecher_gereinigt: !!data.faecher_gereinigt,
        abwasser_entleert: !!data.abwasser_entleert,
        produktionsraum_gereinigt: !!data.produktionsraum_gereinigt,
        messer_gereinigt: !!data.messer_gereinigt,
        roboterarm_gereinigt: !!data.roboterarm_gereinigt,
        sieb_gereinigt: !!data.sieb_gereinigt,
        auffangschale_gereinigt: !!data.auffangschale_gereinigt,
        aufbewahrung_aufgeraeumt: !!data.aufbewahrung_aufgeraeumt,
        automat_aussen_gereinigt: !!data.automat_aussen_gereinigt,
        scheiben_gereinigt: !!data.scheiben_gereinigt,
        brennerkopf_gereinigt: !!data.brennerkopf_gereinigt,
        duese_gereinigt: !!data.duese_gereinigt,

        // ===============================
        // Punkt 3 – Funktionsprüfung
        // ===============================
        befeuchtungstest: !!data.befeuchtungstest,
        reinigungstest: !!data.reinigungstest,
        neuer_stab_genommen: !!data.neuer_stab_genommen,
        roboterarm_90grad: !!data.roboterarm_90grad,
        kreditkartensystem_ok: !!data.kreditkartensystem_ok,
        geldschein_system_ok: !!data.geldschein_system_ok,
        material_im_system: !!data.material_im_system,

        // ===============================
        // Punkt 4 – Bestände
        // ===============================
        zucker_rot: Number(data.zucker_rot || 0),
        zucker_gelb: Number(data.zucker_gelb || 0),
        zucker_blau: Number(data.zucker_blau || 0),
        zucker_gruen: Number(data.zucker_gruen || 0),
        zucker_weinrot: Number(data.zucker_weinrot || 0),
        zucker_weiss: Number(data.zucker_weiss || 0),
        staebe: Number(data.staebe || 0),

        // ===============================
        // Texte
        // ===============================
        auffaelligkeiten: data.auffaelligkeiten || ""
      });

      return res.json({ ok: true });

    } catch (err) {
      console.error("submitCleaning error:", err);
      return res.status(500).json({
        ok: false,
        error: "Internal server error"
      });
    }
  });
