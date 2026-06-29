import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Block,
  BlockPatch,
  BlockType,
  Newsletter,
  NewsletterSettings,
  Publication,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types/newsletter';
import { FORMATS } from '@/utils/formats.ts';
import { makeBlock } from '@/utils/make-block.ts';
import { clearImages } from '@/services/image-store.ts';
import {
  clearCrashCache,
  downloadNewsletter,
  hasCrashCache,
  isAbortError,
  isFileSystemAccessSupported,
  openNewsletterFile,
  pickNewsletterFile,
  readCrashCache,
  readNewsletterFromHandle,
  saveNewsletterAs,
  writeCrashCache,
  writeToHandle,
} from '@/services/file-io.ts';
import { newId } from '@/utils/ids.ts';
import { emptyDoc } from '@/utils/tiptap.ts';
import { putImageWithId } from '@/services/image-store.ts';
import seedCrosswordImageUrl from '@/assets/crossword.webp?url';
import seedZuccImageUrl from '@/assets/zucc.webp?url';
import { EditorUI, type SaveState, type PendingAction } from './editor.ui';
import type { PreviewStats } from './components/preview';

const SEED_CROSSWORD_IMAGE = 'seed-crossword-image';
const SEED_ZUCC_IMAGE = 'seed-zucc-image';

function loadSeedImages(onLoaded: () => void): void {
  const load = (url: string, id: string) =>
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        putImageWithId(id, blob);
        onLoaded();
      })
      .catch(console.error);
  void load(seedCrosswordImageUrl, SEED_CROSSWORD_IMAGE);
  void load(seedZuccImageUrl, SEED_ZUCC_IMAGE);
}

const CURRENT_MONTH_AND_YEAR = new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

const seed: Newsletter = {
  publication: {
    name: 'Newsletter Studio',
    location: 'Your Town',
    issueLabel: 'Iss. I, Vol. 1',
    date: CURRENT_MONTH_AND_YEAR,
  },
  settings: DEFAULT_SETTINGS,
  blocks: [
    {
      id: newId(),
      type: 'article',
      headline: 'Welcome to Newsletter Studio',
      byline: 'Your Desktop Print Shop',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Newsletter Studio',
              },
              {
                type: 'text',
                text: " is a desktop app for writing and printing personal newsletters that you can physically mail, pass out during lunch, or slip under a friend's door.",
              },
            ],
          },
          {
            type: 'heading',
            attrs: {
              level: 2,
            },
            content: [
              {
                type: 'text',
                text: 'What to put in it',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: "The best newsletters don't take themselves too seriously. Write about how many bunnies you saw during your last walk, or about something weird your cat did. Add photos, memes, an advice column, book recommendations, or even a homemade crossword puzzle.",
              },
            ],
          },
        ],
      },
    },
    {
      id: newId(),
      type: 'imageset',
      images: [
        {
          id: 'imgmqy4p5a52',
          imageId: 'seed-crossword-image',
          caption:
            'A crossword puzzle I made by keyboard mashing on crosswordlabs.com',
          border: 'single',
        },
      ],
    },
    {
      id: newId(),
      type: 'article',
      headline: 'Reclaim your relationships',
      byline: 'Connect in the real world',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'The social media apps that were supposed to connect us have made us lonelier than ever. Big Tech harvests our attention, feeds us doom and ragebait, and sells our personal data to advertisers all in an attempt to pump their stock prices and CEO salaries.',
              },
            ],
          },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: "We don't need Big Tech to connect with our loved ones.",
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Writing, printing, and delivering a personal newsletter lets you reclaim your relationships in the real world, without Big Brother or Big Tech.',
              },
            ],
          },
        ],
      },
    },
    {
      id: newId(),
      type: 'imageset',
      images: [
        {
          id: 'imgmqy4p5a55',
          imageId: 'seed-zucc-image',
          caption: '',
          border: 'none',
        },
      ],
    },
    {
      id: newId(),
      type: 'article',
      headline: 'Focus on writing rather than design',
      byline: '',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This app deliberately has very few customization options. The whole point is to let you easily write your newsletter so you can get back to living your life. No need to stress over design, font choice, layout, or figuring out how to print each page.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Start by editing the ',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Publication Name',
              },
              {
                type: 'text',
                text: ' and ',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Location',
              },
              {
                type: 'text',
                text: ' in the left panel. I love a good alliteration, like ',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'italic',
                  },
                ],
                text: 'The Colin Chronicles',
              },
              {
                type: 'text',
                text: '. Add blocks for text (',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Article',
              },
              {
                type: 'text',
                text: ') and photos (',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Image Set',
              },
              {
                type: 'text',
                text: '), and hit ',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Print',
              },
              {
                type: 'text',
                text: " when you're done.",
              },
            ],
          },
        ],
      },
    },
    {
      id: newId(),
      type: 'article',
      headline: 'Install this app onto your computer',
      byline: 'For a nicer experience',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'For the best offline, distraction-free experience, I recommend opening this app in Google Chrome (or even better - Brave, which is like Chrome but with better data privacy), and clicking the ',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Install',
              },
              {
                type: 'text',
                text: ' button. This saves the app to your computer for offline use.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Be sure to click the ',
              },
              {
                type: 'text',
                marks: [
                  {
                    type: 'bold',
                  },
                ],
                text: 'Save',
              },
              {
                type: 'text',
                text: ' button when you start to save the file to your computer. The app will then auto-save updates as you go. Happy writing!',
              },
            ],
          },
        ],
      },
    },
  ],
};

