import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Payload recibido para el reseteo de contraseña.
 */
type ResetPayload = {
  telefono: string;
  nuevaPassword: string;
};

/**
 * Extrae solo dígitos de un valor.
 * @param {unknown} v Valor de entrada.
 * @return {string} Cadena con solo dígitos.
 */
const digits = (v: unknown): string => {
  return String(v ?? "").replace(/\D+/g, "");
};

/**
 * Construye el email técnico del usuario a partir del teléfono.
 * Ejemplo: 987654321 -> 987654321@conectape.pe
 * @param {string} phone Teléfono del usuario.
 * @return {string} Email técnico generado.
 */
const buildEmailFromPhone = (phone: string): string => {
  return `${digits(phone)}@conectape.pe`;
};

/**
 * Verifica si el usuario autenticado es admin según Firestore.
 * Debe existir usuarios/{uid} y rol === "admin".
 * @param {string} uid UID del usuario que llama.
 * @return {Promise<void>} No retorna valor, lanza error si no es admin.
 */
const assertRequesterIsAdmin = async (uid: string): Promise<void> => {
  const ref = admin.firestore().collection("usuarios").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError(
      "permission-denied",
      "No autorizado (sin perfil)."
    );
  }

  const data = snap.data() as {rol?: unknown; activo?: unknown} | undefined;

  const rol = String(data?.rol ?? "").toLowerCase().trim();
  const activo = Boolean(data?.activo ?? true);

  if (!activo) {
    throw new HttpsError(
      "permission-denied",
      "Usuario deshabilitado."
    );
  }

  if (rol !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "No autorizado."
    );
  }
};

/**
 * Resetea la contraseña de un usuario móvil usando su teléfono.
 * Solo puede ser ejecutado por un usuario con rol "admin"
 * (validado en Firestore).
 * @param {import("firebase-functions/v2/https")
 * .CallableRequest<ResetPayload>} request
 * @return {{ok: boolean, telefono: string}}
 */
export const resetPasswordByTelefono = onCall<ResetPayload>(
  async (request) => {
    // 1) Debe estar autenticado
    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "No autenticado."
      );
    }

    // 2) Validar que el que llama sea admin (Firestore)
    await assertRequesterIsAdmin(request.auth.uid);

    // 3) Validar payload
    const telefono = digits(request.data?.telefono).slice(0, 9);
    const nuevaPassword = String(
      request.data?.nuevaPassword ?? ""
    ).trim();

    if (!/^9\d{8}$/.test(telefono)) {
      throw new HttpsError(
        "invalid-argument",
        "Teléfono inválido (Perú)."
      );
    }

    if (nuevaPassword.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "Contraseña mínimo 6 caracteres."
      );
    }

    // 4) Obtener usuario por email técnico
    const email = buildEmailFromPhone(telefono);

    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (e) {
      throw new HttpsError(
        "not-found",
        "No existe un usuario con ese teléfono."
      );
    }

    // 5) Actualizar password en Auth
    await admin.auth().updateUser(userRecord.uid, {
      password: nuevaPassword,
    });

    // 6) Marcar evento en Firestore (opcional)
    await admin.firestore().collection("usuarios").doc(userRecord.uid).set(
      {
        passwordReseteadaPorAdmin: true,
        passwordReseteadaEn: admin.firestore.FieldValue.serverTimestamp(),
        passwordReseteadaPorUid: request.auth.uid,
      },
      {merge: true}
    );

    return {ok: true, telefono: telefono};
  }
);
