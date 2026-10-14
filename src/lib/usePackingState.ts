import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';

import { supabase, type CheckedRow } from './supabase';
import {
  loadChecked,
  loadLastUser,
  loadPending,
  saveChecked,
  saveLastUser,
  savePending,
  type CheckedMap,
  type PendingMap,
} from './storage';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

const RETRY_MS = 30_000;

const isNetworkError = (message: string) => /fetch|network|timed? ?out/i.test(message);

/**
 * Owns the checklist state. Local-first: every change is applied and persisted on
 * the device immediately, then queued in `pending` and pushed to Supabase when a
 * user is signed in. Conflicts resolve per item, newest change wins (the server
 * enforces the same rule, see supabase/schema.sql).
 */
export function usePackingState(allItemIds: string[]) {
  const [checked, setChecked] = useState<CheckedMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>('local');

  // Refs mirror state so async sync code always sees the latest values.
  const checkedRef = useRef<CheckedMap>({});
  const pendingRef = useRef<PendingMap>({});
  const userRef = useRef<string | null>(null);
  const lastUserRef = useRef<string | null>(null);
  const flushingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const commitChecked = useCallback((next: CheckedMap) => {
    checkedRef.current = next;
    setChecked(next);
    saveChecked(next);
  }, []);

  const commitPending = useCallback((next: PendingMap) => {
    pendingRef.current = next;
    savePending(next);
  }, []);

  const failWith = useCallback((message: string) => {
    setStatus(isNetworkError(message) ? 'offline' : 'error');
    if (!isNetworkError(message)) console.warn('Sync failed:', message);
  }, []);

  /** Merge server rows into local state, unless a newer local change is waiting. */
  const applyRemote = useCallback(
    (rows: CheckedRow[]) => {
      let nextChecked = checkedRef.current;
      let nextPending = pendingRef.current;
      for (const row of rows) {
        const remoteT = Date.parse(row.updated_at);
        const local = nextPending[row.item_id];
        if (local && local.t > remoteT) continue;
        if (local) {
          if (nextPending === pendingRef.current) nextPending = { ...nextPending };
          delete nextPending[row.item_id];
        }
        if (!!nextChecked[row.item_id] !== row.checked) {
          if (nextChecked === checkedRef.current) nextChecked = { ...nextChecked };
          if (row.checked) nextChecked[row.item_id] = true;
          else delete nextChecked[row.item_id];
        }
      }
      if (nextChecked !== checkedRef.current) commitChecked(nextChecked);
      if (nextPending !== pendingRef.current) commitPending(nextPending);
    },
    [commitChecked, commitPending],
  );

  const flush = useCallback(async (): Promise<void> => {
    const userId = userRef.current;
    if (!userId || flushingRef.current) return;
    const batch = Object.entries(pendingRef.current);
    if (batch.length === 0) {
      setStatus('synced');
      return;
    }

    flushingRef.current = true;
    setStatus('syncing');
    const { error } = await supabase.from('checked_items').upsert(
      batch.map(([item_id, p]) => ({
        user_id: userId,
        item_id,
        checked: p.checked,
        updated_at: new Date(p.t).toISOString(),
      })),
      { onConflict: 'user_id,item_id' },
    );
    flushingRef.current = false;
    if (error) return failWith(error.message);

    // Only clear entries that weren't changed again while the request was in flight.
    const next = { ...pendingRef.current };
    for (const [id, p] of batch) if (next[id]?.t === p.t) delete next[id];
    commitPending(next);

    if (Object.keys(next).length > 0) return flush();
    setStatus('synced');
  }, [commitPending, failWith]);

  const pull = useCallback(async () => {
    if (!userRef.current) return;
    setStatus('syncing');
    const { data, error } = await supabase
      .from('checked_items')
      .select('item_id, checked, updated_at');
    if (error) return failWith(error.message);
    applyRemote(data);
    await flush();
  }, [applyRemote, failWith, flush]);

  const handleSignedIn = useCallback(
    (userId: string) => {
      userRef.current = userId;

      // First sign-in on this device: offer what's already checked locally to the
      // account. t=0 means "older than anything on the server", so existing cloud
      // state wins and local checks only fill the gaps.
      if (lastUserRef.current !== userId) {
        const seeded = { ...pendingRef.current };
        for (const id in checkedRef.current) if (!seeded[id]) seeded[id] = { checked: true, t: 0 };
        commitPending(seeded);
        lastUserRef.current = userId;
        saveLastUser(userId);
      }

      channelRef.current?.unsubscribe();
      channelRef.current = supabase
        .channel(`checked_items:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checked_items',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as Partial<CheckedRow>;
            if (row.item_id && row.updated_at && typeof row.checked === 'boolean') {
              applyRemote([row as CheckedRow]);
            }
          },
        )
        .subscribe();

      pull();
    },
    [applyRemote, commitPending, pull],
  );

  const handleSignedOut = useCallback(() => {
    userRef.current = null;
    lastUserRef.current = null;
    saveLastUser(null);
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setStatus('local');
  }, []);

  // 1. Restore local state.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadChecked(), loadPending(), loadLastUser()]).then(
      ([savedChecked, savedPending, lastUser]) => {
        if (cancelled) return;
        checkedRef.current = savedChecked;
        pendingRef.current = savedPending;
        lastUserRef.current = lastUser;
        setChecked(savedChecked);
        setHydrated(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Follow the auth session once local state is in place.
  useEffect(() => {
    if (!hydrated) return;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const userId = nextSession?.user.id ?? null;
      if (userId === userRef.current) return;
      // Supabase advises against awaiting its own calls inside this callback.
      setTimeout(() => (userId ? handleSignedIn(userId) : handleSignedOut()), 0);
    });
    return () => {
      data.subscription.unsubscribe();
      channelRef.current?.unsubscribe();
    };
  }, [hydrated, handleSignedIn, handleSignedOut]);

  // 3. Catch up when the app returns to the foreground, and retry while offline.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') pull();
    });
    const timer = setInterval(() => {
      if (userRef.current && Object.keys(pendingRef.current).length > 0) flush();
    }, RETRY_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [pull, flush]);

  const toggle = useCallback(
    (id: string) => {
      const value = !checkedRef.current[id];
      const next = { ...checkedRef.current };
      if (value) next[id] = true;
      else delete next[id];
      commitChecked(next);
      commitPending({
        ...pendingRef.current,
        [id]: { checked: value, t: Date.now() },
      });
      flush();
    },
    [commitChecked, commitPending, flush],
  );

  const resetAll = useCallback(() => {
    const t = Date.now();
    const next = { ...pendingRef.current };
    for (const id of allItemIds) next[id] = { checked: false, t };
    commitChecked({});
    commitPending(next);
    flush();
  }, [allItemIds, commitChecked, commitPending, flush]);

  return {
    checked,
    hydrated,
    toggle,
    resetAll,
    sync: { session, status, syncNow: pull },
  };
}

export async function sendLoginCode(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
}

export async function verifyLoginCode(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'email' });
}

export async function signOut() {
  return supabase.auth.signOut();
}
