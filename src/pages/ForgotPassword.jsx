import { useEffect, useRef, useState } from 'react';
import AuthShell, { AuthLink } from '../components/AuthShell.jsx';
import PasswordMeter from '../components/PasswordMeter.jsx';
import { Alert, Button, Field, PasswordInput, TextInput } from '../components/ui/index.jsx';
import { cn } from '../lib/cn.js';
import { I, Icon } from '../lib/icons.jsx';
import {
  digits,
  isEmail,
  validateConfirm,
  validateContact,
  validateNewPassword,
} from '../lib/validate.js';
import { usePortal } from '../store/PortalContext.jsx';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

const STEPS = ['Your account', 'Verify code', 'New password'];

/** "012345678" -> "•••• 678"; "sok@mail.com" -> "s•••@mail.com" */
function mask(contact) {
  const v = contact.trim();
  if (isEmail(v)) {
    const [name, domain] = v.split('@');
    return `${name.slice(0, 1)}•••@${domain}`;
  }
  const d = digits(v);
  return `•••• ${d.slice(-3)}`;
}

function Stepper({ current }) {
  return (
    <ol className="mt-6 flex list-none items-center gap-2 p-0">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                'h-1 rounded-full transition-colors',
                done || active ? 'bg-accent' : 'bg-border-strong'
              )}
            />
            <span
              className={cn(
                'text-[11px] font-semibold',
                active ? 'text-text' : done ? 'text-accent' : 'text-faint'
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Six single-character boxes with auto-advance, backspace and paste support. */
function CodeInput({ value, onChange, invalid }) {
  const refs = useRef([]);
  const focus = (i) => refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus();

  const onBoxChange = (i, raw) => {
    const d = digits(raw);
    if (!d) {
      onChange(value.slice(0, i));
      return;
    }
    // A box only ever holds one digit; extra characters spill into the next boxes.
    const next = (value.slice(0, i) + d).slice(0, CODE_LENGTH);
    onChange(next);
    focus(next.length);
  };

  const onKeyDown = (i, event) => {
    if (event.key === 'Backspace' && !value[i] && i > 0) {
      event.preventDefault();
      onChange(value.slice(0, i - 1));
      focus(i - 1);
    }
    if (event.key === 'ArrowLeft') focus(i - 1);
    if (event.key === 'ArrowRight') focus(i + 1);
  };

  const onPaste = (event) => {
    const pasted = digits(event.clipboardData.getData('text')).slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  };

  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
          aria-invalid={invalid ? 'true' : undefined}
          value={value[i] || ''}
          onChange={(e) => onBoxChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          style={invalid ? { borderColor: 'var(--danger-fg)' } : undefined}
          className="h-12 w-full min-w-0 rounded-[10px] border border-border bg-inset text-center text-[18px] font-semibold text-text outline-none transition-[border-color,box-shadow] focus:border-accent focus:ring-3 focus:ring-(--ring)"
        />
      ))}
    </div>
  );
}

