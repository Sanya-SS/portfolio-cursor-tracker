import { useCallback } from "react";
import CharacterCanvas from "./CharacterCanvas";
import CustomCursor from "./CustomCursor";
import Hero from "./Hero";

export default function App() {
  // The canvas reports cursor state each frame; currently the DOM cursor reads
  // the pointer directly, so this is a no-op hook kept for extensibility.
  const handleCursorState = useCallback(() => {}, []);

  return (
    <main className="hero">
      <CharacterCanvas onCursorState={handleCursorState} />
      <Hero />
      <CustomCursor />
    </main>
  );
}
