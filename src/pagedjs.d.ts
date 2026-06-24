declare module "pagedjs" {
  /** Minimal typing for the bits of Paged.js the spike uses. */
  export class Previewer {
    constructor();
    preview(
      content: string | Node,
      stylesheets: Array<string | Record<string, string>>,
      renderTo: HTMLElement
    ): Promise<{ total: number; pages: unknown[] }>;
  }
}
