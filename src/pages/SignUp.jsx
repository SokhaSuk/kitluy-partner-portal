import { useState } from 'react';
import AuthShell, { AuthLink } from '../components/AuthShell.jsx';
import PasswordMeter from '../components/PasswordMeter.jsx';
import { Alert, Button, Field, PasswordInput, Select, TextInput, Toggle } from '../components/ui/index.jsx';
import { cn } from '../lib/cn.js';
import { I, Icon } from '../lib/icons.jsx';
import {
  validateConfirm,
  validateEmailOptional,
  validateNewPassword,
  validatePhone,
  validateRequired,
} from '../lib/validate.js';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import {
  FALLBACK_BUSINESS_TYPES,
  FALLBACK_PROVINCES,
  useSignupOptions,
} from '../store/useSignupOptions.js';

const STEPS = ['Your store', 'Your account'];

// Defaults for the empty form. The live option lists come from useSignupOptions();
// these are just the initial selections and match the top of the backend lists.
const EMPTY = {
  storeName: '',
  businessType: FALLBACK_BUSINESS_TYPES[0],
  province: FALLBACK_PROVINCES[0],
  ownerName: '',
  phone: '',
  email: '',
  password: '',
  confirm: '',
};

/** Only the fields on the given step are checked, so step 1 can't block step 0. */
function validateStep(step, form, agreed) {
  if (step === 0) {
    return {
      storeName: validateRequired(form.storeName, 'Enter your store name.'),
    };
  }
  return {
    ownerName: validateRequired(form.ownerName, 'Enter the owner’s full name.'),
    phone: validatePhone(form.phone),
    email: validateEmailOptional(form.email),
    password: validateNewPassword(form.password),
    confirm: validateConfirm(form.confirm, form.password),
    terms: agreed ? '' : 'Confirm that this local-development account stays in this browser.',
  };
}

