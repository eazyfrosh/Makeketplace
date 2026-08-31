"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";

import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getOne, upsert } from "@/lib/services/store";
import { DEMO_ADMIN_UID } from "@/lib/licensing/demo-constants";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { AFFILIATE_REF_KEY } from "@/components/affiliate/ref-capture";

export type UserRole = "customer" | "admin";

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

interface DemoUserRecord {
  uid: string;
  email: string;
  password: string;
  name: string;
}

const DEMO_USERS_KEY = "nexova_demo_users";
const DEMO_SESSION_KEY = "nexova_demo_session";
const DEMO_ADMIN_EMAIL = "admin@nexova.demo";
const DEMO_ADMIN_PASSWORD = "admin123";
const USERS_COLLECTION = "users";

function readDemoUsers(): DemoUserRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DEMO_USERS_KEY);
  return raw ? (JSON.parse(raw) as DemoUserRecord[]) : [];
}

function writeDemoUsers(users: DemoUserRecord[]) {
  window.localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function makeProfile(uid: string, email: string, name: string, role: UserRole = "customer"): UserProfile {
  return {
    id: uid,
    uid,
    email,
    name: name || email.split("@")[0],
    role,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Called once right after a signup succeeds, if the browser captured a
 * `?ref=CODE` before the account existed (see RefCapture). Consumes the
 * stored code either way — a failed/duplicate/unknown-code attribution
 * attempt shouldn't keep re-firing on every future page load.
 */
async function attributeReferralIfPresent() {
  if (typeof window === "undefined") return;
  const code = window.localStorage.getItem(AFFILIATE_REF_KEY);
  if (!code) return;
  window.localStorage.removeItem(AFFILIATE_REF_KEY);
  try {
    const headers = await getAuthHeaders();
    await fetch("/api/affiliate/attribute-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ code }),
    });
  } catch {
    // Best-effort — a missed attribution shouldn't surface as a signup error.
  }
}

async function ensureDemoAdminSeed() {
  const users = readDemoUsers();
  if (users.some((u) => u.email === DEMO_ADMIN_EMAIL)) return;
  users.push({
    uid: DEMO_ADMIN_UID,
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    name: "Nexova Admin",
  });
  writeDemoUsers(users);
  await upsert<UserProfile>(
    USERS_COLLECTION,
    makeProfile(DEMO_ADMIN_UID, DEMO_ADMIN_EMAIL, "Nexova Admin", "admin"),
  );
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isFirebaseConfigured;

  useEffect(() => {
    if (isDemoMode) {
      ensureDemoAdminSeed().then(() => {
        const sessionUid = window.localStorage.getItem(DEMO_SESSION_KEY);
        if (sessionUid) {
          getOne<UserProfile>(USERS_COLLECTION, sessionUid).then((profile) => setUser(profile));
        }
        setLoading(false);
      });
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await getOne<UserProfile>(USERS_COLLECTION, firebaseUser.uid);
        if (!profile) {
          profile = makeProfile(firebaseUser.uid, firebaseUser.email ?? "", firebaseUser.displayName ?? "");
          await upsert(USERS_COLLECTION, profile);
        }
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      if (isDemoMode) {
        const users = readDemoUsers();
        if (users.some((u) => u.email === email)) {
          throw new Error("An account with this email already exists.");
        }
        const uid = `demo-${Date.now()}`;
        users.push({ uid, email, password, name });
        writeDemoUsers(users);
        const profile = makeProfile(uid, email, name);
        await upsert(USERS_COLLECTION, profile);
        window.localStorage.setItem(DEMO_SESSION_KEY, uid);
        setUser(profile);
        await attributeReferralIfPresent();
        return;
      }
      if (!auth) throw new Error("Firebase is not configured.");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateFirebaseProfile(cred.user, { displayName: name });
      const profile = makeProfile(cred.user.uid, email, name);
      await upsert(USERS_COLLECTION, profile);
      setUser(profile);
      await attributeReferralIfPresent();
    },
    [isDemoMode],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (isDemoMode) {
        const found = readDemoUsers().find((u) => u.email === email && u.password === password);
        if (!found) throw new Error("Invalid email or password.");
        window.localStorage.setItem(DEMO_SESSION_KEY, found.uid);
        const profile = await getOne<UserProfile>(USERS_COLLECTION, found.uid);
        setUser(profile);
        return;
      }
      if (!auth) throw new Error("Firebase is not configured.");
      await signInWithEmailAndPassword(auth, email, password);
    },
    [isDemoMode],
  );

  const logout = useCallback(async () => {
    if (isDemoMode) {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      return;
    }
    if (auth) await signOut(auth);
  }, [isDemoMode]);

  const value = useMemo(
    () => ({ user, loading, isDemoMode, signup, login, logout }),
    [user, loading, isDemoMode, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD };
