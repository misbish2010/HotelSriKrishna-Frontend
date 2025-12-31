// src/components/common/PageHeader.jsx
import { Badge } from "react-bootstrap";
import "./page-header.css";

export const PageHeader = ({ title, subtitle, badge }) => (
  <div className="page-header d-flex justify-content-between align-items-center mb-3">
    <div>
      <h4 className="mb-0">{title}</h4>
      {subtitle && (
        <small className="text-muted">{subtitle}</small>
      )}
    </div>

    {badge && (
      <Badge bg="secondary" pill>
        {badge}
      </Badge>
    )}
  </div>
);
