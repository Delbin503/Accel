import { useLocation } from "react-router-dom";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { trmsTrail } from "./trmsNav";

/* The shared breadcrumb derives its trail from the app's full nav; TRMS has its
   own cut of it (and calls cameras "Devices"), so the trail comes from that. */
export function TrmsBreadcrumb() {
  const { pathname } = useLocation();
  return <ProtoBreadcrumb trail={trmsTrail(pathname)} className="mb-4" />;
}
