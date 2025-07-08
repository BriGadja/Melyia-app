import React from "react";
import { VERSION, DEPLOY_DATETIME } from "../../version";

const style: React.CSSProperties = {
  position: "fixed",
  bottom: 8,
  right: 12,
  background: "rgba(0,0,0,0.55)",
  color: "#fff",
  fontSize: 12,
  borderRadius: 6,
  padding: "4px 10px",
  zIndex: 9999,
  opacity: 0.85,
  pointerEvents: "none",
};

export const VersionInfo: React.FC = () => (
  <div style={style}>
    Version {VERSION} – déployé le {DEPLOY_DATETIME}
  </div>
);

export default VersionInfo;
