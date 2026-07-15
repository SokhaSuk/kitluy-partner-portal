/** Shared form rules for the auth screens. Each returns an error string, or '' when valid. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (value) => value.includes('@');

/** Accepts either a phone number or an email address in one field. */
export function validateContact(value, { required = 'Enter your phone number or email.' } = {}) {
  const v = (value || '').trim();
  if (!v) return required;
  if (isEmail(v)) return EMAIL.test(v) ? '' : 'That email address looks incomplete.';
  return digits(v).length >= 8 ? '' : 'Enter a valid phone number, e.g. 012 345 678.';
}

export function validatePhone(value) {
  const v = (value || '').trim();
  if (!v) return 'Enter your phone number.';
  return digits(v).length >= 8 ? '' : 'Enter a valid phone number, e.g. 012 345 678.';
}

/** Email is optional on sign-up, so blank passes. */
export function validateEmailOptional(value) {
  const v = (value || '').trim();
  if (!v) return '';
  return EMAIL.test(v) ? '' : 'That email address looks incomplete.';
}

export function validateRequired(value, message) {
  return (value || '').trim() ? '' : message;
}

/** Sign-in only checks the shape — the policy below is for passwords being created. */
export function validateSignInPassword(value) {
  if (!value) return 'Enter your password.';
  return value.length >= 6 ? '' : 'Passwords are at least 6 characters.';
}

export const digits = (value) => (value || '').replace(/\D/g, '');

/* ------------------------------------------------------------------ new passwords */

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'letter', label: 'One letter', test: (v) => /[a-zA-Z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { key: 'symbol', label: 'One symbol (bonus)', test: (v) => /[^a-zA-Z0-9]/.test(v), bonus: true },
];

/** 0–4, with the three non-bonus rules being the ones a password must meet. */
export function passwordScore(value = '') {
  const hits = PASSWORD_RULES.filter((r) => r.test(value)).map((r) => r.key);
  const score = value ? hits.length : 0;
  const label = ['', 'Weak', 'Weak', 'Good', 'Strong'][score];
  const tone = ['neutral', 'danger', 'warn', 'info', 'ok'][score];
  return { score, label, tone, hits };
}

/** The policy applied when a password is being set or reset. */
export function validateNewPassword(value) {
  if (!value) return 'Choose a password.';
  const missing = PASSWORD_RULES.filter((r) => !r.bonus && !r.test(value));
  if (!missing.length) return '';
  if (value.length < 8) return 'Use at least 8 characters.';
  return 'Mix in at least one letter and one number.';
}

export function validateConfirm(value, password) {
  if (!value) return 'Re-enter the password to confirm.';
  return value === password ? '' : 'These passwords do not match.';
}
