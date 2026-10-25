
import { useRef, useState, useCallback, useEffect } from "react";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import type { ChangeEvent, CSSProperties } from "react";
import "@xyflow/react/dist/style.css";

type DeviceType = "PC" | "Switch" | "Router";

type DeviceData = {
  label: string;
  deviceType: DeviceType;
  ipAddress: string;
  subnetMask: string;
  defaultGateway: string;
};

type NetworkNode = Node<DeviceData>;
type ConfigField = "ipAddress" | "subnetMask" | "defaultGateway";
type ActivePanel = "settings" | "summary" | "report" | "quality" | null;
type NetworkDiagnostics = {
  networkDevices: number;
  connectivityTests: number;
  detectedIssues: number;
  lastConnectivityResult: string;
};

type TopologyCanvasProps = {
  onDiagnosticsChange: (diagnostics: NetworkDiagnostics) => void;
};
const TOPOLOGY_STORAGE_KEY = "linklogic-saved-topology";

function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");

  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (part === "" || !/^\d+$/.test(part)) return false;

    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function isValidSubnetMask(mask: string): boolean {
  const parts = mask.trim().split(".");

  if (parts.length !== 4) return false;

  if (
    !parts.every(
      (part) =>
        /^\d+$/.test(part) &&
        Number(part) >= 0 &&
        Number(part) <= 255
    )
  ) {
    return false;
  }

  const binary = parts
    .map((part) => Number(part).toString(2).padStart(8, "0"))
    .join("");

  return /^1*0*$/.test(binary);
}

function isSameSubnet(
  ip: string,
  gateway: string,
  mask: string
): boolean {
  if (
    !isValidIPv4(ip) ||
    !isValidIPv4(gateway) ||
    !isValidSubnetMask(mask)
  ) {
    return false;
  }

  const ipParts = ip.split(".").map(Number);
  const gatewayParts = gateway.split(".").map(Number);
  const maskParts = mask.split(".").map(Number);

  return ipParts.every(
    (part, index) =>
      (part & maskParts[index]) ===
      (gatewayParts[index] & maskParts[index])
  );
}

const deviceStyles: Record<DeviceType, CSSProperties> = {
  PC: {
    width: 155,
    padding: 16,
    border: "1px solid #93c5fd",
    borderRadius: 12,
    background: "#eff6ff",
    color: "#1e3a8a",
    fontWeight: 600,
    whiteSpace: "pre-line",
  },
  Switch: {
    width: 155,
    padding: 16,
    border: "1px solid #c4b5fd",
    borderRadius: 12,
    background: "#f5f3ff",
    color: "#5b21b6",
    fontWeight: 600,
    whiteSpace: "pre-line",
  },
  Router: {
    width: 155,
    padding: 16,
    border: "1px solid #86efac",
    borderRadius: 12,
    background: "#f0fdf4",
    color: "#166534",
    fontWeight: 600,
    whiteSpace: "pre-line",
  },
};

