import Piano from "./components/Piano";

export default function Page() {
  return (
    <main style={{ textAlign: "center", paddingTop: "40px" }}>
      <h1>🎹 Raag Piano</h1>
      <p>2 Octaves • Sustain • Rich Audio</p>
      <Piano />
    </main>
  );
}