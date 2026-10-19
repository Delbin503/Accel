import * as React from "react";
import { useLocation } from "react-router-dom";
import { currentPrototype, prototypeFor } from "./protoRoutes";

/* PROTOTYPE-ONLY. Wraps a prototype's catch-all route. When the app navigates
   to a page another Phase 1 prototype owns, it loads that prototype on the same
   route (query string included); otherwise it renders the catch-all as before. */
export function PrototypeHandoff({ children }: { children: React.ReactNode }) {
  const { pathname, search } = useLocation();
  const owner = prototypeFor(pathname);
  const leaving = !!owner && owner !== currentPrototype();

  React.useEffect(() => {
    if (leaving) window.location.assign(`/${owner}/?p=${encodeURIComponent(pathname + search)}`);
  }, [leaving, owner, pathname, search]);

  return leaving ? null : <>{children}</>;
}