function DeviceNode({ data, selected }: NodeProps<NetworkNode>) {
  const symbols: Record<DeviceType, string> = {
    PC: "▣",
    Switch: "⇄",
    Router: "◎",
  };

  return (
    <div
      className={`device-node device-node--${data.deviceType.toLowerCase()}${
        selected ? " is-selected" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} />

      <span className="device-node__icon" aria-hidden="true">
        {symbols[data.deviceType]}
      </span>

      <strong>{data.label.split("\n")[0]}</strong>
      <small>{data.deviceType}</small>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  device: DeviceNode,
};

const initialNodes: NetworkNode[] = [
  {
    id: "pc-01",
    type: "device",
    position: { x: 40, y: 120 },
    data: {
      label: "PC-01\n192.168.1.10",
      deviceType: "PC",
      ipAddress: "192.168.1.10",
      subnetMask: "255.255.255.0",
      defaultGateway: "192.168.1.1",
    },
    style: deviceStyles.PC,
  },
  {
    id: "switch-01",
    type: "device",
    position: { x: 270, y: 120 },
    data: {
      label: "Switch-01\nLayer 2",
      deviceType: "Switch",
      ipAddress: "",
      subnetMask: "",
      defaultGateway: "",
    },
    style: deviceStyles.Switch,
  },
  {
    id: "router-01",
    type: "device",
    position: { x: 500, y: 120 },
    data: {
      label: "Router-01\nGateway",
      deviceType: "Router",
      ipAddress: "192.168.1.1",
      subnetMask: "255.255.255.0",
      defaultGateway: "",
    },
    style: deviceStyles.Router,
  },
];

const initialEdges: Edge[] = [
  {
    id: "pc-switch",
    source: "pc-01",
    target: "switch-01",
    label: "Ethernet",
    animated: true,
  },
  {
    id: "switch-router",
    source: "switch-01",
    target: "router-01",
    label: "Ethernet",
    animated: true,
  },
];

function getSavedTopology(): {
  nodes: NetworkNode[];
  edges: Edge[];
} | null {
  try {
    const saved = localStorage.getItem(TOPOLOGY_STORAGE_KEY);

    if (!saved) return null;

    const parsed: unknown = JSON.parse(saved);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("nodes" in parsed) ||
      !("edges" in parsed) ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.edges)
    ) {
      return null;
    }

    return {
      nodes: (parsed.nodes as NetworkNode[]).map((node) => ({
        ...node,
        type: "device",
      })),
      edges: parsed.edges as Edge[],
    };
  } catch {
    return null;
  }
}

function getInitialNodes(): NetworkNode[] {
  return getSavedTopology()?.nodes ?? initialNodes;
}

function getInitialEdges(): Edge[] {
  return getSavedTopology()?.edges ?? initialEdges;
}

function TopologyCanvas({
  onDiagnosticsChange,
}: TopologyCanvasProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const [troubleshootingAdvice, setTroubleshootingAdvice] = useState("");
  const [sourceNodeId, setSourceNodeId] = useState("pc-01");
  const [targetNodeId, setTargetNodeId] = useState("router-01");
  const [connectivityResult, setConnectivityResult] = useState("");
  const [connectivityTestCount, setConnectivityTestCount] = useState(0);
  const [subnetError, setSubnetError] = useState("");
  const [gatewayError, setGatewayError] = useState("");
  const [ipError, setIpError] = useState("");

  const [nodes, setNodes, onNodesChange] =
    useNodesState(getInitialNodes());

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(getInitialEdges());

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>("pc-01");

  const nextNodeId = useRef(4);

  const selectedNode = nodes.find(
    (node) => node.id === selectedNodeId
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(connection, currentEdges)
      );
    },
    [setEdges]
  );

  function addDevice(deviceType: DeviceType) {
    const idNumber = nextNodeId.current++;
    const nodeId = `${deviceType.toLowerCase()}-${idNumber}`;
    const displayName =
      `${deviceType}-${String(idNumber).padStart(2, "0")}`;

    const description: Record<DeviceType, string> = {
      PC: "Configure IP",
      Switch: "Layer 2",
      Router: "Gateway",
    };

    const positionIndex = Math.max(0, nodes.length - 3);

    const newNode: NetworkNode = {
      id: nodeId,
      type: "device",
      position: {
        x: 60 + (positionIndex % 3) * 200,
        y: 270 + Math.floor(positionIndex / 3) * 120,
      },
      data: {
        label: `${displayName}\n${description[deviceType]}`,
        deviceType,
        ipAddress: "",
        subnetMask: "",
        defaultGateway: "",
      },
      style: deviceStyles[deviceType],
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
    setSelectedNodeId(nodeId);

    setIpError("");
    setSubnetError("");
    setGatewayError("");
    setConnectivityResult("");
    setTroubleshootingAdvice("");
  }

  function updateConfig(field: ConfigField, value: string) {
    if (!selectedNodeId) return;

    if (field === "ipAddress") {
      setIpError(
        value.trim() === "" || isValidIPv4(value)
          ? ""
          : "Invalid IPv4 address. Use four numbers between 0 and 255."
      );
    }

    if (field === "subnetMask") {
      setSubnetError(
        value.trim() === "" || isValidSubnetMask(value)
          ? ""
          : "Invalid subnet mask. Use a valid IPv4 subnet mask."
      );
    }

    if (field === "defaultGateway") {
      setGatewayError(
        value.trim() === "" || isValidIPv4(value)
          ? ""
          : "Invalid IPv4 gateway address."
      );
    }

    const currentNode = nodes.find(
      (node) => node.id === selectedNodeId
    );

    if (currentNode) {
      const ip =
        field === "ipAddress"
          ? value
          : currentNode.data.ipAddress;

      const gateway =
        field === "defaultGateway"
          ? value
          : currentNode.data.defaultGateway;

      const mask =
        field === "subnetMask"
          ? value
          : currentNode.data.subnetMask;

      if (field === "ipAddress" || field === "subnetMask") {
        setGatewayError((previous) => previous);
      }

      if (
        ip &&
        gateway &&
        mask &&
        isValidIPv4(ip) &&
        isValidIPv4(gateway) &&
        isValidSubnetMask(mask)
      ) {
        setGatewayError(
          isSameSubnet(ip, gateway, mask)
            ? ""
            : "Gateway is not in the same subnet as this device."
        );
      } else if (field === "defaultGateway" && value.trim() === "") {
        setGatewayError("");
      }
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                [field]: value,
                ...(field === "ipAddress"
                  ? {
                      label: `${node.data.label.split("\n")[0]}\n${value}`,
                    }
                  : {}),
              },
            }
          : node
      )
    );
  }

  const saveTopology = () => {
    try {
      localStorage.setItem(
        TOPOLOGY_STORAGE_KEY,
        JSON.stringify({ nodes, edges })
      );

      window.alert("Topology saved successfully!");
    } catch {
      window.alert("Unable to save topology.");
    }
  };

  const loadTopology = () => {
    const saved = getSavedTopology();

    if (!saved) {
      window.alert("No saved topology found.");
      return;
    }

    setNodes(saved.nodes);
    setEdges(saved.edges);

    setSelectedNodeId(
      saved.nodes.some((node) => node.id === selectedNodeId)
        ? selectedNodeId
        : saved.nodes[0]?.id ?? null
    );

    window.alert("Topology loaded successfully!");
  };

  const clearSavedTopology = () => {
    const confirmed = window.confirm(
      "Clear the saved topology and reset the network?"
    );

    if (!confirmed) return;

    localStorage.removeItem(TOPOLOGY_STORAGE_KEY);

    setNodes(initialNodes);
    setEdges(initialEdges);

    setSelectedNodeId("pc-01");
    setSourceNodeId("pc-01");
    setTargetNodeId("router-01");

    setConnectivityResult("");
    setTroubleshootingAdvice("");
    setIpError("");
    setSubnetError("");
    setGatewayError("");
    setActivePanel(null);

    nextNodeId.current = 4;

    window.alert("Saved topology cleared.");
  };

  const clearAllDevices = () => {
    const confirmed = window.confirm(
      "Remove ALL devices and connections, including default devices? Save or export your topology first if you need it."
    );

    if (!confirmed) return;

    setNodes([]);
    setEdges([]);

    localStorage.removeItem(TOPOLOGY_STORAGE_KEY);

    nextNodeId.current = 4;

    setSelectedNodeId(null);
    setSourceNodeId("");
    setTargetNodeId("");
    setConnectivityResult("");
    setTroubleshootingAdvice("");
    setIpError("");
    setSubnetError("");
    setGatewayError("");
    setActivePanel(null);
  };

  const exportTopology = () => {
    try {
      const topology = {
        nodes,
        edges,
        exportedAt: new Date().toISOString(),
        app: "LinkLogic",
      };

      const json = JSON.stringify(topology, null, 2);
      const blob = new Blob([json], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "linklogic-topology.json";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Topology export failed:", error);
      window.alert("Could not export the topology.");
    }
  };

  const importTopology = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("nodes" in parsed) ||
        !("edges" in parsed) ||
        !Array.isArray(parsed.nodes) ||
        !Array.isArray(parsed.edges)
      ) {
        throw new Error(
          "The file must contain nodes and edges arrays."
        );
      }

      const importedNodes = (parsed.nodes as NetworkNode[]).map(
        (node) => ({
          ...node,
          type: "device",
        })
      );

      const importedEdges = parsed.edges as Edge[];
      const validNodeIds = new Set<string>();

      for (const node of importedNodes) {
        if (
          !node ||
          typeof node.id !== "string" ||
          node.id.trim() === "" ||
          !node.position ||
          typeof node.position.x !== "number" ||
          !Number.isFinite(node.position.x) ||
          typeof node.position.y !== "number" ||
          !Number.isFinite(node.position.y) ||
          !node.data ||
          typeof node.data.label !== "string" ||
          !["PC", "Switch", "Router"].includes(
            node.data.deviceType
          ) ||
          typeof node.data.ipAddress !== "string" ||
          typeof node.data.subnetMask !== "string" ||
          typeof node.data.defaultGateway !== "string"
        ) {
          throw new Error("The file contains an invalid device.");
        }

        if (validNodeIds.has(node.id)) {
          throw new Error("The file contains duplicate device IDs.");
        }

        validNodeIds.add(node.id);
      }

      const validEdgeIds = new Set<string>();

      for (const edge of importedEdges) {
        if (
          !edge ||
          typeof edge.id !== "string" ||
          edge.id.trim() === "" ||
          typeof edge.source !== "string" ||
          typeof edge.target !== "string" ||
          !validNodeIds.has(edge.source) ||
          !validNodeIds.has(edge.target)
        ) {
          throw new Error("The file contains an invalid connection.");
        }

        if (validEdgeIds.has(edge.id)) {
          throw new Error("The file contains duplicate connection IDs.");
        }

        validEdgeIds.add(edge.id);
      }

      const nextId = Math.max(
        4,
        ...importedNodes.map((node) => {
          const match = node.id.match(/(\d+)$/);
          return match ? Number(match[1]) + 1 : 4;
        })
      );

      const topology = {
        nodes: importedNodes,
        edges: importedEdges,
      };

      localStorage.setItem(
        TOPOLOGY_STORAGE_KEY,
        JSON.stringify(topology)
      );

      setNodes(importedNodes);
      setEdges(importedEdges);

      setSelectedNodeId(importedNodes[0]?.id ?? null);
      setSourceNodeId(importedNodes[0]?.id ?? "");
      setTargetNodeId(importedNodes[1]?.id ?? "");

      setConnectivityResult("");
      setTroubleshootingAdvice("");
      setIpError("");
      setSubnetError("");
      setGatewayError("");

      nextNodeId.current = nextId;

      window.alert("Topology imported successfully!");
    } catch (error) {
      console.error("Topology import failed:", error);

      const message =
        error instanceof Error ? error.message : "Unknown error";

      window.alert(`Import failed: ${message}`);
    } finally {
      event.target.value = "";
    }
  };

  function runConnectivityTest() {
  setConnectivityTestCount((count) => count + 1);
  setTroubleshootingAdvice("");

  // Keep the existing connectivity test logic below this line.

    const source = nodes.find((node) => node.id === sourceNodeId);
    const target = nodes.find((node) => node.id === targetNodeId);

    if (!source || !target) {
      setConnectivityResult("Failed: Select two valid devices.");
      return;
    }

    if (source.id === target.id) {
      setConnectivityResult("Failed: Select two different devices.");
      setTroubleshootingAdvice(
        "Choose a different destination device and run the test again."
      );
      return;
    }

    const visited = new Set<string>();
    const queue = [source.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (visited.has(currentId)) continue;

      visited.add(currentId);

      if (currentId === target.id) break;

      for (const edge of edges) {
        if (
          edge.source === currentId &&
          !visited.has(edge.target)
        ) {
          queue.push(edge.target);
        }

        if (
          edge.target === currentId &&
          !visited.has(edge.source)
        ) {
          queue.push(edge.source);
        }
      }
    }

    const connected = visited.has(target.id);

    if (!connected) {
      setConnectivityResult(
        "Failed: No connection path exists between these devices."
      );
      setTroubleshootingAdvice(
        "Check the topology and connect the source and destination using network links."
      );
      return;
    }

    if (
      source.data.deviceType === "PC" &&
      (!isValidIPv4(source.data.ipAddress) ||
        !isValidSubnetMask(source.data.subnetMask))
    ) {
      setConnectivityResult(
        "Failed: Source PC has an invalid IP address or subnet mask."
      );
      setTroubleshootingAdvice(
        "Check the source PC's IP address and subnet mask configuration."
      );
      return;
    }

    if (
      target.data.deviceType === "PC" &&
      (!isValidIPv4(target.data.ipAddress) ||
        !isValidSubnetMask(target.data.subnetMask))
    ) {
      setConnectivityResult(
        "Failed: Destination PC has an invalid IP address or subnet mask."
      );
      setTroubleshootingAdvice(
        "Check the destination PC's IP address and subnet mask configuration."
      );
      return;
    }

    setConnectivityResult(
      `Simulation successful: A connection path exists between ${source.data.label.split("\n")[0]} and ${target.data.label.split("\n")[0]}.`
    );

    setTroubleshootingAdvice("");
  }

  const pcCount = nodes.filter(
    (node) => node.data.deviceType === "PC"
  ).length;

  const switchCount = nodes.filter(
    (node) => node.data.deviceType === "Switch"
  ).length;

  const routerCount = nodes.filter(
    (node) => node.data.deviceType === "Router"
  ).length;

  const connectedNodeIds = new Set<string>();

  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const disconnectedNodes = nodes.filter(
    (node) => !connectedNodeIds.has(node.id)
  );

  const disconnectedCount = disconnectedNodes.length;
  const totalConnections = edges.length;

  const topologyWarnings: string[] = [];

  if (nodes.length > 1 && edges.length === 0) {
    topologyWarnings.push(
      "No connections found. Connect devices to build your network."
    );
  }

  if (disconnectedCount > 0) {
    topologyWarnings.push(
      `${disconnectedCount} device(s) are not connected to any link.`
    );
  }

  if (nodes.length === 0) {
    topologyWarnings.push(
      "Your topology is empty. Add a device to get started."
    );
  }

  const configurationReport = nodes.map((node) => {
    const ipAddress = node.data.ipAddress?.trim() ?? "";
    const subnetMask = node.data.subnetMask?.trim() ?? "";
    const defaultGateway = node.data.defaultGateway?.trim() ?? "";

    const warnings: string[] = [];

    if (!ipAddress) warnings.push("IP address missing");
    if (!subnetMask) warnings.push("Subnet mask missing");

    if (!defaultGateway && node.data.deviceType === "PC") {
      warnings.push("Default gateway not configured");
    }

    return {
      deviceId: node.id,
      deviceName: node.data.label,
      deviceType: node.data.deviceType,
      ipAddress: ipAddress || "Not configured",
      subnetMask: subnetMask || "Not configured",
      defaultGateway: defaultGateway || "Not configured",
      status: warnings.length === 0 ? "Complete" : "Incomplete",
      warnings,
    };
  });

  const incompleteConfigurationCount = configurationReport.filter(
    (device) => device.status === "Incomplete"
  ).length;

  const exportConfigurationReport = (format: "txt" | "json") => {
    const report = {
      project: "LinkLogic",
      reportType: "Network Configuration Report",
      generatedAt: new Date().toISOString(),
      totalDevices: configurationReport.length,
      incompleteDevices: incompleteConfigurationCount,
      devices: configurationReport,
    };

    const content =
      format === "json"
        ? JSON.stringify(report, null, 2)
        : [
            "LinkLogic - Network Configuration Report",
            `Generated: ${report.generatedAt}`,
            `Total devices: ${report.totalDevices}`,
            `Incomplete configurations: ${report.incompleteDevices}`,
            "",
            ...configurationReport.flatMap((device) => [
              `Device: ${device.deviceName}`,
              `Type: ${device.deviceType}`,
              `IP Address: ${device.ipAddress}`,
              `Subnet Mask: ${device.subnetMask}`,
              `Default Gateway: ${device.defaultGateway}`,
              `Status: ${device.status}`,
              `Warnings: ${
                device.warnings.length > 0
                  ? device.warnings.join(", ")
                  : "None"
              }`,
              "",
            ]),
          ].join("\n");

    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `linklogic-configuration-report.${format}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const day15ConfiguredIPs = nodes
    .map((node) => ({
      id: node.id,
      name: node.data.label,
      deviceType: node.data.deviceType,
      ipAddress: node.data.ipAddress?.trim() ?? "",
    }))
    .filter(
      (device) =>
        device.ipAddress !== "" &&
        device.ipAddress.toLowerCase() !== "not configured"
    );

  const day15IPGroups = new Map<string, typeof day15ConfiguredIPs>();

  day15ConfiguredIPs.forEach((device) => {
    const group = day15IPGroups.get(device.ipAddress) ?? [];
    group.push(device);
    day15IPGroups.set(device.ipAddress, group);
  });

  const day15DuplicateIPGroups = Array.from(day15IPGroups.entries())
    .filter(([, devices]) => devices.length > 1)
    .map(([ipAddress, devices]) => ({
      ipAddress,
      devices,
    }));

  const day15DuplicateDeviceIds = new Set(
    day15DuplicateIPGroups.flatMap((group) =>
      group.devices.map((device) => device.id)
    )
  );

  const day15InvalidConfigurationCount = nodes.filter((node) => {
    const ip = node.data.ipAddress?.trim() ?? "";
    const mask = node.data.subnetMask?.trim() ?? "";
    const gateway = node.data.defaultGateway?.trim() ?? "";

    return (
      !ip ||
      !mask ||
      (node.data.deviceType === "PC" && !gateway)
    );
  }).length;

  const day15ValidationIssueCount =
    day15DuplicateIPGroups.length +
    day15InvalidConfigurationCount;

  const day15ValidationStatus =
    day15ValidationIssueCount === 0
      ? "No issues detected"
      : "Issues detected";

      const detectedIssueCount =
  incompleteConfigurationCount +
  day15DuplicateIPGroups.length +
  disconnectedCount;

useEffect(() => {
  onDiagnosticsChange({
    networkDevices: nodes.length,
    connectivityTests: connectivityTestCount,
    detectedIssues: detectedIssueCount,
    lastConnectivityResult: connectivityResult,
  });
}, [
  nodes.length,
  edges.length,
  connectivityTestCount,
  connectivityResult,
  detectedIssueCount,
  onDiagnosticsChange,
]);

  return (
    <div className="topology-editor">
     <div className="workspace-toolbar">
  <div className="topology-toolbar">
    <span className="toolbar-label">Add device:</span>

    <button type="button" onClick={() => addDevice("PC")}>
      <span aria-hidden="true">▣</span> PC
    </button>

    <button type="button" onClick={() => addDevice("Switch")}>
      <span aria-hidden="true">⇄</span> Switch
    </button>

    <button type="button" onClick={() => addDevice("Router")}>
      <span aria-hidden="true">◎</span> Router
    </button>
  </div>

  <div className="workspace-tools">
    <span className="toolbar-label">Workspace tools:</span>

    <button
      type="button"
      onClick={() => setActivePanel("settings")}
    >
      <span aria-hidden="true">⚙</span>
      Device Settings
    </button>

    <button
      type="button"
      onClick={() => setActivePanel("summary")}
    >
      <span aria-hidden="true">▦</span>
      Network Summary
    </button>

    <button
      type="button"
      onClick={() => setActivePanel("report")}
    >
      <span aria-hidden="true">▤</span>
      Configuration Report
    </button>

    <button
      type="button"
      onClick={() => setActivePanel("quality")}
    >
      <span aria-hidden="true">✓</span>
      Quality Check
    </button>
  </div>
</div>

      <section
        className="device-config"
        hidden={activePanel !== "settings"}
      >
        <div className="config-heading">
          <div>
            <p className="section-kicker">DEVICE SETTINGS</p>
            <h3>Configuration panel</h3>

            <button
              type="button"
              onClick={() => setActivePanel(null)}
            >
              Close Panel
            </button>
          </div>

          <span className="small-label">
            {selectedNode
              ? selectedNode.data.deviceType
              : "No device selected"}
          </span>
        </div>

        {selectedNode ? (
          <>
            <p className="config-hint">
              Select a device on the canvas to edit its settings.
            </p>

            <section className="device-config connectivity-panel">
              <div className="config-heading">
                <div>
                  <p className="section-kicker">NETWORK TOOLS</p>
                  <h3>Connectivity Test</h3>
                </div>
              </div>

              <label className="config-field">
                <span>Source Device</span>
                <select
                  value={sourceNodeId}
                  onChange={(event) => {
                    setSourceNodeId(event.target.value);
                    setConnectivityResult("");
                    setTroubleshootingAdvice("");
                  }}
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.data.label.split("\n")[0]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="config-field">
                <span>Destination Device</span>
                <select
                  value={targetNodeId}
                  onChange={(event) => {
                    setTargetNodeId(event.target.value);
                    setConnectivityResult("");
                    setTroubleshootingAdvice("");
                  }}
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.data.label.split("\n")[0]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="topology-actions">
                <button type="button" onClick={saveTopology}>
                  Save Topology
                </button>

                <button type="button" onClick={loadTopology}>
                  Load Topology
                </button>

                <button type="button" onClick={clearSavedTopology}>
                  Clear Saved Topology
                </button>

                <button type="button" onClick={clearAllDevices}>
                  Clear All Devices
                </button>

                <button type="button" onClick={exportTopology}>
                  Export Topology
                </button>

                <button
                  type="button"
                  onClick={() => importFileInputRef.current?.click()}
                >
                  Import Topology
                </button>

                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={importTopology}
                  style={{ display: "none" }}
                />
              </div>

              <button type="button" onClick={runConnectivityTest}>
                Run Connectivity Test
              </button>

              {connectivityResult && (
                <p className="config-hint" role="status">
                  {connectivityResult}
                </p>
              )}

              {troubleshootingAdvice && (
                <p className="config-hint" role="status">
                  Troubleshooting tip: {troubleshootingAdvice}
                </p>
              )}
            </section>

            <label className="config-field">
              <span>IP Address</span>
              <input
                type="text"
                value={selectedNode.data.ipAddress}
                placeholder="e.g. 192.168.1.10"
                aria-invalid={ipError !== ""}
                aria-describedby={
                  ipError ? "ip-address-error" : undefined
                }
                onChange={(event) =>
                  updateConfig("ipAddress", event.currentTarget.value)
                }
              />

              {ipError && (
                <span
                  id="ip-address-error"
                  className="config-error"
                  role="alert"
                >
                  {ipError}
                </span>
              )}
            </label>

            <label className="config-field">
              <span>Subnet Mask</span>
              <input
                type="text"
                value={selectedNode.data.subnetMask}
                placeholder="e.g. 255.255.255.0"
                onChange={(event) =>
                  updateConfig("subnetMask", event.target.value)
                }
              />

              {subnetError && (
                <span className="config-error" role="alert">
                  {subnetError}
                </span>
              )}
            </label>

            <label className="config-field">
              <span>Default Gateway</span>
              <input
                type="text"
                value={selectedNode.data.defaultGateway}
                placeholder="e.g. 192.168.1.1"
                onChange={(event) =>
                  updateConfig("defaultGateway", event.target.value)
                }
              />

              {gatewayError && (
                <span className="config-error" role="alert">
                  {gatewayError}
                </span>
              )}
            </label>
          </>
        ) : (
          <p className="config-hint">
            Click a device on the canvas to configure it.
          </p>
        )}
      </section>

      <section
        className="network-summary"
        hidden={activePanel !== "summary"}
      >
        <h3>Network Summary</h3>

        <button
          type="button"
          onClick={() => setActivePanel(null)}
        >
          Close Panel
        </button>

        <div className="network-summary-grid">
          <div className="summary-card">
            <span>Total Devices</span>
            <strong>{nodes.length}</strong>
          </div>

          <div className="summary-card">
            <span>PCs</span>
            <strong>{pcCount}</strong>
          </div>

          <div className="summary-card">
            <span>Switches</span>
            <strong>{switchCount}</strong>
          </div>

          <div className="summary-card">
            <span>Routers</span>
            <strong>{routerCount}</strong>
          </div>

          <div className="summary-card">
            <span>Connections</span>
            <strong>{totalConnections}</strong>
          </div>

          <div className="summary-card">
            <span>Unconnected Devices</span>
            <strong>{disconnectedCount}</strong>
          </div>
        </div>

        <div className="topology-warnings">
          <h4>Topology Checks</h4>

          {topologyWarnings.length === 0 ? (
            <p>No basic topology warnings detected.</p>
          ) : (
            <ul>
              {topologyWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          {disconnectedNodes.length > 0 && (
            <p>
              Unconnected devices:{" "}
              {disconnectedNodes
                .map((node) => node.data.label)
                .join(", ")}
            </p>
          )}
        </div>
      </section>

      <section
        className="configuration-report"
        hidden={activePanel !== "report"}
      >
        <h3>Network Configuration Report</h3>

        <button
          type="button"
          onClick={() => setActivePanel(null)}
        >
          Close Panel
        </button>

        <p>Total devices: {configurationReport.length}</p>

        <p>
          Incomplete configurations: {incompleteConfigurationCount}
        </p>

        <div className="configuration-report-actions">
          <button
            type="button"
            onClick={() => exportConfigurationReport("txt")}
          >
            Export TXT Report
          </button>

          <button
            type="button"
            onClick={() => exportConfigurationReport("json")}
          >
            Export JSON Report
          </button>
        </div>

        {configurationReport.length === 0 ? (
          <p>No devices available. Add devices to generate a report.</p>
        ) : (
          <div className="configuration-report-table-wrapper">
            <table className="configuration-report-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Type</th>
                  <th>IP Address</th>
                  <th>Subnet Mask</th>
                  <th>Default Gateway</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {configurationReport.map((device) => (
                  <tr key={device.deviceId}>
                    <td>{device.deviceName}</td>
                    <td>{device.deviceType}</td>
                    <td>{device.ipAddress}</td>
                    <td>{device.subnetMask}</td>
                    <td>{device.defaultGateway}</td>
                    <td>
                      {device.status}

                      {day15DuplicateDeviceIds.has(device.deviceId) && (
                        <p>Warning: Duplicate IP address</p>
                      )}

                      {device.warnings.length > 0 && (
                        <ul>
                          {device.warnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className="day15-validation"
        hidden={activePanel !== "quality"}
      >
        <h3>Configuration Quality Check</h3>

        <button
          type="button"
          onClick={() => setActivePanel(null)}
        >
          Close Panel
        </button>

        <p>
          Status: <strong>{day15ValidationStatus}</strong>
        </p>

        <p>
          Devices with incomplete configurations:{" "}
          {day15InvalidConfigurationCount}
        </p>

        <p>
          Duplicate IP groups: {day15DuplicateIPGroups.length}
        </p>

        {day15DuplicateIPGroups.length > 0 && (
          <div>
            <h4>Duplicate IP Address Warnings</h4>

            <ul>
              {day15DuplicateIPGroups.map((group) => (
                <li key={group.ipAddress}>
                  IP address {group.ipAddress} is used by:{" "}
                  {group.devices
                    .map((device) => device.name)
                    .join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {day15InvalidConfigurationCount > 0 && (
          <p>
            Some devices have missing IP configuration values.
            Review the device settings and configuration report.
          </p>
        )}

        {day15ValidationIssueCount === 0 && (
          <p>
            No duplicate IP groups or missing required values detected.
          </p>
        )}
      </section>

      <div className="interactive-topology">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setActivePanel("settings");
            setIpError("");
            setSubnetError("");
            setGatewayError("");
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.4}
          maxZoom={1.8}
          deleteKeyCode={null}
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default TopologyCanvas;
