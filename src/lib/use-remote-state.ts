"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./toast-context";

// One user action, described so it can be applied, sent and (if it fails) undone.
export type Mutation<T> = {
  // Update local state right away
  apply: (current: T) => T;
  // Revert just this change if the request fails (receives the latest state)
  undo: (current: T) => T;
  // The per-item API call
  request: () => Promise<Response>;
  // Shown in the error toast when the request fails
  errorMessage: string;
};

// One queue for EVERY useRemoteState instance (transactions, budgets, categories), not
// one per instance. Some actions touch several lists, for example deleting a category
// moves its transactions, merges its budget and then deletes it, and the server relies on
// those requests arriving in that order.
let requestQueue: Promise<void> = Promise.resolve();

/**
 * State that is loaded once from `url` (GET) and changed through per-item requests.
 *
 *  - Optimistic: `mutate` updates the UI immediately.
 *  - Serialized: requests run one after another in the order the user made them (across
 *    all lists, see requestQueue), so two quick edits can never reach the server out of
 *    order.
 *  - Safe on failure: a failed request is undone locally, an error toast is shown,
 *    and once the queue is idle the list is re-fetched so the UI matches the database.
 */
export function useRemoteState<T>(url: string, initial: T) {
  const router = useRouter();
  const { toast } = useToast();

  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  // stateRef is the source of truth for logic (always current, even between renders);
  // `state` is what React renders.
  const stateRef = useRef<T>(initial);
  const loadedRef = useRef(false);
  const mountedRef = useRef(false);
  const pendingRef = useRef(0);
  const needsResyncRef = useRef(false);

  const commit = useCallback((next: T) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  // Returns null when the session has expired (and sends the user to /login)
  const fetchList = useCallback(async (): Promise<T | null> => {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/login");
      return null;
    }
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return (await res.json()) as T;
  }, [url, router]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    fetchList()
      .then((data) => {
        if (cancelled || data === null) return;
        loadedRef.current = true;
        stateRef.current = data;
        setState(data);
        setLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) toast("Couldn't load your data. Please refresh the page.");
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [fetchList, toast]);

  // Replace local state with what the server has, but only when nothing is in flight
  // (otherwise we'd wipe out optimistic changes that haven't been saved yet).
  const resync = useCallback(async () => {
    try {
      const data = await fetchList();
      if (data === null || !mountedRef.current) return;
      if (pendingRef.current > 0) {
        needsResyncRef.current = true; // try again when the queue drains
        return;
      }
      commit(data);
    } catch (err) {
      console.error(err);
    }
  }, [fetchList, commit]);

  const mutate = useCallback(
    (m: Mutation<T>) => {
      if (!loadedRef.current) {
        toast("Still loading your data. Try again in a moment.");
        return;
      }

      commit(m.apply(stateRef.current));
      pendingRef.current += 1;

      // This callback never rejects (everything is caught), so one failure can't
      // block the requests queued behind it.
      requestQueue = requestQueue.then(async () => {
        try {
          const res = await m.request();
          if (res.status === 401) {
            router.replace("/login");
            throw new Error("Unauthorized");
          }
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
        } catch (err) {
          console.error(err);
          if (mountedRef.current) {
            commit(m.undo(stateRef.current));
            toast(m.errorMessage);
          }
          needsResyncRef.current = true;
        } finally {
          pendingRef.current -= 1;
          if (pendingRef.current === 0 && needsResyncRef.current && mountedRef.current) {
            needsResyncRef.current = false;
            await resync();
          }
        }
      });
    },
    [commit, resync, router, toast],
  );

  return { state, loaded, mutate, getState };
}
