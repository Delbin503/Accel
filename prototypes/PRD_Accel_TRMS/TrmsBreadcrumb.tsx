import { useLocation } from "react-router-dom";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { TRMS_TRAILS } from "./trmsNav";

/* The shared breadcrumb derives its trail from the app's nav, which has no
   TRMS routes — so each route's trail is given explicitly. */
export function TrmsBreadcrumb() {
  const { pathname } = useLocation();
  return <ProtoBreadcrumb trail={TRMS_TRAILS[pathname] ?? TRMS_TRAILS["/"]} className="mb-4" />;
}
