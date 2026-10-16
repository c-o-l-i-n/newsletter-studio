#!/usr/bin/env bun
// Verification driver for Newsletter Studio. One "run" = one Vite dev server on
// its own port + one Bun daemon that owns a headless Chromium (Playwright
// persistent context, throwaway profile). CLI subcommands talk to the daemon
// over HTTP so browser state survives between shell calls.
//
// Usage: .claude/skills/verify/scripts/ns <command> [flags]   (see SKILL.md)

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import type { BrowserContext, Locator, Page } from 'playwright';

const REPO = path.resolve(import.meta.dir, '../../../..');
const RUNS_DIR = '/tmp/ns-verify/runs';
const EVIDENCE_ROOT = '/tmp/ns-verify-evidence';

type FsMode = 'native' | 'fallback' | 'stub';
interface RunState {
  run: string;
  repo: string;
  gitHead: string;
  fsMode: FsMode;
  prod: boolean;
  headed: boolean;
  viewport: { width: number; height: number };
  appPort: number;
  appUrl: string;
  vitePid: number;
  daemonPort: number;
  daemonPid: number;
  runDir: string;
  profileDir: string;
  evidenceDir: string;
  startedAt: string;
}

// ---------------------------------------------------------------- arg parsing

type Flags = Record<string, string | true>;
function parseArgs(argv: string[]): { pos: string[]; flags: Flags } {
  const pos: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
    } else pos.push(a);
  }
  return { pos, flags };
}
const str = (f: Flags, k: string): string | undefined =>
  typeof f[k] === 'string' ? (f[k] as string) : undefined;

function die(msg: string, code = 1): never {
  console.error(`ns: ${msg}`);
  process.exit(code);
}

// ---------------------------------------------------------------- run state

