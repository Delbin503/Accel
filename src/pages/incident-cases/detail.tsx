import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function IncidentCaseDetailRedirect() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate("/incidents", { replace: true, state: { openCaseId: caseId } });
  }, [caseId, navigate]);

  return null;
}
