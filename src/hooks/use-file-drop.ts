import { useEffect, useRef, useState, type DragEvent } from 'react';

const carriesFiles = (e: DragEvent | globalThis.DragEvent) =>
  e.dataTransfer?.types.includes('Files') ?? false;

/**
 * Make an element a target for files dragged in from the OS. Targets nest:
 * the innermost one under the pointer takes the drop and is the only one
 * highlighted. Drags that carry no files (text, in-app) pass through.
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  // dragenter/dragleave fire for every child crossed, so count them.
  const depth = useRef(0);
  const props = {
    onDragEnter: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      depth.current++;
      setOver(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.stopPropagation();
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    },
    onDrop: (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      depth.current = 0;
      setOver(false);
      onFiles([...e.dataTransfer.files]);
    },
  };
  return { over, props };
}

/**
 * Cancel the browser's default for file drops outside any target. Without it,
 * a missed drop opens the file in the tab and the document is lost.
 */
export function useWindowDropGuard() {
  useEffect(() => {
    const guard = (e: globalThis.DragEvent) => {
      if (carriesFiles(e)) e.preventDefault();
    };
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', guard);
    return () => {
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', guard);
    };
  }, []);
}
