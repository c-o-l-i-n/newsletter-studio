import { useEffect } from "react";
import { EditorView } from "./views/editor";

export default function App() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = (e: MediaQueryListEvent) =>
      document.documentElement.classList.toggle("dark", e.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return <EditorView />;
}
