
import StatusBadge from "./StatusBadge";

function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="#about" aria-label="LinkLogic home">
        <span className="brand-mark">L</span>
        <span>LinkLogic</span>
      </a>

      <nav className="nav-links" aria-label="Main navigation">
        <a href="#features">Features</a>
        <a href="#workspace">Workspace</a>
        <a href="#about">About</a>
      </nav>

      <StatusBadge label="Frontend online" />
    </header>
  );
}

export default Header;