function Stepper({ current }) {
  return (
    <ol className="mt-6 flex list-none items-center gap-2 p-0">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col gap-1.5">
          <span
            className={cn(
              'h-1 rounded-full transition-colors',
              i <= current ? 'bg-accent' : 'bg-border-strong'
            )}
          />
          <span
            className={cn(
              'text-[11px] font-semibold',
              i === current ? 'text-text' : i < current ? 'text-accent' : 'text-faint'
            )}
          >
            Step {i + 1} · {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function SignUp() {
  const p = usePortal();
  const { updateStoreSettings } = useDomain();
  const { businessTypes, provinces } = useSignupOptions();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);

  /** Drops a stale error the moment the user starts fixing that field. */
  const clear = (key) =>
    setErrors((current) => ({ ...current, [key]: '', form: '' }));

  const field = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      clear(key);
    },
    invalid: !!errors[key],
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
    id: key,
    className: 'py-2.75',
  });

  const toggleTerms = () => {
    setAgreed((v) => !v);
    clear('terms');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const next = validateStep(step, form, agreed);
    const failed = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
    setErrors(failed);
    if (Object.keys(failed).length) return;

    if (step === 0) {
      setStep(1);
      return;
    }

    setPending(true);
    try {
      await p.register(form, { remember: true });
      updateStoreSettings({
        name: form.storeName.trim(),
        vertical: form.businessType,
        phone: form.phone.trim(),
        province: form.province,
      });
      p.notify(`${form.storeName} was saved in this browser`);
    } catch (error) {
      setErrors({ form: error?.message || 'This browser-local account could not be created.' });
      setPending(false);
    }
  };

  return (
    <AuthShell>
      <button
        type="button"
        onClick={step === 0 ? p.goAuth('login') : () => setStep(0)}
        className="mb-5 flex cursor-pointer items-center gap-1.5 rounded border-0 bg-transparent text-[12.5px] font-medium text-muted hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
      >
        <Icon paths={['M19 12H5', 'M12 19l-7-7 7-7']} size={14} strokeWidth={2.2} />
        {step === 0 ? 'Back to sign in' : 'Back'}
      </button>

      <form onSubmit={submit} noValidate>
        <h1 className="m-0 text-[25px] font-bold tracking-tight text-text sm:text-[27px]">
          {step === 0 ? 'Register your store' : 'Create your login'}
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
          {step === 0
            ? 'Create a browser-local development account. No plan, billing, or payment service is activated.'
            : 'You’ll use these details to sign in and manage the store.'}
        </p>
        <Stepper current={step} />

        {/* ------------------------------------------------------ store */}
        {step === 0 && (
          <div className="mt-6 flex flex-col gap-4">
            <Field id="storeName" label="Store name" error={errors.storeName}>
              <TextInput
                {...field('storeName')}
                autoFocus
                placeholder="Sok Laundry"
                autoComplete="organization"
              />
            </Field>

            <Field id="businessType" label="What do you do?" error={errors.businessType}>
              <Select {...field('businessType')}>
                {businessTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="province"
              label="City or province"
              error={errors.province}
              hint="Saved on the browser-local store profile."
            >
              <Select {...field('province')}>
                {provinces.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {/* ---------------------------------------------------- account */}
        {step === 1 && (
          <div className="mt-6 flex flex-col gap-4">
            <Field id="ownerName" label="Your full name" error={errors.ownerName}>
              <TextInput {...field('ownerName')} autoFocus placeholder="Het Sovannara" autoComplete="name" />
            </Field>

            <Field id="phone" label="Phone number" error={errors.phone}>
              <TextInput
                {...field('phone')}
                type="tel"
                inputMode="tel"
                placeholder="012 345 678"
                autoComplete="tel"
              />
            </Field>

            <Field
              id="email"
              label="Email"
              error={errors.email}
              action={<span className="text-[11.5px] text-faint">Optional</span>}
              hint="Saved on the local account profile; no email is sent."
            >
              <TextInput
                {...field('email')}
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field id="password" label="Password" error={errors.password}>
              <PasswordInput
                {...field('password')}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <PasswordMeter value={form.password} />
            </Field>

            <Field id="confirm" label="Confirm password" error={errors.confirm}>
              <PasswordInput
                {...field('confirm')}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <div>
              <div className="flex items-start gap-2.5">
                {/* A <label htmlFor> would forward its click to the switch and
                    cancel out this handler, so the text carries its own. */}
                <Toggle
                  on={agreed}
                  onClick={toggleTerms}
                  aria-labelledby="terms-label"
                  className="mt-0.5"
                />
                <span
                  id="terms-label"
                  onClick={toggleTerms}
                  className="cursor-pointer text-[12.5px] leading-normal font-medium text-muted select-none"
                >
                  I understand this local-development account and its store profile are saved only
                  in this browser.
                </span>
              </div>
              {errors.terms && (
                <p role="alert" className="mt-1.5 text-[12px] font-medium text-danger-fg">
                  {errors.terms}
                </p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="accent"
          loading={pending}
          className="mt-5 w-full justify-center py-2.75 text-[13.5px] font-semibold"
        >
          {step === 0 ? 'Continue' : pending ? 'Creating your store…' : 'Create store'}
        </Button>

        {errors.form && (
          <Alert tone="danger" className="mt-3 animate-kshake">
            {errors.form}
          </Alert>
        )}

        {step === 0 && (
          <p className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-inset px-3.5 py-3 text-[12px] leading-normal text-muted">
            <span className="mt-px shrink-0 text-faint">
              <Icon paths={I.spark} size={14} strokeWidth={1.9} />
            </span>
            <span>
              <strong className="font-semibold text-text">Local development only.</strong> Store and
              owner fields are persisted in this browser; no remote KitLuy account is created.
            </span>
          </p>
        )}

        <p className="mt-6 text-center text-[12.5px] text-muted">
          Already have a store? <AuthLink onClick={p.goAuth('login')}>Sign in</AuthLink>
        </p>
      </form>
    </AuthShell>
  );
}
