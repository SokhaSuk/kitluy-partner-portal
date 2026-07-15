import { useState } from 'react';
import { PageHeader } from '../components/ui/index.jsx';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';

const STAR =
  'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z';

const reviews = [
  {
    id: 'review-visal-pen',
    who: 'Visal Pen',
    stars: 5,
    text: 'Always ready on time and my shirts are perfectly pressed.',
    time: 'Today',
  },
  {
    id: 'review-chenda-ouk',
    who: 'Chenda Ouk',
    stars: 4,
    text: 'Good service, would love faster express turnaround.',
    time: 'Yesterday',
  },
  {
    id: 'review-borey-heng',
    who: 'Borey Heng',
    stars: 2,
    text: 'A jacket came back with a small stain — being re-cleaned.',
    time: '2 days ago',
  },
].map((review) => ({
  ...review,
  starsArr: [1, 2, 3, 4, 5].map((number) => number <= review.stars),
}));

const replyKey = (reviewId) => `complaint.reply.${reviewId}`;

export default function Complaints() {
  const p = usePortal();
  const { genericState = { actions: [] }, recordGenericAction } = useDomain();
  const [replyingId, setReplyingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const savedReplies = (genericState.actions || []).reduce((result, action) => {
    if (action.key.startsWith('complaint.reply.')) result[action.key] = action;
    return result;
  }, {});

  const openComposer = (review) => {
    const saved = savedReplies[replyKey(review.id)];
    setReplyingId(review.id);
    setDraft(saved?.label || '');
    setError('');
  };

  const saveReply = (review) => {
    const body = draft.trim();
    if (!body) {
      setError('Enter a reply before saving it.');
      return;
    }
    recordGenericAction(replyKey(review.id), body);
    setReplyingId(null);
    setDraft('');
    setError('');
    p.notify(`Reply for ${review.who} saved to the local audit history. Nothing was sent externally.`);
  };

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Complaints & Reviews"
        subtitle="Review samples and browser-local response notes; Telegram delivery is not connected"
        freshness="Rating and review counts are seed analytics"
      >
        <div className="flex items-center gap-2 rounded-[11px] border border-border bg-panel px-3.5 py-2 shadow-card">
          <span className="text-[20px] font-bold text-text">4.6</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-gold"
            aria-hidden="true"
          >
            <path d={STAR} />
          </svg>
          <span className="text-[12px] text-muted">312 seed reviews</span>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-3">
        {reviews.map((review) => {
          const saved = savedReplies[replyKey(review.id)];
          const composing = replyingId === review.id;
          const panelId = `reply-${review.id}`;
          return (
            <article
              key={review.id}
              className="rounded-[14px] border border-border bg-panel p-4 shadow-card"
            >
              <div className="mb-1.75 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[13.5px] font-semibold text-text">{review.who}</span>
                  <span className="flex gap-px" aria-label={`${review.stars} out of 5 stars`}>
                    {review.starsArr.map((filled, index) => (
                      <svg
                        key={index}
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={filled ? 'text-gold' : 'text-border-strong'}
                        aria-hidden="true"
                      >
                        <path d={STAR} />
                      </svg>
                    ))}
                  </span>
                </div>
                <span className="text-[11.5px] text-faint">{review.time}</span>
              </div>
              <p className="mb-2.5 text-[13px] leading-normal text-muted">{review.text}</p>

              {saved && !composing && (
                <div className="mb-3 rounded-[10px] border border-border bg-inset px-3 py-2.5">
                  <div className="text-[11px] font-semibold tracking-wide text-faint uppercase">
                    Local response note · not sent
                  </div>
                  <p className="mt-1 text-[12.5px] text-text">{saved.label}</p>
                  <div className="mt-1 text-[11px] text-faint">
                    Saved {new Date(saved.at).toLocaleString()}
                  </div>
                </div>
              )}

              {composing ? (
                <form
                  id={panelId}
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveReply(review);
                  }}
                  className="rounded-[10px] border border-border bg-inset p-3"
                >
                  <label htmlFor={`${panelId}-text`} className="text-[12.5px] font-semibold text-text">
                    Local response note for {review.who}
                  </label>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    This is saved to browser-local audit history. It is not delivered to Telegram.
                  </p>
                  <textarea
                    id={`${panelId}-text`}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setError('');
                    }}
                    rows={3}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `${panelId}-error` : undefined}
                    className="mt-2 w-full resize-y rounded-[9px] border border-border bg-panel px-3 py-2 text-[13px] text-text outline-none focus:border-accent focus:ring-3 focus:ring-(--ring)"
                  />
                  {error && (
                    <p id={`${panelId}-error`} className="mt-1 text-[11.5px] text-danger-fg">
                      {error}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      className="cursor-pointer rounded-lg border-0 bg-primary px-3.25 py-1.75 text-[12.5px] font-semibold text-primary-text"
                    >
                      Save locally
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingId(null);
                        setDraft('');
                        setError('');
                      }}
                      className="cursor-pointer rounded-lg border border-border bg-panel px-3.25 py-1.75 text-[12.5px] font-semibold text-text hover:bg-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  aria-expanded={false}
                  aria-controls={panelId}
                  onClick={() => openComposer(review)}
                  className="cursor-pointer rounded-lg border border-border bg-panel px-3.25 py-1.5 text-[12.5px] font-semibold text-text hover:bg-hover"
                >
                  {saved ? 'Edit local response' : 'Write local response'}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
