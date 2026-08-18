import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/api/client";

const SessionContext = createContext(null);
const STORAGE_KEY = "jobos.session_id";

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function ensure() {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        try {
          await api.get(`/demo/session/${existing}`);
          if (active) {
            setSessionId(existing);
            setReady(true);
            return;
          }
        } catch (e) {
          // fall through and create
        }
      }
      const { data } = await api.post("/demo/session");
      localStorage.setItem(STORAGE_KEY, data.session_id);
      if (active) {
        setSessionId(data.session_id);
        setReady(true);
      }
    }
    ensure();
    return () => { active = false; };
  }, []);

  const reset = useCallback(async () => {
    if (!sessionId) return;
    await api.post(`/demo/session/${sessionId}/reset`);
  }, [sessionId]);

  const newSession = useCallback(async () => {
    const { data } = await api.post("/demo/session");
    localStorage.setItem(STORAGE_KEY, data.session_id);
    setSessionId(data.session_id);
    return data.session_id;
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, ready, reset, newSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