// Silence unused-import warnings: emptyDoc is used by makeBlock transitively,
// but tiptap must be imported before the editor renders. This re-export keeps
// the import live without lint complaints.
void emptyDoc;

export function EditorView() {
  const [nl, setNl] = useState<Newsletter>(seed);
  const formatId = nl.settings.formatId;
  const [zoom, setZoom] = useState(0.7);
  const [imageRevision, setImageRevision] = useState(0);
  const [stats, setStats] = useState<PreviewStats>({
    pageCount: 0,
    overset: 0,
    busy: false,
  });

  // ---- persistence ----
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const handleRef = useRef<FileSystemFileHandle | null>(null);
  const firstRun = useRef(true);
  const suppressDirty = useRef(false);
  const fsaSupported = isFileSystemAccessSupported();

  // Autosave: debounce changes → crash cache always, and to the open file if
  // one is attached. Programmatic loads set suppressDirty to avoid a redundant
  // write-back marking a freshly-loaded doc dirty.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (suppressDirty.current) {
      suppressDirty.current = false;
      setSaveState(handleRef.current ? 'saved' : 'dirty');
      return;
    }
    setSaveState('dirty');
    const t = setTimeout(async () => {
      try {
        await writeCrashCache(nl);
        if (handleRef.current) {
          setSaveState('saving');
          await writeToHandle(handleRef.current, nl);
          setSaveState('saved');
        }
      } catch (e) {
        console.error(e);
        setSaveState('error');
      }
    }, 800);
    return () => clearTimeout(t);
  }, [nl]);

  // Load seed images async; bump imageRevision so the preview memo re-runs.
  useEffect(() => {
    loadSeedImages(() => setImageRevision((v) => v + 1));
  }, []);

  // On first load, show a dialog to restore an OPFS crash snapshot if present.
  useEffect(() => {
    (async () => {
      if (!(await hasCrashCache())) return;
      const cached = await readCrashCache();
      if (cached) {
        setPendingAction({ type: 'restore-crash', cache: cached });
      } else {
        await clearCrashCache();
      }
    })();
  }, []);

  const doNew = useCallback(async () => {
    clearImages();
    handleRef.current = null;
    setFileName(null);
    suppressDirty.current = true;
    setNl((prev) => ({ ...prev, blocks: [] }));
    await clearCrashCache();
  }, []);

  const doOpen = useCallback(async () => {
    try {
      if (isFileSystemAccessSupported()) {
        const { newsletter, handle, name } = await openNewsletterFile();
        handleRef.current = handle;
        setFileName(name);
        suppressDirty.current = true;
        setNl(newsletter);
      } else {
        const res = await pickNewsletterFile();
        if (!res) return;
        handleRef.current = null;
        setFileName(res.name);
        suppressDirty.current = true;
        setNl(res.newsletter);
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.error(e);
        alert(`Could not open file: ${(e as Error).message}`);
      }
    }
  }, []);

  // Open a file the OS handed us (double-clicked .newsletter → file handler).
  const doOpenHandle = useCallback(async (handle: FileSystemFileHandle) => {
    try {
      const { newsletter, name } = await readNewsletterFromHandle(handle);
      handleRef.current = handle;
      setFileName(name);
      suppressDirty.current = true;
      setNl(newsletter);
    } catch (e) {
      console.error(e);
      alert(`Could not open file: ${(e as Error).message}`);
    }
  }, []);

  // File Handling API: receive files when launched via a double-clicked file.
  useEffect(() => {
    window.launchQueue?.setConsumer((params) => {
      const handle = params.files[0];
      if (handle) void doOpenHandle(handle);
    });
  }, [doOpenHandle]);

  const onNew = useCallback(() => {
    if (saveState !== 'saved') {
      setPendingAction({ type: 'new' });
    } else {
      void doNew();
    }
  }, [saveState, doNew]);

  const onOpen = useCallback(() => {
    if (saveState !== 'saved') {
      setPendingAction({ type: 'open' });
    } else {
      void doOpen();
    }
  }, [saveState, doOpen]);

  const onSave = useCallback(async () => {
    try {
      if (handleRef.current) {
        setSaveState('saving');
        await writeToHandle(handleRef.current, nl);
        setSaveState('saved');
      } else if (fsaSupported) {
        const { handle, name } = await saveNewsletterAs(nl);
        handleRef.current = handle;
        setFileName(name);
        setSaveState('saved');
      } else {
        const name = await downloadNewsletter(nl);
        setFileName(name);
        setSaveState('saved');
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.error(e);
        setSaveState('error');
      }
    }
  }, [nl, fsaSupported]);

  const onConfirmPending = useCallback(async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === 'new') {
      await doNew();
    } else if (action.type === 'open') {
      await doOpen();
    } else if (action.type === 'restore-crash') {
      suppressDirty.current = true;
      setNl(action.cache);
    }
  }, [pendingAction, doNew, doOpen]);

  const onCancelPending = useCallback(async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === 'restore-crash') {
      await clearCrashCache();
      // Re-load seed images using the current setter — the useEffect closure
      // may be stale after HMR, but useCallback deps are always fresh.
      loadSeedImages(() => setImageRevision((v) => v + 1));
    }
  }, [pendingAction]);

  const onPublication = useCallback(
    (patch: Partial<Publication>) =>
      setNl((nl) => ({ ...nl, publication: { ...nl.publication, ...patch } })),
    [],
  );
  const onSettings = useCallback(
    (patch: Partial<NewsletterSettings>) =>
      setNl((nl) => ({ ...nl, settings: { ...nl.settings, ...patch } })),
    [],
  );
  const onAdd = useCallback(
    (type: BlockType) =>
      setNl((nl) => ({ ...nl, blocks: [...nl.blocks, makeBlock(type)] })),
    [],
  );
  const onUpdate = useCallback(
    (id: string, patch: BlockPatch) =>
      setNl((nl) => ({
        ...nl,
        blocks: nl.blocks.map((b) =>
          b.id === id ? ({ ...b, ...patch } as Block) : b,
        ),
      })),
    [],
  );
  const onRemove = useCallback(
    (id: string) =>
      setNl((nl) => ({ ...nl, blocks: nl.blocks.filter((b) => b.id !== id) })),
    [],
  );
  const onMove = useCallback(
    (id: string, dir: -1 | 1) =>
      setNl((nl) => {
        const i = nl.blocks.findIndex((b) => b.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= nl.blocks.length) return nl;
        const blocks = [...nl.blocks];
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        return { ...nl, blocks };
      }),
    [],
  );

  const onZoomIn = useCallback(
    () => setZoom((z) => Math.min(1, +(z + 0.1).toFixed(2))),
    [],
  );
  const onZoomOut = useCallback(
    () => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2))),
    [],
  );
  const onZoomReset = useCallback(() => setZoom(0.7), []);

  const onSaveAs = useCallback(async () => {
    if (!fsaSupported) {
      void onSave();
      return;
    }
    try {
      const { handle, name } = await saveNewsletterAs(nl);
      handleRef.current = handle;
      setFileName(name);
      setSaveState('saved');
    } catch (e) {
      if (!isAbortError(e)) {
        console.error(e);
        setSaveState('error');
      }
    }
  }, [nl, fsaSupported, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNew();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        onOpen();
      } else if ((e.key === 's' || e.key === 'S') && e.shiftKey) {
        e.preventDefault();
        void onSaveAs();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        void onSave();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        onZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        onZoomReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNew, onOpen, onSave, onSaveAs, onZoomIn, onZoomOut, onZoomReset]);

  const fmt = FORMATS[formatId];

  const fullness =
    fmt.capacity == null
      ? `${stats.pageCount} page${stats.pageCount === 1 ? '' : 's'}`
      : `${Math.min(stats.pageCount, fmt.capacity)}/${fmt.capacity} panels`;

  return (
    <EditorUI
      newsletter={nl}
      formatId={formatId}
      zoom={zoom}
      stats={stats}
      fileName={fileName}
      saveState={saveState}
      fsaSupported={fsaSupported}
      hasSaveHandle={handleRef.current !== null}
      imposeOpts={{ backReversed: false, rotateBack: false }}
      fullness={fullness}
      pendingAction={pendingAction}
      onFormatChange={(id) => onSettings({ formatId: id })}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onNew={onNew}
      onOpen={onOpen}
      onSave={onSave}
      onPublication={onPublication}
      onSettings={onSettings}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onMove={onMove}
      onStats={setStats}
      onConfirmPending={onConfirmPending}
      onCancelPending={onCancelPending}
      imageRevision={imageRevision}
    />
  );
}
