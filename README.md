# LinkLogic - Network Design & Troubleshooting Simulator

LinkLogic is an interactive web application for designing network topologies, configuring network devices, testing connectivity, and identifying common networking configuration issues.

The project combines networking concepts with full-stack development skills to create a practical virtual networking lab.

## Features

- **Interactive Network Topology:** Add and arrange network devices on a visual canvas.
- **Network Devices:** Work with PCs, switches, and routers.
- **Device Configuration:** Configure IPv4 addresses, subnet masks, and default gateways.
- **Connectivity Testing:** Test connectivity between selected devices.
- **Troubleshooting Guidance:** View guidance when connectivity tests fail or configuration problems are detected.
- **Live Diagnostic Overview:** Monitor device counts, connectivity test counts, and detected issues.
- **Network Validation:** Identify invalid configurations, duplicate IP addresses, and disconnected devices.
- **Save and Load:** Save and restore network topologies.
- **Import and Export:** Import and export supported topology data.

## Technology Stack

- React
- TypeScript
- Vite
- React Flow (`@xyflow/react`)
- CSS
- Node.js and npm development tools

## Getting Started

### Prerequisites

Install Node.js and npm on your computer.

### Installation

1. Clone this repository:

   ```bash
git clone https://github.com/sandunidilrukshi/LinkLogic.git   ```

2. Navigate to the frontend directory:

   ```bash
   cd LinkLogic/frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in the terminal in your web browser.

## Build and Quality Checks

Run the production build:

```bash
npm run build
```

Run the project's lint checks:

```bash
npm run lint
```

## How to Use

1. Open the LinkLogic workspace.
2. Add network devices to the topology canvas.
3. Select a device and configure its network settings.
4. Connect devices to create a network topology.
5. Select source and destination devices and run a connectivity test.
6. Review the diagnostic overview and troubleshooting guidance.
7. Save, load, import, or export your topology as needed.

## Screenshots

Screenshots of the application and its main features will be added here.

Suggested screenshots:
- Main workspace and topology canvas
- Device configuration panel
- Successful connectivity test
- Failed connectivity test and troubleshooting guidance
- Live diagnostic overview
- Network validation results

## Project Purpose

LinkLogic is a networking and web development portfolio project. It demonstrates practical application of network topology concepts, IPv4 configuration, connectivity testing, and troubleshooting through an interactive user interface.

## Current Status

The project includes interactive topology design, device configuration, connectivity testing, diagnostic reporting, and topology save/load and import/export features.

## Author

Created as a networking and web development portfolio project.
