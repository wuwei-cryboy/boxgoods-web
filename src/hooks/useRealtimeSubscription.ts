// src/hooks/useRealtimeSubscription.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type Callback<T> = (payload: { new: T; old: T | null; eventType: "INSERT" | "UPDATE" | "DELETE" }) => void;

// 指数退避配置
const RECONNECT_BASE_DELAY = 1000; // 1s
const RECONNECT_MAX_DELAY = 30000; // 30s
const RECONNECT_MAX_ATTEMPTS = 10;

// 通用的带重连的订阅逻辑
function useRealtimeSubscriptionWithReconnect<T>(
  table: string,
  filter: string | null,
  callback: Callback<T>,
  enabled: boolean,
  channelName: string,
  postgresChangesFilter: { event: string; schema: string; table: string; filter?: string }
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  callbackRef.current = callback;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const subscribe = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    const supabase = createSupabaseBrowserClient();
    supabaseRef.current = supabase;

    // 通过 any 绕过 supabase-js v2 的 channel().on() 重载签名与 postgres_changes
    // 过滤器联合类型的冲突；payload 的字段（new/old/eventType）运行时稳定。
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        postgresChangesFilter as any,
        (payload: any) => {
          callbackRef.current({
            new: payload.new as T,
            old: (payload.old as T | null) ?? null,
            eventType: (payload.eventType ?? "INSERT") as "INSERT" | "UPDATE" | "DELETE",
          });
        }
      )
      .subscribe((status: any, _err: any) => {
        if (!isMountedRef.current) return;

        if (status === "SUBSCRIBED") {
          // 订阅成功，重置重连计数
          reconnectAttemptRef.current = 0;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // 连接异常，触发重连
          if (reconnectAttemptRef.current < RECONNECT_MAX_ATTEMPTS) {
            const delay = Math.min(
              RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current),
              RECONNECT_MAX_DELAY
            );
            reconnectAttemptRef.current++;

            console.warn(
              `[Realtime] ${channelName} ${status}, reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`
            );

            clearReconnectTimeout();
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && enabled) {
                supabase.removeChannel(channel);
                subscribe();
              }
            }, delay);
          } else {
            console.error(`[Realtime] ${channelName} max reconnect attempts reached, giving up`);
          }
        }
      });

    channelRef.current = channel;
  }, [enabled, channelName, postgresChangesFilter, clearReconnectTimeout]);

  useEffect(() => {
    isMountedRef.current = true;
    reconnectAttemptRef.current = 0;

    if (!enabled) return;

    subscribe();

    return () => {
      isMountedRef.current = false;
      clearReconnectTimeout();
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, [enabled, subscribe, clearReconnectTimeout]);
}

// 基础版本：要求有 id 字段
export function useRealtimeSubscription<T extends { id: string }>(
  table: string,
  filter: string | null,
  callback: Callback<T>,
  enabled = true
) {
  useRealtimeSubscriptionWithReconnect<T>(
    table,
    filter,
    callback,
    enabled,
    `${table}_changes`,
    {
      event: "*",
      schema: "public",
      table,
      filter: filter ?? undefined,
    }
  );
}

// 灵活版本：不强制要求 id 字段，通过 keyField 指定唯一标识字段
export function useRealtimeSubscriptionFlexible<T extends Record<string, unknown>>(
  table: string,
  filter: string | null,
  callback: Callback<T>,
  options: { keyField?: string; enabled?: boolean } = {}
) {
  const { keyField = "id", enabled = true } = options;

  useRealtimeSubscriptionWithReconnect<T>(
    table,
    filter,
    callback,
    enabled,
    `${table}_changes_${keyField}`,
    {
      event: "*",
      schema: "public",
      table,
      filter: filter ?? undefined,
    }
  );
}

// 用户级实时订阅（自动按 user_id 过滤）
export function useUserRealtimeSubscription<T extends Record<string, unknown>>(
  table: string,
  callback: Callback<T>,
  options: { keyField?: string; enabled?: boolean } = {}
) {
  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);

  // auth.getUser() 是异步的，不能在渲染期同步解构；
  // 先用 getSession 取初始态，再订阅 onAuthStateChange 跟进登录/登出。
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const filter = userId ? `user_id=eq.${userId}` : null;

  return useRealtimeSubscriptionFlexible<T>(table, filter, callback, {
    ...options,
    enabled: options.enabled !== false && !!userId,
  });
}