import { useEffect, useRef, useState } from 'react';
import { usePortal } from '../store/PortalContext.jsx';
import { useMessages } from '../store/MessagesContext.jsx';
import { Avatar, Badge, Card, Chip, EmptyState, PageHeader, SearchInput } from '../components/ui/index.jsx';
import { I, Icon } from '../lib/icons.jsx';
import { cn } from '../lib/cn.js';
import { CHANNEL_TONE, FILTERS, QUICK_REPLIES } from '../data/messages.js';
import {
  AttachmentList,
  CameraDialog,
  PendingTray,
  useVoiceRecorder,
} from '../components/Attachments.jsx';
import {
  attachmentSummary,
  canModifyMessage,
  DELETED_MESSAGE_TEXT,
  EDITED_MESSAGE_LABEL,
  formatDuration,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from '../lib/attachments.js';
import { putAttachment, removeAttachment } from '../services/attachmentStore.js';
import { MessageMenu, MessageMenuButton } from '../components/MessageMenu.jsx';
import { NewConversationDialog } from '../components/NewConversationDialog.jsx';

const SEND = ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4z'];
const BACK = ['M19 12H5', 'M12 19l-7-7 7-7'];
const PLUS = ['M12 5v14', 'M5 12h14'];

const preview = (thread) => thread.messages?.[thread.messages.length - 1] || null;

/** A deleted or wordless message still needs a line in the thread list. */
const previewText = (message) => {
  if (!message) return '';
  if (message.deleted) return DELETED_MESSAGE_TEXT;
  return message.text || attachmentSummary(message.attachments) || '';
};

/** Icon-only control in the composer rail. */
function ComposerButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      title={label}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted transition-colors hover:bg-hover hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
    >
      <Icon paths={icon} size={15} />
    </button>
  );
}

/** One row in the thread list. */
function ThreadRow({ thread, active, onClick }) {
  const last = preview(thread);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 border-0 border-b border-border px-3.5 py-3 text-left transition-colors last:border-b-0',
        active ? 'bg-active' : 'bg-transparent hover:bg-hover',
        'focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-(--ring) focus-visible:outline-none'
      )}
    >
      <Avatar name={thread.who} tier={thread.tier} className="h-9.5 w-9.5" />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[13.5px]',
              thread.unread ? 'font-semibold text-text' : 'font-medium text-text'
            )}
          >
            {thread.who}
          </span>
          <span className="shrink-0 text-[11px] text-faint">{thread.time}</span>
        </span>

        <span className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[12.5px]',
              thread.unread ? 'font-medium text-text' : 'text-muted'
            )}
          >
            {last?.from === 'me' && <span className="text-faint">You: </span>}
            {previewText(last) || 'No messages yet'}
          </span>
          {thread.unread > 0 && (
            <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-accent-text tabular-nums">
              {thread.unread}
            </span>
          )}
        </span>

        <span className="mt-1.25">
          <Badge tone={CHANNEL_TONE[thread.channel]}>{thread.channel}</Badge>
        </span>
      </span>
    </button>
  );
}

/** The small line beneath one of your own bubbles: who sent it + where it stands. */
function outgoingStatus(message, source) {
  const who = message.by ? `${message.by} · ` : '';
  if (source !== 'backend') return `${who}Local outbox`;
  if (message.deliveryStatus === 'pending') return `${who}Sending…`;
  if (message.deliveryStatus === 'failed') return `${who}Failed to send`;
  return `${who}Sent`;
}

