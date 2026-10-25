
type StatCardProps = {
  label: string;
  value: string;
  icon: string;
};

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="metric">
      <div>
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
      </div>

      <span className="metric-icon" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
}

export default StatCard;
