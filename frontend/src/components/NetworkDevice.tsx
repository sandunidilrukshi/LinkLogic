
type NetworkDeviceProps = {
  name: string;
  type: "PC" | "SW" | "R";
  description: string;
  className: string;
};

function NetworkDevice({
  name,
  type,
  description,
  className,
}: NetworkDeviceProps) {
  return (
    <div className={`device ${className}`}>
      <span className="device-icon">{type}</span>
      <strong>{name}</strong>
      <small>{description}</small>
    </div>
  );
}

export default NetworkDevice;