const stateFile = (run: string) => path.join(RUNS_DIR, run, 'state.json');
function readState(run: string): RunState | null {
  try {
    return JSON.parse(fs.readFileSync(stateFile(run), 'utf8'));
  } catch {
    return null;
  }
}
function allRuns(): RunState[] {
  if (!fs.existsSync(RUNS_DIR)) return [];
  return fs
    .readdirSync(RUNS_DIR)
    .map(readState)
    .filter((s): s is RunState => s !== null);
}
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** Pick the run: --run flag, then $NS_RUN, then the only live run. */
function resolveRun(flags: Flags): RunState {
  const want = str(flags, 'run') ?? process.env.NS_RUN;
  if (want) {
    const s = readState(want);
    if (!s) die(`no run "${want}" under ${RUNS_DIR}`);
    return s;
  }
  const runs = allRuns();
  if (runs.length === 0) die('no runs. Start one with `ns up`.');
  if (runs.length > 1)
    die(
      `several runs exist (${runs.map((r) => r.run).join(', ')}). Pass --run <id> or set NS_RUN.`,
    );
  return runs[0];
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitFor(
  what: string,
  check: () => Promise<boolean>,
  timeoutMs: number,
): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await check().catch(() => false)) return;
    await Bun.sleep(250);
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${what}`);
}

// ---------------------------------------------------------------- daemon

// File System Access modes. Headless Chromium has FSA, but its pickers reject
// immediately with AbortError, so "native" can never save or open a file.
//  - fallback: remove the FSA pickers, so the app takes its real non-FSA path
//    (the one Brave users get): Save = download, Open = <input type=file>.
//  - stub: replace only the OS picker dialog with OPFS-backed handles under
//    OPFS dir "verify-picker". Everything after the picker is the real app.
const INIT_SCRIPTS: Record<FsMode, string | null> = {
  native: null,
  fallback: `
    for (const k of ['showSaveFilePicker', 'showOpenFilePicker']) {
      try { delete Window.prototype[k]; } catch {}
      try { delete window[k]; } catch {}
    }`,
  stub: `
    (() => {
      const dir = async () =>
        (await navigator.storage.getDirectory()).getDirectoryHandle('verify-picker', { create: true });
      window.showSaveFilePicker = async (opts) =>
        (await dir()).getFileHandle((opts && opts.suggestedName) || 'untitled.newsletter', { create: true });
      window.showOpenFilePicker = async () => {
        const name = sessionStorage.getItem('ns-verify.pick');
        if (!name) throw new DOMException('ns: no file picked (run ns pick <name>)', 'AbortError');
        sessionStorage.removeItem('ns-verify.pick');
        return [await (await dir()).getFileHandle(name)];
      };
    })();`,
};

function locate(page: Page, a: Flags): Locator {
  const exact = a.exact === true;
  let root: Page | Locator = page;
  const within = str(a, 'in');
  if (within) root = page.locator(within);
  let loc: Locator;
  if (str(a, 'role'))
    loc = root.getByRole(str(a, 'role') as Parameters<Page['getByRole']>[0], {
      name: str(a, 'name'),
      exact,
    });
  else if (str(a, 'label')) loc = root.getByLabel(str(a, 'label')!, { exact });
  else if (str(a, 'placeholder'))
    loc = root.getByPlaceholder(str(a, 'placeholder')!, { exact });
  else if (str(a, 'title')) loc = root.getByTitle(str(a, 'title')!, { exact });
  else if (str(a, 'text')) loc = root.getByText(str(a, 'text')!, { exact });
  else if (str(a, 'css')) loc = root.locator(str(a, 'css')!);
  else
    throw new Error(
      'need a locator: --role/--name, --label, --placeholder, --title, --text, or --css',
    );
  const nth = str(a, 'nth');
  return nth !== undefined ? loc.nth(Number(nth)) : loc;
}

async function serve(run: string): Promise<void> {
  const st = readState(run);
  if (!st) throw new Error(`no state for ${run}`);
  const { chromium } = await import('playwright');
  const consoleLog = fs.createWriteStream(
    path.join(st.evidenceDir, 'console.ndjson'),
    { flags: 'a' },
  );
  const logLine = (o: object) =>
    consoleLog.write(
      JSON.stringify({ t: new Date().toISOString(), ...o }) + '\n',
    );

  const ctx: BrowserContext = await chromium.launchPersistentContext(
    st.profileDir,
    {
      headless: !st.headed,
      viewport: st.viewport,
      acceptDownloads: true,
    },
  );
  const init = INIT_SCRIPTS[st.fsMode];
  if (init) await ctx.addInitScript(init);
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  let pageErrors = 0;
  page.on('console', (m) => logLine({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => {
    pageErrors++;
    logLine({ type: 'pageerror', text: String(e) });
  });
  await page.goto(st.appUrl);

  const ev = (name: string) => {
    const p = path.isAbsolute(name) ? name : path.join(st.evidenceDir, name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    return p;
  };

  const ops: Record<string, (a: Flags, pos: string[]) => Promise<unknown>> = {
    health: async () => ({
      url: page.url(),
      title: await page.title(),
      appRendered: await page
        .getByRole('button', { name: 'Print / PDF' })
        .isVisible(),
      fsaInWindow: await page.evaluate(() => 'showSaveFilePicker' in window),
      fsMode: st.fsMode,
      serviceWorkers: ctx.serviceWorkers().length,
      pageErrors,
    }),
    goto: async (a) => {
      await page.goto(str(a, 'url') ?? st.appUrl);
      return page.url();
    },
    reload: async () => {
      await page.reload();
      return page.url();
    },
    click: async (a) => {
      await locate(page, a).click({ timeout: 10_000 });
      return 'clicked';
    },
    fill: async (a) => {
      await locate(page, a).fill(str(a, 'value') ?? '', { timeout: 10_000 });
      return 'filled';
    },
    type: async (a) => {
      const loc = locate(page, a);
      await loc.click({ timeout: 10_000 });
      // Document end: Cmd+ArrowDown on macOS (Cmd+End is a no-op there).
      if (a.end)
        await page.keyboard.press(
          process.platform === 'darwin' ? 'Meta+ArrowDown' : 'Control+End',
        );
      await page.keyboard.type(str(a, 'value') ?? '');
      return 'typed';
    },
    press: async (_a, pos) => {
      for (const k of pos) await page.keyboard.press(k);
      return `pressed ${pos.join(' ')}`;
    },
    select: async (a) => {
      await locate(page, a).click({ timeout: 10_000 });
      await page
        .getByRole('option', { name: str(a, 'option'), exact: true })
        .click({ timeout: 10_000 });
      return `selected ${str(a, 'option')}`;
    },
    upload: async (a) => {
      const files = (str(a, 'file') ?? '').split(',').filter(Boolean);
      if (!files.length) throw new Error('upload needs --file <path[,path]>');
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10_000 }),
        locate(page, a).click({ timeout: 10_000 }),
      ]);
      await chooser.setFiles(files.map((f) => path.resolve(f)));
      return `uploaded ${files.join(', ')}`;
    },
    download: async (a) => {
      const keys = str(a, 'press');
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        keys
          ? page.keyboard.press(keys)
          : locate(page, a).click({ timeout: 10_000 }),
      ]);
      const out = ev(str(a, 'save') ?? `downloads/${dl.suggestedFilename()}`);
      await dl.saveAs(out);
      return { suggestedFilename: dl.suggestedFilename(), savedTo: out };
    },
    text: async (a) => locate(page, a).innerText({ timeout: 10_000 }),
    value: async (a) => locate(page, a).inputValue({ timeout: 10_000 }),
    count: async (a) => locate(page, a).count(),
    wait: async (a) => {
      await locate(page, a).waitFor({
        state: (str(a, 'state') as 'visible') ?? 'visible',
        timeout: Number(str(a, 'timeout') ?? 15_000),
      });
      return 'ok';
    },
    // Preview flow is debounced 350ms and autosave 800ms, so "flowing…" and
    // "saving…" appear late. Wait past both, then for the status to clear.
    settle: async () => {
      await Bun.sleep(900);
      const bar = page.locator('header.titlebar');
      await page.waitForFunction(
        () =>
          !/flowing…|saving…/.test(
            document.querySelector('header.titlebar')?.textContent ?? '',
          ),
        null,
        { timeout: 30_000 },
      );
      return (await bar.innerText()).replace(/\s*\n\s*/g, ' | ');
    },
    snapshot: async (a, pos) => {
      const target =
        str(a, 'role') || str(a, 'css') || str(a, 'label')
          ? locate(page, a)
          : page.locator('body');
      const snap = await target.ariaSnapshot();
      if (pos[0]) fs.writeFileSync(ev(`${pos[0]}.aria.txt`), snap);
      return snap;
    },
    shot: async (a, pos) => {
      if (!pos[0]) throw new Error('shot needs a name');
      const out = ev(`${pos[0]}.png`);
      if (str(a, 'role') || str(a, 'css') || str(a, 'label'))
        await locate(page, a).screenshot({ path: out });
      else await page.screenshot({ path: out, fullPage: a.full === true });
      return out;
    },
    pdf: async (_a, pos) => {
      if (!pos[0]) throw new Error('pdf needs a name');
      if (st.headed) throw new Error('pdf needs a headless run');
      const out = ev(`${pos[0]}.pdf`);
      await page.pdf({
        path: out,
        preferCSSPageSize: true,
        printBackground: true,
      });
      return out;
    },
    eval: async (_a, pos) => page.evaluate(pos.join(' ')),
    pick: async (a) => {
      if (st.fsMode !== 'stub')
        throw new Error('pick only works with --fs stub');
      const name = str(a, 'name');
      const host = str(a, 'file');
      if (host) {
        const b64 = fs.readFileSync(path.resolve(host)).toString('base64');
        const base = name ?? path.basename(host);
        await page.evaluate(
          async ([n, data]) => {
            const root = await navigator.storage.getDirectory();
            const d = await root.getDirectoryHandle('verify-picker', {
              create: true,
            });
            const w = await (
              await d.getFileHandle(n, { create: true })
            ).createWritable();
            await w.write(Uint8Array.from(atob(data), (c) => c.charCodeAt(0)));
            await w.close();
          },
          [base, b64] as const,
        );
        await page.evaluate(
          (n) => sessionStorage.setItem('ns-verify.pick', n),
          base,
        );
        return `next Open picks ${base} (imported from ${host})`;
      }
      if (!name)
        throw new Error('pick needs --name <opfs file> or --file <host path>');
      await page.evaluate(
        (n) => sessionStorage.setItem('ns-verify.pick', n),
        name,
      );
      return `next Open picks ${name}`;
    },
    'opfs-ls': async () =>
      page.evaluate(async () => {
        const out: { path: string; size: number }[] = [];
        const walk = async (d: FileSystemDirectoryHandle, pre: string) => {
          // @ts-expect-error entries() exists in Chromium
          for await (const [n, h] of d.entries()) {
            if (h.kind === 'file')
              out.push({ path: pre + n, size: (await h.getFile()).size });
            else await walk(h, pre + n + '/');
          }
        };
        await walk(await navigator.storage.getDirectory(), '');
        return out;
      }),
    'opfs-get': async (a, pos) => {
      const src = pos[0];
      if (!src) throw new Error('opfs-get needs an OPFS path');
      const b64 = await page.evaluate(async (p) => {
        let d = await navigator.storage.getDirectory();
        const parts = p.split('/');
        for (const part of parts.slice(0, -1))
          d = await d.getDirectoryHandle(part);
        const f = await (await d.getFileHandle(parts.at(-1)!)).getFile();
        const bytes = new Uint8Array(await f.arrayBuffer());
        let s = '';
        for (const b of bytes) s += String.fromCharCode(b);
        return btoa(s);
      }, src);
      const out = ev(str(a, 'save') ?? `opfs/${src}`);
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      return out;
    },
  };

  // Serialize commands so two shell calls never interleave on the page.
  let chain: Promise<unknown> = Promise.resolve();
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: st.daemonPort,
    async fetch(req) {
      const { op, flags, pos } = (await req.json()) as {
        op: string;
        flags: Flags;
        pos: string[];
      };
      if (op === 'shutdown') {
        setTimeout(async () => {
          await ctx.close().catch(() => {});
          consoleLog.end();
          server.stop();
          process.exit(0);
        }, 50);
        return Response.json({ ok: true, result: 'shutting down' });
      }
      const fn = ops[op];
      if (!fn) return Response.json({ ok: false, error: `unknown op ${op}` });
      const job = chain.then(() => fn(flags, pos));
      chain = job.catch(() => {});
      try {
        return Response.json({ ok: true, result: await job });
      } catch (e) {
        return Response.json({ ok: false, error: (e as Error).message });
      }
    },
  });
  console.log(`daemon ready on ${st.daemonPort}`);
}

async function call(st: RunState, op: string, flags: Flags, pos: string[]) {
  const res = await fetch(`http://127.0.0.1:${st.daemonPort}/`, {
    method: 'POST',
    body: JSON.stringify({ op, flags, pos }),
  });
  return (await res.json()) as {
    ok: boolean;
    result?: unknown;
    error?: string;
  };
}