/** A single chat bubble. Outgoing messages are accent-filled and right-aligned. */
function Bubble({ message, onMenu, source }) {
  const mine = message.from === 'me';
  const canModify = canModifyMessage(message);

  // Right-click anywhere on the bubble, the way Telegram does it.
  const onContextMenu = (event) => {
    if (!canModify) return;
    event.preventDefault();
    onMenu(message, { x: event.clientX, y: event.clientY });
  };

  /* A deleted message keeps its place in the thread — the conversation still has
     to read in order — but says plainly what it is. */
  if (message.deleted) {
    return (
      <div className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        <div className="max-w-[78%] rounded-2xl border border-dashed border-border px-3.5 py-2.5 text-[13px] text-faint italic">
          {DELETED_MESSAGE_TEXT}
        </div>
        <span className="px-1 text-[11px] text-faint tabular-nums">
          {message.at} · deleted
        </span>
      </div>
    );
  }

  return (
    <div className={cn('group flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div className={cn('flex max-w-[78%] items-center gap-1', mine && 'flex-row-reverse')}>
        <div
          onContextMenu={onContextMenu}
          className={cn(
            'min-w-0 rounded-2xl px-3.5 py-2 text-[14px] leading-normal',
            mine
              ? 'rounded-br-md bg-accent text-accent-text'
              : 'rounded-bl-md border border-border bg-panel-2 text-text'
          )}
        >
          {message.text}
          {/* No panel behind them: each attachment kind handles its own contrast on
              the accent fill, so a voice note is not boxed inside a second surface. */}
          {message.attachments?.length ? (
            <div className={cn(message.text && 'mt-1.5')}>
              <AttachmentList attachments={message.attachments} onAccent={mine} />
            </div>
          ) : null}

          {/* Telegram keeps the stamp inside the bubble, trailing the text. */}
          <span
            className={cn(
              'ml-2 inline-flex translate-y-0.5 items-center gap-1 text-[10.5px] tabular-nums',
              mine ? 'text-accent-text/70' : 'text-faint'
            )}
          >
            {message.editedAt && <span className="italic">{EDITED_MESSAGE_LABEL}</span>}
            {message.at}
          </span>
        </div>

        {canModify && (
          <MessageMenuButton onOpen={(point) => onMenu(message, point)} />
        )}
      </div>

      {mine && (
        <span className="px-1 text-[11px] text-faint">{outgoingStatus(message, source)}</span>
      )}
    </div>
  );
}

export default function Messages() {
  const p = usePortal();
  const conv = useMessages();
  const {
    threads = [],
    readThread,
    sendMessage,
    editMessage,
    deleteMessage,
    startConversation,
    source,
  } = conv;
  const [composeOpen, setComposeOpen] = useState(false);
  // A created thread arrives over realtime a beat after the RPC returns, so route it
  // through the same deep-link path the "message this customer" buttons use: it opens
  // the thread as soon as it lands in the list.
  const onComposeClose = (id) => {
    setComposeOpen(false);
    if (id) p.set({ messageThreadId: id });
  };
  const [openId, setOpenId] = useState(() => p.messageThreadId ?? threads[0]?.id ?? null);
  // Copy differs by mode: live backend sync vs. the old device-local outbox.
  const subtitle =
    source === 'backend'
      ? 'Live inbox, synced across your devices in real time'
      : 'Browser-local inbox and outbox; external delivery is not connected';
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState([]);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState(null); // { message, x, y }
  const [attachAt, setAttachAt] = useState(null); // { x, y } for the attach menu
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInput = useRef(null);
  const imageInput = useRef(null);
  // On phones the two panes swap; on md+ they sit side by side and this is ignored.
  const [pane, setPane] = useState('list');
  const feedRef = useRef(null);

  const open = threads.find((t) => t.id === openId) || threads[0] || null;

  useEffect(() => {
    if (p.messageThreadId && threads.some((thread) => thread.id === p.messageThreadId)) {
      setOpenId(p.messageThreadId);
      setPane('thread');
      readThread(p.messageThreadId);
      p.set({ messageThreadId: null });
    }
  }, [p.messageThreadId, p, readThread, threads]);

  const visible = threads.filter((t) => {
    const matchesFilter =
      filter === 'All' || (filter === 'Unread' ? t.unread > 0 : t.kind === filter);
    const q = query.trim().toLowerCase();
    // Search the whole conversation, not just the preview — the term a user
    // remembers is often buried further up the thread.
    const matchesQuery =
      !q ||
      t.who.toLowerCase().includes(q) ||
      (t.messages || []).some((m) => m.text.toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  const unreadTotal = threads.reduce((sum, thread) => sum + Number(thread.unread || 0), 0);

  // Keep the newest message in view when the thread changes or a reply is sent.
  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [openId, open?.messages?.length]);

  useEffect(() => {
    if (!open) {
      if (openId !== null) setOpenId(null);
      return;
    }
    if (open.id !== openId) setOpenId(open.id);
  }, [open, openId]);

  const openThread = (id) => {
    setOpenId(id);
    setPane('thread');
    readThread(id);
  };

  /** Stages an attachment: the bytes are written now, the message is sent later. */
  const attach = async (blob, meta = {}) => {
    if (pending.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
      p.notify(`A message carries at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments.`);
      return;
    }
    try {
      const attachment = await putAttachment(blob, meta);
      setPending((current) => [...current, attachment]);
    } catch (error) {
      p.notify(error?.message || 'That file could not be attached.');
    }
  };

  /** Dropping a staged attachment deletes its bytes — it was never sent. */
  const unstage = (attachment) => {
    setPending((current) => current.filter((row) => row.id !== attachment.id));
    removeAttachment(attachment);
  };

  const onPickFiles = (event) => {
    [...event.target.files].forEach((file) => attach(file, { name: file.name }));
    event.target.value = ''; // Re-picking the same file must fire change again.
  };

  const recorder = useVoiceRecorder({
    onRecorded: (blob, durationMs) =>
      attach(blob, { name: `Voice note ${formatDuration(durationMs)}.webm`, durationMs }),
    onError: (message) => p.notify(message),
  });

  const startEdit = (message) => {
    setEditing(message);
    setDraft(message.text || '');
  };

  const copyMessage = async (message) => {
    const text = message.text || attachmentSummary(message.attachments);
    try {
      await navigator.clipboard.writeText(text);
      p.notify('Message copied.');
    } catch {
      // Clipboard access is denied outside a secure context; saying so beats silence.
      p.notify('This browser blocked clipboard access.');
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft('');
  };

  const removeMessage = (message) => {
    if (!canModifyMessage(message)) return;

    p.confirm({
      title: 'Delete this message?',
      message: 'It stays in the thread marked as deleted. Any attachments on it are removed.',
      confirmLabel: 'Delete',
      icon: I.trash,
      onConfirm: () => {
        // The domain hands back the attachments it dropped; their bytes live outside
        // it, so nothing else would ever clean them up.
        const orphaned = deleteMessage(open.id, message.id) || [];
        orphaned.forEach(removeAttachment);
        if (editing?.id === message.id) cancelEdit();
        p.notify('Message deleted from this browser.', 'ok');
      },
    });
  };

  const send = (text) => {
    const body = text.trim();
    if (!open) return;

    if (editing) {
      try {
        editMessage(open.id, editing.id, { text: body });
        cancelEdit();
        p.notify('Message updated.');
      } catch (error) {
        p.notify(error?.message || 'That message could not be edited.');
      }
      return;
    }

    // A photo or a voice note is a message on its own.
    if (!body && !pending.length) return;

    sendMessage(open.id, { text: body, attachments: pending });
    setDraft('');
    setPending([]);
    p.notify(
      source === 'backend'
        ? 'Message sent.'
        : `Saved a reply for ${open.who} to this browser's local outbox. ${open.channel} delivery is not connected.`,
      source === 'backend' ? 'ok' : undefined
    );
  };

  if (!threads.length) {
    const isLoading = conv.loading;
    return (
      <div className="animate-kfade">
        <PageHeader
          title="Messages"
          subtitle={subtitle}
          freshness={isLoading ? 'Loading…' : source === 'backend' ? 'No conversations yet' : 'No local threads'}
        />
        <EmptyState
          title={isLoading ? 'Loading conversations…' : 'No conversations yet'}
          message={
            isLoading
              ? 'Fetching your inbox from the backend.'
              : source === 'backend'
                ? 'Start one below — it syncs live to your other devices.'
                : 'Threads will appear here after they are added to the local domain store.'
          }
        >
          {!isLoading && (
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-text hover:opacity-90 focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
            >
              <Icon paths={PLUS} size={15} strokeWidth={2.2} />
              New conversation
            </button>
          )}
        </EmptyState>
        {composeOpen && <NewConversationDialog onClose={onComposeClose} onCreate={startConversation} />}
      </div>
    );
  }

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Messages"
        subtitle={subtitle}
        freshness={
          unreadTotal ? `${unreadTotal} unread across ${threads.length} threads` : 'All caught up'
        }
      />

      <Card className="flex h-[calc(100vh-13rem)] min-h-125 overflow-hidden p-0">
        {/* ------------------------------------------------------ thread list */}
        <div
          className={cn(
            'w-full shrink-0 flex-col border-r border-border md:flex md:w-75 lg:w-85',
            pane === 'thread' ? 'hidden' : 'flex'
          )}
        >
          <div className="shrink-0 border-b border-border p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages…"
                  aria-label="Search messages"
                />
              </div>
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                aria-label="New conversation"
                title="New conversation"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-accent text-accent-text transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
              >
                <Icon paths={PLUS} size={16} strokeWidth={2.2} />
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f}
                  {f === 'Unread' && unreadTotal > 0 && (
                    <span className="ml-1 tabular-nums">({unreadTotal})</span>
                  )}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted">
                No conversations match “{query || filter}”.
              </p>
            ) : (
              visible.map((t) => (
                <ThreadRow
                  key={t.id}
                  thread={t}
                  active={t.id === openId}
                  onClick={() => openThread(t.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ----------------------------------------------------- conversation */}
        <div
          className={cn(
            'min-w-0 flex-1 flex-col md:flex',
            pane === 'list' ? 'hidden' : 'flex'
          )}
        >
          {/* header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border bg-panel-2 px-3.5 py-3 sm:px-4.5">
            <button
              type="button"
              onClick={() => setPane('list')}
              aria-label="Back to conversations"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-hover hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none md:hidden"
            >
              <Icon paths={BACK} size={16} strokeWidth={2.2} />
            </button>

            <Avatar name={open.who} tier={open.tier} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold text-text">{open.who}</span>
                <Badge tone={CHANNEL_TONE[open.channel]}>{open.channel}</Badge>
              </div>
              <div className="truncate text-[11.5px] text-faint">
                {open.presence} · {open.context}
              </div>
            </div>

            {open.kind === 'Customers' && (
              <button
                type="button"
                onClick={() => p.set({ page: 'customers', nav: 'customers', custSearch: open.who })}
                className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-[9px] border border-border bg-panel px-2.75 py-1.75 text-[12px] font-medium text-muted hover:bg-hover hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none sm:flex"
              >
                <Icon paths={I.users} size={13} strokeWidth={2} />
                View customer
              </button>
            )}
          </div>

          {/* message feed */}
          <div
            ref={feedRef}
            className="flex flex-1 flex-col overflow-y-auto bg-bg px-3.5 py-4 sm:px-5"
          >
            {/* mt-auto rests a short thread on the composer, the way a chat app
                does, while still scrolling normally once it overflows. */}
            <div className="mt-auto space-y-3">
              {(open.messages || []).map((m, i) => {
                const newDay = i === 0 || open.messages[i - 1].day !== m.day;
                return (
                  <div key={m.id} className="space-y-3">
                    {newDay && (
                      <div className="flex items-center gap-3 py-1">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[11px] font-semibold tracking-wide text-faint uppercase">
                          {m.day}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <Bubble
                      message={m}
                      source={source}
                      onMenu={(message, point) => setMenu({ message, ...point })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* composer */}
          <div className="shrink-0 border-t border-border bg-panel px-3.5 py-3 sm:px-4.5">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDraft(q)}
                  className="cursor-pointer rounded-full border border-border bg-panel px-2.75 py-1 text-[11.5px] font-medium text-muted transition-colors hover:border-accent hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Telegram's edit bar: accent stripe, pencil, "Edit message", the text
                being edited beneath it, and an × to back out. */}
            {editing && (
              <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-inset py-1.5 pr-2 pl-0">
                <span className="h-9 w-0.75 shrink-0 rounded-full bg-accent" />
                <span className="text-accent">
                  <Icon paths={I.pencil} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-accent">Edit message</span>
                  <span className="block truncate text-[12px] text-muted">
                    {editing.text || attachmentSummary(editing.attachments)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={cancelEdit}
                  title="Cancel editing"
                  aria-label="Cancel editing"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-hover hover:text-text"
                >
                  <Icon paths={I.x} size={15} strokeWidth={2.2} />
                </button>
              </div>
            )}

            {/* Attachments belong to the message that was sent — an edit changes words. */}
            {!editing && <PendingTray pending={pending} onRemove={unstage} />}

            {recorder.recording ? (
              <div className="flex items-center gap-3 rounded-xl border border-danger-fg/40 bg-danger-bg px-3 py-2.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger-fg" />
                <span className="flex-1 text-[12.5px] font-semibold text-danger-fg tabular-nums">
                  Recording · {formatDuration(recorder.elapsed)}
                </span>
                <button
                  type="button"
                  onClick={recorder.cancel}
                  className="cursor-pointer rounded-lg border border-border bg-panel px-2.5 py-1.5 text-[12px] font-semibold text-text"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={recorder.stop}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-accent px-2.5 py-1.5 text-[12px] font-semibold text-accent-text"
                >
                  <Icon paths={I.stop} size={12} strokeWidth={2.2} />
                  Stop
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
                className="flex items-center gap-1 rounded-xl border border-border bg-inset px-2 py-1 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-3 focus-within:ring-(--ring)"
              >
                {/* Hidden inputs: `accept` splits "image" from "any file", and capture
                    is a separate button because a laptop has no camera roll. */}
                <input
                  ref={imageInput}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickFiles}
                  className="hidden"
                />
                <input ref={fileInput} type="file" multiple onChange={onPickFiles} className="hidden" />

                {/* One button, not four: the menu holds the choices. An edit changes
                    words, so attaching is hidden while editing. */}
                {!editing && (
                  <ComposerButton
                    icon={I.paperclip}
                    label="Attach"
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setAttachAt({ x: rect.left, y: rect.top - 8 });
                    }}
                  />
                )}

                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && editing) cancelEdit();
                  }}
                  aria-label={editing ? 'Edit message' : `Local reply for ${open.who}`}
                  placeholder={
                    editing ? 'Edit the message…' : `Save a local reply for ${open.who}…`
                  }
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[13px] text-text outline-none placeholder:text-faint"
                />
                {/* The mic sits against Send, and stays a bare icon — a second filled
                    button beside the accent one would read as a second primary action. */}
                {!editing && (
                  <button
                    type="button"
                    onClick={recorder.start}
                    title="Record a voice note"
                    aria-label="Record a voice note"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted transition-colors hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
                  >
                    <Icon paths={I.mic} size={17} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!draft.trim() && !pending.length && !editing}
                  aria-label={editing ? 'Save edit' : 'Save reply to local outbox'}
                  className="my-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-accent text-accent-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
                >
                  <Icon paths={editing ? I.check : SEND} size={15} strokeWidth={2} />
                </button>
              </form>
            )}

            {attachAt && (
              <MessageMenu
                x={attachAt.x}
                y={attachAt.y}
                onClose={() => setAttachAt(null)}
                // Voice is not in here: it sits beside Send, one move from the cursor.
                items={[
                  { icon: I.image, label: 'Photo', onClick: () => imageInput.current?.click() },
                  { icon: I.paperclip, label: 'File', onClick: () => fileInput.current?.click() },
                  { icon: I.camera, label: 'Camera', onClick: () => setCameraOpen(true) },
                ]}
              />
            )}

            {menu && (
              <MessageMenu
                x={menu.x}
                y={menu.y}
                onClose={() => setMenu(null)}
                items={[
                  { icon: I.copy, label: 'Copy', onClick: () => copyMessage(menu.message) },
                  { icon: I.pencil, label: 'Edit', onClick: () => startEdit(menu.message) },
                  {
                    icon: I.trash,
                    label: 'Delete',
                    danger: true,
                    onClick: () => removeMessage(menu.message),
                  },
                ]}
              />
            )}

            {cameraOpen && (
              <CameraDialog
                onClose={() => setCameraOpen(false)}
                onCapture={(blob, meta) => {
                  setCameraOpen(false);
                  attach(blob, { name: `Photo ${new Date().toLocaleTimeString('en-GB')}.jpg`, ...meta });
                }}
              />
            )}
          </div>
        </div>
      </Card>

      {composeOpen && <NewConversationDialog onClose={onComposeClose} onCreate={startConversation} />}
    </div>
  );
}
