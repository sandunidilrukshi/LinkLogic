
type StatusBadgeProps = {
  label: string;
  variant?: "success" | "neutral";
};

function StatusBadge({
  label,
  variant = "success",
}: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

export default StatusBadge;