// ---------------------------------------------------------------- lifecycle

function spawnDetached(cmd: string, args: string[], cwd: string, log: string) {
  const fd = fs.openSync(log, 'a');
  const child = spawn(cmd, args, {
    cwd,
    detached: true, // own process group, so `down` can kill exactly what we started
    stdio: ['ignore', fd, fd],
  });
  child.unref();
  return child.pid!;
}

async function up(flags: Flags) {
  const fsMode = (str(flags, 'fs') ?? 'native') as FsMode;
  if (!(fsMode in INIT_SCRIPTS)) die(`--fs must be native, fallback, or stub`);
  const [w, h] = (str(flags, 'viewport') ?? '1440x900').split('x').map(Number);
  const run =
    str(flags, 'run') ??
    `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 6)}`;
  if (readState(run)) die(`run ${run} already exists`);
  if (!fs.existsSync(path.join(REPO, 'node_modules')))
    die(`no node_modules in ${REPO}. Run \`bun install\` there first.`);

  const runDir = path.join(RUNS_DIR, run);
  const evidenceDir = path.join(EVIDENCE_ROOT, run);
  fs.mkdirSync(path.join(runDir, 'profile'), { recursive: true });
  fs.mkdirSync(evidenceDir, { recursive: true });

  const appPort = await freePort();
  const daemonPort = await freePort();
  const gitHead = spawnSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'])
    .stdout.toString()
    .trim();
  // --prod: production build into the run dir, served by `vite preview`. No
  // StrictMode double effects, and the PWA service worker registers.
  const prod = flags.prod === true;
  const distDir = path.join(runDir, 'dist');
  if (prod) {
    const log = fs.openSync(path.join(evidenceDir, 'build.log'), 'a');
    const b = spawnSync(
      'bunx',
      ['vite', 'build', '--outDir', distDir, '--emptyOutDir'],
      {
        cwd: REPO,
        stdio: ['ignore', log, log],
      },
    );
    if (b.status !== 0) {
      fs.rmSync(runDir, { recursive: true, force: true });
      die(`vite build failed, see ${evidenceDir}/build.log`);
    }
  }
  const serveArgs = [
    '--port',
    String(appPort),
    '--strictPort',
    '--host',
    '127.0.0.1',
  ];
  const vitePid = spawnDetached(
    'bunx',
    prod
      ? ['vite', 'preview', '--outDir', distDir, ...serveArgs]
      : ['vite', ...serveArgs],
    REPO,
    path.join(runDir, 'vite.log'),
  );
  const st: RunState = {
    run,
    repo: REPO,
    gitHead,
    fsMode,
    prod,
    headed: flags.headed === true,
    viewport: { width: w, height: h },
    appPort,
    appUrl: `http://127.0.0.1:${appPort}/`,
    vitePid,
    daemonPort,
    daemonPid: 0,
    runDir,
    profileDir: path.join(runDir, 'profile'),
    evidenceDir,
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(stateFile(run), JSON.stringify(st, null, 2));

  try {
    await waitFor('vite', async () => (await fetch(st.appUrl)).ok, 30_000);
    st.daemonPid = spawnDetached(
      'bun',
      [import.meta.path, 'serve', '--run', run],
      REPO,
      path.join(runDir, 'daemon.log'),
    );
    fs.writeFileSync(stateFile(run), JSON.stringify(st, null, 2));
    await waitFor(
      'app to render in Chromium',
      async () => {
        const r = await call(st, 'health', {}, []);
        return r.ok && (r.result as { appRendered: boolean }).appRendered;
      },
      45_000,
    );
  } catch (e) {
    console.error(`ns: up failed: ${(e as Error).message}`);
    console.error(`logs: ${runDir}/vite.log, ${runDir}/daemon.log`);
    console.error(`clean up with: ns down --run ${run}`);
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        run,
        appUrl: st.appUrl,
        fsMode,
        build: prod ? 'prod' : 'dev',
        evidenceDir,
        hint: `export NS_RUN=${run}`,
      },
      null,
      2,
    ),
  );
}

