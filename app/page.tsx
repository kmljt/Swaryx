import Piano from "./components/Piano";

export default function Page() {
  return (
    <main className="page">
      <div className="title-section">
        <div className="title-logo">
          <div className="logo-circle"></div>
        </div>
        <h1 className="title-mono">WARYX.</h1>
      </div>
      <Piano />
    </main>
  );
}