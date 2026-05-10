import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';
import { getAuthUserId, PET_PLATFORM_AUTH_EVENT, useIsLoggedIn } from '@/lib/authSession';
import { getUserPublicProfile } from '@/features/users/usersApi';
import { getChatSocket, type ChatConversationListItem, type ChatMessage } from '@/features/chat/chatSocket';
import { markAllNotificationsReadWhere } from '@/features/notifications/notificationsApi';

function sortByLastMessageDesc(items: ChatConversationListItem[]): ChatConversationListItem[] {
  return [...items].sort((a, b) => {
    const ad = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bd = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bd - ad;
  });
}

function formatTime(d: string): string {
  try {
    const dt = new Date(d);
    const h = String(dt.getHours()).padStart(2, '0');
    const m = String(dt.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

function Avatar({ url, label }: { url: string | null; label: string }) {
  if (url) {
    return <img src={url} alt="" className="size-10 rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  return (
    <div className="grid size-10 place-items-center rounded-full border border-border-card bg-surface-hover text-xs font-semibold text-text-muted">
      {label.slice(0, 1).toUpperCase()}
    </div>
  );
}

function makeConversationId(me: string, other: string): string {
  const [a, b] = [me.trim(), other.trim()].sort();
  return `${a}__${b}`;
}

function roleLabel(role: string | null | undefined, t: (k: string) => string): string {
  if (role === 'admin') return t('chat.roles.admin');
  if (role === 'ngo') return t('chat.roles.ngo');
  return t('chat.roles.user');
}

export default function ChatPage() {
  const { t } = useTranslation();
  const loggedIn = useIsLoggedIn();
  const me = getAuthUserId();
  const [sp] = useSearchParams();
  const to = sp.get('to')?.trim() || null;

  const socket = useMemo(() => getChatSocket(), []);
  const socketRef = useRef(socket);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationListItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const lastRequestedConvRef = useRef<string | null>(null);
  const messagesWrapRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const forcedConversationId = me && to ? makeConversationId(me, to) : null;
  const [forcedProfile, setForcedProfile] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  } | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    // Best-effort: clear chat badge ASAP on page load (no socket required).
    markAllNotificationsReadWhere({ type: 'chat_message' }).catch(() => {});
    const s = socketRef.current;
    s.auth = { token: localStorage.getItem('accessToken') ?? '' };
    // If socket was already connected (e.g. navbar), sync local state.
    setConnected(s.connected);
    if (!s.connected) s.connect();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: { message?: string }) => setSocketError(err?.message || 'Socket холбогдож чадсангүй.');
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    s.on('chat:message:new', ({ message }) => {
      setMessagesByConversation((prev) => {
        const existing = prev[message.conversationId] ?? [];
        const next = existing.some((m) => m.id === message.id) ? existing : [...existing, message];
        return { ...prev, [message.conversationId]: next };
      });
      // Update chat list lastMessage AND move active conversation to top (real-time ordering).
      setConversations((prev) => {
        if (!prev) return prev;
        const idx = prev.findIndex((c) => c.id === message.conversationId);
        if (idx === -1) return prev;
        const updated = {
          ...prev[idx]!,
          lastMessage: { text: message.text, createdAt: message.createdAt },
        };
        return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });

      // If conversation doesn't exist yet (first message), fetch profile and prepend.
      const otherUserId = message.senderId === me ? message.recipientId : message.senderId;
      getUserPublicProfile(otherUserId)
        .then((profile) => {
          setConversations((prev) => {
            if (!prev) return prev;
            const exists = prev.some((c) => c.id === message.conversationId);
            if (exists) return prev;
            return [
              {
                id: message.conversationId,
                otherUser: profile,
                lastMessage: { text: message.text, createdAt: message.createdAt },
              },
              ...prev,
            ];
          });
        })
        .catch(() => {});
    });

    s.on('chat:seen', ({ conversationId, readerId, readAt }) => {
      // Update readAt for my messages in that conversation.
      setMessagesByConversation((prev) => {
        const list = prev[conversationId];
        if (!list) return prev;
        const next = list.map((m) => {
          if (m.senderId !== me) return m;
          if (m.recipientId !== readerId) return m;
          if (m.readAt) return m;
          return { ...m, readAt };
        });
        return { ...prev, [conversationId]: next };
      });
    });

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.off('chat:message:new');
      s.off('chat:seen');
    };
  }, [loggedIn, me, socket]);

  useEffect(() => {
    const onAuth = () => {
      const s = socketRef.current;
      const token = localStorage.getItem('accessToken') ?? '';
      s.auth = { token };
      if (!token) {
        s.disconnect();
        return;
      }
      if (s.connected) {
        s.disconnect();
      }
      s.connect();
    };
    window.addEventListener(PET_PLATFORM_AUTH_EVENT, onAuth);
    return () => window.removeEventListener(PET_PLATFORM_AUTH_EVENT, onAuth);
  }, []);

  useEffect(() => {
    if (!loggedIn || !connected) return;
    socketRef.current.emit('chat:conversations:list', { limit: 30 }, (res) => {
      if (!res.ok) {
        setConversations([]);
        return;
      }
      setConversations(sortByLastMessageDesc(res.items));
    });
  }, [connected, loggedIn, socket]);

  useEffect(() => {
    if (!loggedIn || !to) return;
    getUserPublicProfile(to)
      .then((p) => setForcedProfile(p))
      .catch(() => setForcedProfile(null));
  }, [loggedIn, to]);

  const displayConversations = useMemo(() => {
    const list = conversations ?? [];
    if (!forcedConversationId || !to) return list;
    const exists = list.some((c) => c.id === forcedConversationId);
    if (exists) return list;
    if (!forcedProfile) return list;
    return [
      {
        id: forcedConversationId,
        otherUser: forcedProfile,
        lastMessage: null,
      },
      ...list,
    ];
  }, [conversations, forcedConversationId, forcedProfile, to]);

  const activeId = selectedId ?? forcedConversationId ?? displayConversations?.[0]?.id ?? null;
  const selected = useMemo(
    () => (activeId ? displayConversations?.find((c) => c.id === activeId) ?? null : null),
    [activeId, displayConversations],
  );
  const activeConversationId = selected?.id ?? null;

  useEffect(() => {
    if (!loggedIn || !selected?.otherUser?.id) return;
    // Mark "seen" for this conversation so the chat badge can disappear.
    markAllNotificationsReadWhere({
      type: 'chat_message',
      actionUrl: `/chat?to=${encodeURIComponent(selected.otherUser.id)}`,
    }).catch(() => {});
  }, [loggedIn, selected?.otherUser?.id]);

  useEffect(() => {
    if (!loggedIn || !connected || !selected?.id) return;
    const convId = selected.id;
    if (lastRequestedConvRef.current === convId) return;
    lastRequestedConvRef.current = convId;
    setLoadingMessages(true);
    socketRef.current.emit('chat:messages:list', { conversationId: convId, limit: 100 }, (res) => {
      setLoadingMessages(false);
      if (!res.ok) {
        setMessagesByConversation((prev) => ({ ...prev, [convId]: [] }));
        return;
      }
      setMessagesByConversation((prev) => ({ ...prev, [convId]: res.items }));
      socketRef.current.emit('chat:seen', { conversationId: convId }, () => {});
    });
  }, [connected, loggedIn, selected?.id, socket]);

  const messages = useMemo(() => {
    if (!activeConversationId) return [] as ChatMessage[];
    return messagesByConversation[activeConversationId] ?? [];
  }, [messagesByConversation, activeConversationId]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollToBottom = () => {
    const el = messagesEndRef.current;
    if (!el) return;
    el.scrollIntoView({ block: 'end' });
  };

  const lastMine = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i]!;
      if (m.senderId === me) return m;
    }
    return null;
  }, [messages, me]);
  const lastMineId = lastMine?.id ?? null;

  useEffect(() => {
    // When switching conversations or first loading messages, jump to latest.
    if (!selected?.id) return;
    if (loadingMessages) return;
    if (!messages.length) return;
    requestAnimationFrame(() => scrollToBottom());
  }, [selected?.id, loadingMessages, messages.length]);

  useEffect(() => {
    // Keep pinned to bottom when new messages arrive, unless user scrolled up.
    if (!stickToBottom) return;
    if (!messages.length) return;
    requestAnimationFrame(() => scrollToBottom());
  }, [messages.length, stickToBottom]);

  if (!loggedIn || !me) {
    return (
      <section className="w-full max-w-md rounded-card border border-border-card bg-surface-card px-6 py-10">
        <p className="text-sm text-text-secondary">{t('chat.loginRequired')}</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1440px] overflow-hidden rounded-card border border-border-card bg-surface-card">
      <div className="flex h-[calc(100vh-4rem-4rem)] min-h-0 flex-col md:flex-row">
        <aside className="flex w-full min-h-0 shrink-0 flex-col border-b border-border-card bg-surface md:w-[380px] md:border-b-0 md:border-r">
          <div className="border-b border-border-card px-7 py-4">
            <div>
              <input
                type="search"
                placeholder={t('chat.searchPlaceholder')}
                className={cn(
                  'h-10 w-full rounded-lg border border-border-input bg-surface-muted px-3 text-sm text-text placeholder:text-text-muted',
                  focusRing,
                )}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {conversations === null ? (
              <div className="px-5 py-6 text-sm text-text-muted">{t('common.loading')}</div>
            ) : displayConversations?.length ? (
              displayConversations.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-border-card px-5 py-3.5 text-left transition-colors',
                      active ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-hover',
                    )}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <Avatar url={c.otherUser.avatarUrl} label={c.otherUser.displayName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-[13px] font-semibold leading-none text-text-heading">{c.otherUser.displayName}</p>
                        <p className="shrink-0 text-[11px] leading-none text-text-muted">
                          {c.lastMessage ? formatTime(c.lastMessage.createdAt) : ''}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-text-secondary">
                        {c.lastMessage?.text ?? t('chat.noMessages')}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-8 text-sm text-text-muted">{t('chat.empty')}</div>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col bg-surface">
          <div className="border-b border-border-card px-7 py-4">
            {selected ? (
              <div className="flex items-center gap-3">
                <Avatar url={selected.otherUser.avatarUrl} label={selected.otherUser.displayName} />
                <div>
                  <p className="text-sm font-semibold text-text-heading">{selected.otherUser.displayName}</p>
                  <p className="text-[11px] text-text-muted">{roleLabel(selected.otherUser.role, t)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">{t('chat.pickConversation')}</p>
            )}
          </div>

          <div
            ref={messagesWrapRef}
            className="flex-1 min-h-0 overflow-y-auto bg-surface-muted px-7 py-6"
            onScroll={() => {
              const el = messagesWrapRef.current;
              if (!el) return;
              const thresholdPx = 24;
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
              setStickToBottom(atBottom);
            }}
          >
            {socketError ? (
              <p className="mb-3 text-sm text-red-700" role="alert">
                {socketError}
              </p>
            ) : null}
            {loadingMessages ? (
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            ) : selected ? (
              <div className="flex flex-col gap-4">
                {messages.map((m) => {
                  const mine = m.senderId === me;
                  return (
                    <div key={m.id} className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('flex max-w-[420px] flex-col', mine ? 'items-end' : 'items-start')}>
                        <div
                          className={cn(
                            'rounded-xl px-4 py-3 text-sm leading-relaxed',
                            mine ? 'bg-text-heading text-surface' : 'bg-surface-card text-text',
                          )}
                        >
                          {m.text}
                        </div>
                        {mine && lastMineId === m.id ? (
                          <p className="mt-1 pr-2 text-[11px] text-text-muted">
                            {m.readAt ? t('chat.seen') : t('chat.sent')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <p className="text-sm text-text-muted">{t('chat.pickConversation')}</p>
            )}
          </div>

          <form
            className="flex items-center gap-3 border-t border-border-card bg-surface px-7 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim() || !selected || sending) return;
              setSending(true);
              setSendError(null);
              socketRef.current.emit('chat:message:send', { recipientId: selected.otherUser.id, text: draft }, (res) => {
                setSending(false);
                if (!res.ok) {
                  setSendError(res.message || 'Зурвас илгээж чадсангүй.');
                  return;
                }
                setDraft('');
              });
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('chat.messagePlaceholder')}
              className={cn(
                'h-[46px] w-full rounded-xl border border-border-input bg-surface-muted px-4 text-sm text-text placeholder:text-text-muted',
                focusRing,
              )}
            />
            <button
              type="submit"
              disabled={!connected || !selected || !draft.trim() || sending}
              className={cn(
                'h-[46px] shrink-0 rounded-xl bg-text-heading px-6 text-sm font-semibold text-surface transition-opacity disabled:opacity-60',
                focusRing,
              )}
            >
              {t('common.send')}
            </button>
          </form>
          {sendError ? (
            <div className="border-t border-border-card bg-surface px-7 py-3">
              <p className="text-sm text-red-700" role="alert">
                {sendError}
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </section>
  );
}

