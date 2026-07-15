import { useState } from 'react';
import { I, Icon } from '../lib/icons.jsx';
import { khr } from '../lib/format.js';
import { Badge, Button, Card, PageHeader, TextInput } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';

const initialCampaign = { name: '', channel: '', budget: '' };

export default function Advertising() {
  const p = usePortal();
  const { adCampaigns, addAdCampaign } = useDomain();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialCampaign);
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '', form: '' }));
  };

  const cancel = () => {
    setCreating(false);
    setForm(initialCampaign);
    setErrors({});
  };

  const createCampaign = (event) => {
    event.preventDefault();
    const next = {};
    const budget = Number(String(form.budget).replace(/[^\d]/g, ''));
    if (!form.name.trim()) next.name = 'Enter a campaign name.';
    if (!form.channel.trim()) next.channel = 'Enter at least one advertising channel.';
    if (!(budget > 0)) next.budget = 'Enter a budget greater than zero.';
    if ((adCampaigns || []).some((campaign) => campaign.name.toLowerCase() === form.name.trim().toLowerCase())) {
      next.name = 'A campaign with this name already exists.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      if (typeof addAdCampaign !== 'function') {
        throw new Error('Campaign creation is not available in the current domain store.');
      }
      const campaign = addAdCampaign({
        name: form.name.trim(),
        channel: form.channel.trim(),
        budget,
        status: 'Draft',
        tone: 'neutral',
      });
      p.notify(`${campaign.name} saved as a draft campaign`);
      cancel();
    } catch (error) {
      setErrors({ form: error?.message || 'The campaign could not be saved.' });
    }
  };

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Advertising"
        subtitle="Create locally persisted campaign briefs and track their current status"
      >
        <Button variant="primary" onClick={() => setCreating((open) => !open)}>
          {creating ? 'Close form' : 'New campaign'}
        </Button>
      </PageHeader>

      <div className="mb-3.5 flex items-center gap-3.5 rounded-[14px] border border-purple bg-purple-bg px-4.5 py-3.75">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-purple/20 text-purple-fg">
          <Icon paths={I.spark} size={19} />
        </span>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-text">Campaign planning</div>
          <div className="text-[12.5px] text-muted">
            Drafts are stored in this portal. External ad publishing is not connected.
          </div>
        </div>
      </div>

      {creating && (
        <Card className="mb-3.5 p-4.5">
          <form onSubmit={createCampaign}>
            <div className="grid grid-cols-3 gap-3.5">
              <label className="text-[12.5px] font-semibold text-text">
                Campaign name
                <TextInput
                  className="mt-1.5 font-normal"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder="Rainy-season blanket clean"
                  invalid={!!errors.name}
                />
                {errors.name && <span className="mt-1 block text-[11.5px] text-danger-fg">{errors.name}</span>}
              </label>
              <label className="text-[12.5px] font-semibold text-text">
                Channels
                <TextInput
                  className="mt-1.5 font-normal"
                  value={form.channel}
                  onChange={(event) => setField('channel', event.target.value)}
                  placeholder="Facebook · Telegram"
                  invalid={!!errors.channel}
                />
                {errors.channel && <span className="mt-1 block text-[11.5px] text-danger-fg">{errors.channel}</span>}
              </label>
              <label className="text-[12.5px] font-semibold text-text">
                Budget (៛)
                <TextInput
                  className="mt-1.5 font-normal"
                  value={form.budget}
                  onChange={(event) => setField('budget', event.target.value)}
                  inputMode="numeric"
                  placeholder="120000"
                  invalid={!!errors.budget}
                />
                {errors.budget && <span className="mt-1 block text-[11.5px] text-danger-fg">{errors.budget}</span>}
              </label>
            </div>
            {errors.form && <div role="alert" className="mt-3 text-[12px] font-medium text-danger-fg">{errors.form}</div>}
            <div className="mt-4 flex justify-end gap-2.5">
              <Button variant="default" onClick={cancel}>Cancel</Button>
              <Button type="submit" variant="primary">Save draft</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {(adCampaigns || []).map((campaign) => (
          <div
            key={campaign.id || campaign.name}
            className="flex items-center gap-3.5 border-b border-border px-4.5 py-3.5 last:border-b-0"
          >
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-text">{campaign.name}</div>
              <div className="text-[12px] text-muted">
                {campaign.channel} · {khr(Number(campaign.budget || 0))} budget
              </div>
            </div>
            <Badge tone={campaign.tone || (campaign.status === 'Running' ? 'ok' : 'neutral')}>
              {campaign.status}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