export default function ForgotPassword() {
  const p = usePortal();
  const [step, setStep] = useState(0); // 0 request · 1 verify · 2 reset · 3 done
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [left, setLeft] = useState(0);
  const [developmentCode, setDevelopmentCode] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Resend cooldown, restarted every time a code goes out.
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const fail = (key, message) => {
    setErrors({ [key]: message });
    return false;
  };

  /** Drops a stale error the moment the user starts fixing that field. */
  const clear = (key) =>
    setErrors((current) => ({ ...current, [key]: '', form: '' }));

  const sendCode = async (event) => {
    event?.preventDefault();
    if (pending) return false;
    const error = validateContact(contact);
    if (error) return fail('contact', error);

    setErrors({});
    setPending(true);
    try {
      const result = await p.requestPasswordReset(contact);
      setPending(false);
      setCode('');
      setDevelopmentCode(result.code);
      setResetToken('');
      setLeft(RESEND_SECONDS);
      setStep(1);
      p.notify(`Development reset code generated for ${mask(contact)}`);
      return true;
    } catch (requestError) {
      setPending(false);
      return fail(
        'contact',
        requestError?.message || 'A development reset code could not be generated.'
      );
    }
  };

  const resend = async () => {
    if (left > 0 || pending) return;
    setCode('');
    setErrors({});
    setPending(true);
    try {
      const result = await p.requestPasswordReset(contact);
      setDevelopmentCode(result.code);
      setResetToken('');
      setLeft(RESEND_SECONDS);
      p.notify(`New development reset code generated for ${mask(contact)}`);
    } catch (requestError) {
      fail('code', requestError?.message || 'A new development code could not be generated.');
    } finally {
      setPending(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    if (pending) return false;
    if (code.length < CODE_LENGTH) return fail('code', `Enter all ${CODE_LENGTH} digits.`);

    setErrors({});
    setPending(true);
    try {
      const result = await p.verifyPasswordReset({ identifier: contact, code });
      setResetToken(result.resetToken);
      setPending(false);
      setStep(2);
      return true;
    } catch (verifyError) {
      setPending(false);
      return fail('code', verifyError?.message || 'That development reset code is not valid.');
    }
  };

  const reset = async (event) => {
    event.preventDefault();
    if (pending) return;
    const next = {
      password: validateNewPassword(password),
      confirm: validateConfirm(confirm, password),
    };
    if (next.password || next.confirm) {
      setErrors(next);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await p.resetPassword({ resetToken, newPassword: password });
      setPending(false);
      setStep(3);
      p.notify('Browser-local password updated');
    } catch (resetError) {
      setPending(false);
      setErrors({ form: resetError?.message || 'The browser-local password could not be updated.' });
    }
  };

  /* ------------------------------------------------------------------ done */
  if (step === 3) {
    return (
      <AuthShell>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ok-bg text-ok-fg">
            <Icon paths={I.check} size={22} strokeWidth={2.4} />
          </span>
          <h1 className="mt-4 text-[25px] font-bold tracking-tight text-text">Password updated</h1>
          <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
            Your new password is active for this browser-local account. Use it the next time you
            sign in on this device.
          </p>
          <Button
            variant="accent"
            onClick={p.goAuth('login')}
            className="mt-6 w-full justify-center py-2.75 text-[13.5px] font-semibold"
          >
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <button
        type="button"
        onClick={step === 0 ? p.goAuth('login') : () => setStep(step - 1)}
        className="mb-5 flex cursor-pointer items-center gap-1.5 rounded border-0 bg-transparent text-[12.5px] font-medium text-muted hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
      >
        <Icon paths={['M19 12H5', 'M12 19l-7-7 7-7']} size={14} strokeWidth={2.2} />
        {step === 0 ? 'Back to sign in' : 'Back'}
      </button>

      {/* --------------------------------------------------------- request */}
      {step === 0 && (
        <form onSubmit={sendCode} noValidate>
          <h1 className="m-0 text-[25px] font-bold tracking-tight text-text sm:text-[27px]">
            Reset your password
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
            Enter the phone number or email for an account saved in this browser. A development
            reset code will be generated and shown here; no SMS or email is sent.
          </p>
          <Stepper current={0} />

          <div className="mt-6">
            <Field id="contact" label="Phone number or email" error={errors.contact}>
              <TextInput
                id="contact"
                autoFocus
                placeholder="012 345 678"
                autoComplete="username"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  clear('contact');
                }}
                invalid={!!errors.contact}
                aria-describedby={errors.contact ? 'contact-error' : undefined}
                className="py-2.75"
              />
            </Field>
          </div>

          <Button
            type="submit"
            variant="accent"
            loading={pending}
            className="mt-5 w-full justify-center py-2.75 text-[13.5px] font-semibold"
          >
            {pending ? 'Generating code…' : 'Generate reset code'}
          </Button>
        </form>
      )}

      {/* ---------------------------------------------------------- verify */}
      {step === 1 && (
        <form onSubmit={verify} noValidate>
          <h1 className="m-0 text-[25px] font-bold tracking-tight text-text sm:text-[27px]">
            Enter the code
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
            A 6-digit development code was generated for{' '}
            <strong className="font-semibold text-text">{mask(contact)}</strong>. It expires in 10
            minutes and works only in this tab.
          </p>
          <Stepper current={1} />

          <div className="mt-6">
            <CodeInput
              value={code}
              onChange={(next) => {
                setCode(next);
                clear('code');
              }}
              invalid={!!errors.code}
            />
            {errors.code && (
              <p role="alert" className="mt-2 text-[12px] font-medium text-danger-fg">
                {errors.code}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="accent"
            loading={pending}
            className="mt-5 w-full justify-center py-2.75 text-[13.5px] font-semibold"
          >
            {pending ? 'Checking…' : 'Verify code'}
          </Button>

          <p className="mt-4 text-center text-[12.5px] text-muted">
            {left > 0 ? (
              <span className="text-faint">Resend code in {left}s</span>
            ) : (
              <AuthLink onClick={resend}>Generate a new code</AuthLink>
            )}
          </p>

          <p className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-inset px-3.5 py-3 text-[12px] leading-normal text-muted">
            <span className="mt-px shrink-0 text-faint">
              <Icon paths={I.lock} size={14} strokeWidth={1.9} />
            </span>
            <span>
              <strong className="font-semibold text-text">Local development only.</strong> No SMS
              or email is sent. Your current one-time code is{' '}
              <strong className="font-mono font-semibold text-text">{developmentCode}</strong>.
            </span>
          </p>
        </form>
      )}

      {/* ----------------------------------------------------------- reset */}
      {step === 2 && (
        <form onSubmit={reset} noValidate>
          <h1 className="m-0 text-[25px] font-bold tracking-tight text-text sm:text-[27px]">
            Choose a new password
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
            It needs at least 8 characters, with a letter and a number.
          </p>
          <Stepper current={2} />

          <div className="mt-6 flex flex-col gap-4">
            <Field id="password" label="New password" error={errors.password}>
              <PasswordInput
                id="password"
                autoFocus
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear('password');
                }}
                invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="py-2.75"
              />
              <PasswordMeter value={password} />
            </Field>

            <Field id="confirm" label="Confirm new password" error={errors.confirm}>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  clear('confirm');
                }}
                invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? 'confirm-error' : undefined}
                className="py-2.75"
              />
            </Field>
          </div>

          <Button
            type="submit"
            variant="accent"
            loading={pending}
            className="mt-5 w-full justify-center py-2.75 text-[13.5px] font-semibold"
          >
            {pending ? 'Updating…' : 'Update password'}
          </Button>

          {errors.form && (
            <Alert tone="danger" className="mt-3 animate-kshake">
              {errors.form}
            </Alert>
          )}
        </form>
      )}
    </AuthShell>
  );
}
