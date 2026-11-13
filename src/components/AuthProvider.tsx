
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  initializeUserData,
  syncLocalDataToFirestore,
  subscribeToUserData,
  isApplyingRemoteUpdate,
} from "@/lib/firestoreSync";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let syncQueue = Promise.resolve();

    let removeDataListener: (() => void) | null = null;
    let removeCloudListener: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        const currentGeneration = ++generation;

        removeDataListener?.();
        removeCloudListener?.();

        removeDataListener = null;
        removeCloudListener = null;

        if (!active) return;

        setLoading(true);

        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          await initializeUserData(currentUser.uid);

          if (!active || currentGeneration !== generation) {
            return;
          }

          // Listen for changes made in Firestore.
          removeCloudListener = subscribeToUserData(
            currentUser.uid
          );

          // Upload changes made through the existing app components.
          const handleDataUpdate = () => {
            if (isApplyingRemoteUpdate()) return;

            syncQueue = syncQueue
              .then(() =>
                syncLocalDataToFirestore(currentUser.uid)
              )
              .catch((error: unknown) => {
                console.error(
                  "ZevaSewa cloud synchronization failed:",
                  error
                );
              });
          };

          window.addEventListener(
            "zevasewa-data-updated",
            handleDataUpdate
          );

          removeDataListener = () => {
            window.removeEventListener(
              "zevasewa-data-updated",
              handleDataUpdate
            );
          };

          setUser(currentUser);
          setLoading(false);
        } catch (error) {
          console.error(
            "Unable to initialize ZevaSewa cloud data:",
            error
          );

          if (active && currentGeneration === generation) {
            setUser(null);
            setLoading(true);
          }
        }
      }
    );

    return () => {
      active = false;
      generation++;

      unsubscribe();
      removeDataListener?.();
      removeCloudListener?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
