// PIE Digital NR-10 — Firebase configuration and service exports
// Replace the firebaseConfig values with your own Firebase project settings.

import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import type { UserProfile, VisitorInvite } from "@/types/rbac";

// ─── Firebase project configuration ──────────────────────────────────────────
// ✅ Credenciais carregadas via variáveis de ambiente (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// 🔍 Validação de variáveis de ambiente
const validateConfig = () => {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push("VITE_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missing.push("VITE_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket) missing.push("VITE_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId) missing.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) missing.push("VITE_FIREBASE_APP_ID");

  if (missing.length > 0) {
    const msg = `⚠️ Firebase não está configurado. Variáveis faltando: ${missing.join(", ")}. Configure no .env (local) ou no painel do Vercel (produção).`;
    console.error(msg);
    if (typeof window !== "undefined") {
      (window as any).__FIREBASE_CONFIG_ERROR__ = msg;
    }
  }
};

validateConfig();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const onAuthChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);

// ─── User Profile helpers ─────────────────────────────────────────────────────
export const createUserProfile = async (uid: string, email: string, role: "admin" | "editor" | "visitor" = "editor") => {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as UserProfile);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const onUserProfileChange = (uid: string, cb: (profile: UserProfile | null) => void) => {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null);
  });
};

// ─── Firestore helpers ────────────────────────────────────────────────────────
export const userCol = (uid: string, name: string) =>
  collection(db, "users", uid, name);

export const addRecord = async (
  uid: string,
  colName: string,
  data: Record<string, unknown>
) => {
  const ref = await addDoc(userCol(uid, colName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateRecord = async (
  uid: string,
  colName: string,
  id: string,
  data: Record<string, unknown>
) =>
  updateDoc(doc(db, "users", uid, colName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

export const deleteRecord = (uid: string, colName: string, id: string) =>
  deleteDoc(doc(db, "users", uid, colName, id));

export const listenCollection = (
  uid: string,
  colName: string,
  cb: (docs: Array<Record<string, unknown> & { id: string }>) => void
) => {
  const q = query(userCol(uid, colName), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })))
  );
};

// ─── Storage helpers ──────────────────────────────────────────────────────────
export const uploadDocumento = async (
  uid: string,
  clienteId: string,
  file: File
): Promise<{ url: string; path: string }> => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-z0-9.-]/gi, "_");
  const path = `documentos/${uid}/${clienteId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path };
};

export const deleteDocumentoFile = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

export const uploadClienteLogo = async (uid: string, file: File): Promise<string> => {
  const safeName = file.name.replace(/[^a-z0-9.-]/gi, "_");
  const path = `logos/${uid}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// ─── Visitor Invite helpers ───────────────────────────────────────────────────
export const createVisitorInvite = async (
  ownerUid: string,
  email: string,
  nomeCompleto?: string,
  expiresAt?: number
): Promise<string> => {
  const inviteRef = await addDoc(collection(db, "visitorInvites"), {
    ownerUid,
    email,
    nomeCompleto,
    role: "visitor",
    status: "pending",
    expiresAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as VisitorInvite);
  return inviteRef.id;
};

export const getVisitorInvite = async (inviteId: string): Promise<VisitorInvite | null> => {
  const snap = await getDoc(doc(db, "visitorInvites", inviteId));
  return snap.exists() ? (snap.data() as VisitorInvite) : null;
};

export const acceptVisitorInvite = async (inviteId: string, uid: string) => {
  const invite = await getVisitorInvite(inviteId);
  if (!invite) throw new Error("Convite não encontrado");
  if (invite.status !== "pending") throw new Error("Convite inválido ou expirado");
  if (invite.expiresAt && invite.expiresAt < Date.now()) throw new Error("Convite expirado");

  // Criar perfil de visitante
  await createUserProfile(uid, invite.email, "visitor");

  // Marcar convite como aceito
  await updateDoc(doc(db, "visitorInvites", inviteId), {
    status: "accepted",
    updatedAt: serverTimestamp(),
  });
};

export const listVisitorInvites = (ownerUid: string, cb: (invites: VisitorInvite[]) => void) => {
  const q = query(
    collection(db, "visitorInvites"),
    where("ownerUid", "==", ownerUid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as VisitorInvite));
  });
};

export const revokeVisitorInvite = async (inviteId: string) => {
  await updateDoc(doc(db, "visitorInvites", inviteId), {
    status: "revoked",
    updatedAt: serverTimestamp(),
  });
};

// ─── Public read-only sharing helpers ─────────────────────────────────────────
export interface PublicShareRecord {
  ownerUid: string;
  clienteId: string;
  active: boolean;
  mode: "readonly";
  data: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const createShareId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now()}${Math.random().toString(36).slice(2)}`;
};

export const savePublicShare = async (
  shareId: string,
  payload: Omit<PublicShareRecord, "active" | "mode" | "createdAt" | "updatedAt">
) => {
  await setDoc(doc(db, "publicShares", shareId), {
    ...payload,
    active: true,
    mode: "readonly",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return shareId;
};

export const getPublicShare = async (shareId: string) => {
  const snap = await getDoc(doc(db, "publicShares", shareId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as PublicShareRecord) };
};
