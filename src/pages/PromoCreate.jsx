import { useState } from 'react';
import { I, Icon } from '../lib/icons.jsx';
import { Button, Card, Chip, TextInput, Toggle } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';

const BACK = ['M19 12H5', 'M12 19l-7-7 7-7'];

/** Label + control pair used throughout the form grid. */
function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.75 block text-[13px] font-semibold text-text">{label}</label>
      {children}
      {error && <div className="mt-1 text-[11.5px] font-medium text-danger-fg">{error}</div>}
    </div>
  );
}

const initialForm = () => ({
  code: '',
  discountType: 'Percentage',
  value: '10',
  minOrder: '40000',
  maxCap: '10000',
  limit: '200',
  perCustomer: '1',
  applies: 'Wash & Fold',
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: '',
  stackable: false,
});

const numberValue = (value) => Number(String(value).replace(/[^\d.]/g, ''));

export default function PromoCreate() {
  const p = usePortal();
  const { promotions, addPromotion } = useDomain();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '', form: '' }));
  };

  const validate = () => {
    const next = {};
    const code = form.code.trim().toUpperCase();
    const amount = numberValue(form.value);
    const minOrder = numberValue(form.minOrder);
    const maxCap = numberValue(form.maxCap);
    const limit = numberValue(form.limit);
    const perCustomer = numberValue(form.perCustomer);

    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      next.code = 'Use 3–20 letters, numbers, underscores or hyphens.';
    } else if ((promotions || []).some((promo) => promo.code.toUpperCase() === code)) {
      next.code = 'That promotion code already exists.';
    }
    if (!(amount > 0)) next.value = 'Enter a discount greater than zero.';
    if (form.discountType === 'Percentage' && amount > 100) {
      next.value = 'A percentage discount cannot exceed 100.';
    }
    if (!Number.isFinite(minOrder) || minOrder < 0) next.minOrder = 'Enter zero or a positive amount.';
    if (!Number.isFinite(maxCap) || maxCap < 0) next.maxCap = 'Enter zero or a positive amount.';
    if (!Number.isInteger(limit) || limit < 0) next.limit = 'Enter a whole number, or zero for unlimited.';
    if (!Number.isInteger(perCustomer) || perCustomer < 1) next.perCustomer = 'Enter at least 1.';
    if (!form.applies.trim()) next.applies = 'Describe what this code applies to.';
    if (!form.validFrom) next.validFrom = 'Choose a start date.';
    if (!form.validTo) next.validTo = 'Choose an end date.';
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) {
      next.validTo = 'The end date must be on or after the start date.';
    }
    return next;
  };

  const activate = (event) => {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      const amount = numberValue(form.value);
      const promotion = addPromotion({
        code: form.code.trim().toUpperCase(),
        type: form.discountType === 'Percentage' ? `${amount}% off` : `៛${amount.toLocaleString()} off`,
        discountType: form.discountType,
        discountValue: amount,
        minOrder: numberValue(form.minOrder),
        maxCap: numberValue(form.maxCap),
        limit: numberValue(form.limit),
        perCustomer: numberValue(form.perCustomer),
        applies: form.applies.trim(),
        validFrom: form.validFrom,
        validTo: form.validTo,
        stackable: form.stackable,
        used: 0,
        revenue: 0,
        status: 'Active',
      });
      p.notify(`${promotion.code} was activated and saved locally`);
      p.go('marketing')();
    } catch (error) {
      setPending(false);
      setErrors({ form: error?.message || 'The promotion could not be saved.' });
    }
  };

  return (
    <div className="mx-auto max-w-225 animate-kfade">
      <button
        type="button"
        onClick={p.go('marketing')}
        className="mb-3.5 flex items-center gap-1.5 text-[13px] text-muted hover:text-text"
      >
        <Icon paths={BACK} size={16} />
        Cancel
      </button>

      <div className="mb-0.75 text-[21px] font-bold tracking-[-0.01em] text-text">New promo code</div>
      <div className="mb-4.5 text-[13px] text-muted">
        Saved promotions appear in Marketing. External POS synchronization is not connected.
      </div>

      <form onSubmit={activate}>
      <Card className="flex flex-col gap-4 p-5.5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code" error={errors.code}>
            <TextInput
              value={form.code}
              onChange={(event) => setField('code', event.target.value.toUpperCase())}
              placeholder="RAINY10"
              className="font-mono text-[13.5px]"
              invalid={!!errors.code}
            />
          </Field>
          <Field label="Discount type">
            <div className="flex gap-2">
              <Chip
                active={form.discountType === 'Percentage'}
                className="flex-1 text-center"
                onClick={() => setField('discountType', 'Percentage')}
              >
                Percentage
              </Chip>
              <Chip
                active={form.discountType === 'Fixed KHR'}
                className="flex-1 text-center"
                onClick={() => setField('discountType', 'Fixed KHR')}
              >
                Fixed ៛
              </Chip>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label={form.discountType === 'Percentage' ? 'Value (%)' : 'Value (៛)'} error={errors.value}>
            <TextInput value={form.value} onChange={(event) => setField('value', event.target.value)} inputMode="decimal" invalid={!!errors.value} />
          </Field>
          <Field label="Min order (៛)" error={errors.minOrder}>
            <TextInput value={form.minOrder} onChange={(event) => setField('minOrder', event.target.value)} inputMode="numeric" invalid={!!errors.minOrder} />
          </Field>
          <Field label="Max cap (៛)" error={errors.maxCap}>
            <TextInput value={form.maxCap} onChange={(event) => setField('maxCap', event.target.value)} inputMode="numeric" invalid={!!errors.maxCap} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Usage limit" error={errors.limit}>
            <TextInput value={form.limit} onChange={(event) => setField('limit', event.target.value)} inputMode="numeric" invalid={!!errors.limit} />
          </Field>
          <Field label="Per customer" error={errors.perCustomer}>
            <TextInput value={form.perCustomer} onChange={(event) => setField('perCustomer', event.target.value)} inputMode="numeric" invalid={!!errors.perCustomer} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Applies to" error={errors.applies}>
            <TextInput value={form.applies} onChange={(event) => setField('applies', event.target.value)} invalid={!!errors.applies} />
          </Field>
          <Field label="Valid from" error={errors.validFrom}>
            <TextInput type="date" value={form.validFrom} onChange={(event) => setField('validFrom', event.target.value)} invalid={!!errors.validFrom} />
          </Field>
        </div>

        <Field label="Valid to" error={errors.validTo}>
          <TextInput type="date" value={form.validTo} onChange={(event) => setField('validTo', event.target.value)} invalid={!!errors.validTo} />
        </Field>

        <div className="flex items-center justify-between gap-3 rounded-[11px] border border-border bg-panel-2 px-3.5 py-3">
          <div>
            <div className="text-[13px] font-semibold text-text">Stackable with offers</div>
            <div className="text-[12px] text-muted">Allow combining with in-store offers</div>
          </div>
          <Toggle
            on={form.stackable}
            onClick={() => setField('stackable', !form.stackable)}
            aria-label="Allow stacking with in-store offers"
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-[10px] bg-ok-bg px-3.5 py-2.75">
          <Icon paths={I.check} size={16} strokeWidth={2.2} className="shrink-0 text-ok-fg" />
          <span className="text-[12.5px] text-ok-fg">
            The code will be validated and persisted to the local promotion store when activated.
          </span>
        </div>

        {errors.form && (
          <div role="alert" className="rounded-[10px] bg-danger-bg px-3.5 py-2.75 text-[12.5px] font-medium text-danger-fg">
            {errors.form}
          </div>
        )}
      </Card>

      <div className="mt-4.5 flex justify-end gap-2.5">
        <Button variant="default" onClick={p.go('marketing')}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Activating…' : 'Activate code'}
        </Button>
      </div>
      </form>
    </div>
  );
}
