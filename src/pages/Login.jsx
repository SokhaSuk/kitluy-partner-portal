import { useState } from "react";
import AuthShell, { AuthLink } from "../components/AuthShell.jsx";
import {
  Alert,
  Button,
  Field,
  PasswordInput,
  TextInput,
  Toggle,
} from "../components/ui/index.jsx";
import { I, Icon } from "../lib/icons.jsx";
import { DEMO_CREDENTIALS } from "../services/localAuth.js";
import { validateContact, validateSignInPassword } from "../lib/validate.js";
import { usePortal } from "../store/PortalContext.jsx";

export default function Login() {
  const p = usePortal();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);

  /** Drops a stale error the moment the user starts fixing that field. */
  const clear = (key) =>
    setErrors((current) => ({ ...current, [key]: "", form: "" }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const next = {
      identifier: validateContact(identifier),
      password: validateSignInPassword(password),
    };
    const failed = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v),
    );
    setErrors(failed);
    if (Object.keys(failed).length) return;

    setPending(true);
    try {
      await p.signIn({ identifier: identifier.trim(), password }, { remember });
    } catch (error) {
      setErrors({ form: error?.message || "This browser-local account could not be signed in." });
      setPending(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={onSubmit} noValidate>
        <h1 className="m-0 text-[25px] font-bold tracking-tight text-text sm:text-[27px]">
          Sign in to your store
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
          Welcome back. Use the phone number or email registered with your
          KitLuy store.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <Field
            id="identifier"
            label="Phone number or email"
            error={errors.identifier}
          >
            <TextInput
              id="identifier"
              name="identifier"
              inputMode="email"
              autoComplete="username"
              autoFocus
              placeholder="012 345 678"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                clear("identifier");
              }}
              invalid={!!errors.identifier}
              aria-describedby={
                errors.identifier ? "identifier-error" : undefined
              }
              className="py-2.75"
            />
          </Field>

          <Field
            id="password"
            label="Password"
            error={errors.password}
            action={
              <AuthLink onClick={p.goAuth("forgot")} className="text-[12px]">
                Forgot password?
              </AuthLink>
            }
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear("password");
              }}
              invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="py-2.75"
            />
          </Field>
        </div>

        <div className="mt-4.5 flex items-center gap-2.5">
          {/* A <label htmlFor> would forward its click to the switch and
              cancel out this handler, so the text carries its own. */}
          <Toggle
            on={remember}
            onClick={() => setRemember((v) => !v)}
            aria-labelledby="remember-label"
          />
          <span
            id="remember-label"
            onClick={() => setRemember((v) => !v)}
            className="cursor-pointer text-[12.5px] font-medium text-muted select-none"
          >
            Keep me signed in on this device
          </span>
        </div>

        <Button
          type="submit"
          variant="accent"
          loading={pending}
          className="mt-5.5 w-full justify-center py-2.75 text-[13.5px] font-semibold"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        {errors.form && (
          <Alert tone="danger" className="mt-3 animate-kshake">
            {errors.form}
          </Alert>
        )}

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold tracking-wider text-faint uppercase">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="default"
          icon={I.lock}
          onClick={p.goAuth("forgot")}
          className="w-full justify-center py-2.75 text-[13.5px]"
        >
          Reset a local password
        </Button>

        <p className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-inset px-3.5 py-3 text-[12px] leading-normal text-muted">
          <span className="mt-px shrink-0 text-faint">
            <Icon paths={I.lock} size={14} strokeWidth={1.9} />
          </span>
          <span>
            <strong className="font-semibold text-text">Local development only.</strong>{" "}
            Accounts and password hashes stay in this browser. Demo credentials:{" "}
            <span className="font-mono text-text">{DEMO_CREDENTIALS.identifier}</span>{" / "}
            <span className="font-mono text-text">{DEMO_CREDENTIALS.password}</span>.
          </span>
        </p>

        <p className="mt-6 text-center text-[12.5px] text-muted">
          New to KitLuy?{" "}
          <AuthLink onClick={p.goAuth("signup")}>Register your store</AuthLink>
        </p>
      </form>
    </AuthShell>
  );
}