function listeningPids(port: number): number[] {
  const out = spawnSync('lsof', [
    '-t',
    `-iTCP:${port}`,
    '-sTCP:LISTEN',
  ]).stdout.toString();
  return out.split('\n').filter(Boolean).map(Number);
}
const pgidOf = (pid: number) =>
  Number(
    spawnSync('ps', ['-o', 'pgid=', '-p', String(pid)])
      .stdout.toString()
      .trim(),
  );

async function doctor(flags: Flags) {
  const st = resolveRun(flags);
  const checks: [string, boolean, string][] = [];
  const add = (name: string, ok: boolean, detail = '') =>
    checks.push([name, ok, detail]);

  add('vite process alive', alive(st.vitePid), `pid ${st.vitePid}`);
  const owners = listeningPids(st.appPort);
  add(
    'app port owned by this run',
    owners.length > 0 && owners.every((p) => pgidOf(p) === st.vitePid),
    `port ${st.appPort} listeners ${owners.join(',') || 'none'}`,
  );
  let html = '';
  try {
    html = await (await fetch(st.appUrl)).text();
  } catch {}
  add(
    'app serves Newsletter Studio',
    html.includes('<title>Newsletter Studio</title>'),
    st.appUrl,
  );
  add('served from this checkout', st.repo === REPO, st.repo);
  const head = spawnSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'])
    .stdout.toString()
    .trim();
  add(
    'git HEAD unchanged since up',
    head === st.gitHead,
    `up=${st.gitHead} now=${head}`,
  );
  add('daemon process alive', alive(st.daemonPid), `pid ${st.daemonPid}`);
  let health: Record<string, unknown> | null = null;
  try {
    const r = await call(st, 'health', {}, []);
    if (r.ok) health = r.result as Record<string, unknown>;
  } catch {}
  add('daemon answers', health !== null, `port ${st.daemonPort}`);
  if (health) {
    add(
      "page is on this run's app",
      String(health.url).startsWith(st.appUrl),
      String(health.url),
    );
    add('app rendered (Print / PDF visible)', health.appRendered === true);
    const wantFsa = st.fsMode !== 'fallback';
    add(
      `fs mode ${st.fsMode} in effect`,
      health.fsaInWindow === wantFsa,
      `showSaveFilePicker in window = ${health.fsaInWindow}`,
    );
    add(
      'no uncaught page errors',
      health.pageErrors === 0,
      `${health.pageErrors} (see ${st.evidenceDir}/console.ndjson)`,
    );
  }
  for (const [name, ok, detail] of checks)
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`,
    );
  console.log(
    `run ${st.run}  build=${st.prod ? 'prod' : 'dev'}  fs=${st.fsMode}  evidence=${st.evidenceDir}`,
  );
  process.exit(checks.every((c) => c[1]) ? 0 : 1);
}

async function down(flags: Flags) {
  const st = resolveRun(flags);
  try {
    await call(st, 'shutdown', {}, []);
    await waitFor('daemon exit', async () => !alive(st.daemonPid), 10_000);
  } catch {}
  const killGroup = (pid: number) => {
    if (!pid) return;
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {}
  };
  killGroup(st.daemonPid);
  killGroup(st.vitePid);
  // Chromium launched by the daemon: match on this run's unique profile path.
  const strays = spawnSync('pgrep', ['-f', st.profileDir])
    .stdout.toString()
    .split('\n')
    .filter(Boolean);
  for (const p of strays) {
    try {
      process.kill(Number(p), 'SIGTERM');
    } catch {}
  }
  await waitFor(
    'app port to close',
    async () => listeningPids(st.appPort).length === 0,
    10_000,
  ).catch(() => console.error(`ns: port ${st.appPort} still listening`));
  // Keep the logs with the evidence, then drop the run's scratch state.
  fs.mkdirSync(path.join(st.evidenceDir, 'logs'), { recursive: true });
  for (const f of ['vite.log', 'daemon.log', 'state.json'])
    if (fs.existsSync(path.join(st.runDir, f)))
      fs.copyFileSync(
        path.join(st.runDir, f),
        path.join(st.evidenceDir, 'logs', f),
      );
  fs.rmSync(st.runDir, { recursive: true, force: true });
  console.log(`stopped run ${st.run}. evidence kept at ${st.evidenceDir}`);
}

// ---------------------------------------------------------------- main

const [cmd, ...rest] = process.argv.slice(2);
const { pos, flags } = parseArgs(rest);
switch (cmd) {
  case 'up':
    await up(flags);
    break;
  case 'serve':
    await serve(str(flags, 'run')!);
    break;
  case 'doctor':
    await doctor(flags);
    break;
  case 'down':
    await down(flags);
    break;
  case 'list':
    for (const s of allRuns())
      console.log(
        `${s.run}  ${s.appUrl}  ${s.prod ? 'prod' : 'dev'}  fs=${s.fsMode}  vite=${alive(s.vitePid) ? 'up' : 'dead'}  daemon=${alive(s.daemonPid) ? 'up' : 'dead'}`,
      );
    break;
  case undefined:
  case 'help':
    console.log(
      fs
        .readFileSync(path.join(import.meta.dir, '..', 'SKILL.md'), 'utf8')
        .split('## Drive')[1]
        ?.split('\n## ')[0] ?? '',
    );
    break;
  default: {
    const st = resolveRun(flags);
    const r = await call(st, cmd, flags, pos).catch((e) =>
      die(`daemon unreachable: ${e.message}. Run ns doctor.`),
    );
    if (!r.ok) die(r.error ?? 'failed');
    console.log(
      typeof r.result === 'string'
        ? r.result
        : JSON.stringify(r.result, null, 2),
    );
  }
}
