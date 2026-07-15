import { Suspense, lazy } from "react";
import Toast from "./components/Toast.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import { Skeleton } from "./components/ui/index.jsx";
import { usePortal } from "./store/PortalContext.jsx";

import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import SignUp from "./pages/SignUp.jsx";

const Shell = lazy(() => import("./Shell.jsx"));

/** The signed-out screens. All three share the AuthShell chrome. */
function AuthRouter() {
  const { authView } = usePortal();

  switch (authView) {
    case "forgot":
      return <ForgotPassword />;
    case "signup":
      return <SignUp />;
    default:
      return <Login />;
  }
}

/**
 * Holds the portal's frame while its chunk loads, so sign-in doesn't flash empty.
 * It mirrors the real layout rather than centring a spinner: landing on the shape
 * you are about to get makes the wait feel shorter than landing on a blank page.
 */
const ShellFallback = () => (
  <div className="flex h-full w-full flex-1" role="status" aria-label="Loading the portal">
    <div className="hidden shrink-0 flex-col gap-2 border-r border-border bg-panel p-3 md:flex md:w-63">
      <Skeleton className="h-9 w-full rounded-lg" />
      <div className="mt-2 flex flex-col gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:p-6">
      <Skeleton className="h-7 w-56 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="min-h-40 flex-1 rounded-2xl" />
    </div>
  </div>
);

export default function App({ accentColor }) {
  const { theme, authed } = usePortal();

  return (
    <div
      data-theme={theme}
      style={accentColor ? { "--accent": accentColor } : undefined}
      className="flex h-screen w-full overflow-hidden bg-bg text-[14px] leading-[1.45] text-text"
    >
      {authed ? (
        <Suspense fallback={<ShellFallback />}>
          <Shell />
        </Suspense>
      ) : (
        <AuthRouter />
      )}
      <Toast />
      <ConfirmDialog />
    </div>
  );
}
