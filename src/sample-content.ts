// Hardcoded sample blocks for the engine spike. Long enough to force the flow
// engine to split text across multiple panels/pages and to exercise atomic
// media placement. This is NOT the real content model — just fodder to fold.

const lorem = (n: number) =>
  Array.from({ length: n })
    .map(
      () =>
        "We packed the truck before dawn and drove north along the coast, stopping " +
        "wherever a hand-painted sign promised pie or a view. The fog burned off by " +
        "ten and the whole bay went silver. I had forgotten how loud a quiet place " +
        "can be once you stop filling it with a phone."
    )
    .join(" ");

export const sampleContentHTML = `
<div class="nl-content">

  <header class="nl-nameplate">
    <p class="title">The Ledgerline Letter</p>
    <p class="dateline">Vol. I &mdash; No. 6 &nbsp;&bull;&nbsp; June 2026 &nbsp;&bull;&nbsp; Printed at Home</p>
  </header>

  <article class="nl-article">
    <h2 class="headline">A Long Drive Up the Coast, and What I Found There</h2>
    <p class="byline">By the Editor &mdash; Reporting from Mile Marker 142</p>
    <p class="lede">${lorem(2)}</p>
    <p>${lorem(2)}</p>
    <blockquote class="pull">&ldquo;You can&rsquo;t mail a feeling, but you can mail a letter, and it turns out that&rsquo;s nearly the same thing.&rdquo;</blockquote>
    <p>${lorem(3)}</p>
    <h3 class="subhead">On Leaving the Feed Behind</h3>
    <p>${lorem(3)}</p>
    <p>${lorem(2)}</p>
  </article>

  <figure class="nl-media nl-photo">
    <div class="frame"><div class="nl-halftone"></div></div>
    <figcaption>Above: the bay at low tide. (Halftone is a placeholder for the real B&amp;W treatment.)</figcaption>
  </figure>

  <section class="nl-advice">
    <h2 class="dept">Ask the Editor</h2>
    <p class="q">Q. Aunt Carol asks: are you eating real meals out there?</p>
    <p class="a">A. Define &ldquo;meal.&rdquo; Define &ldquo;real.&rdquo; I had a very serious sandwich on Tuesday and I stand by it.</p>
    <p class="q">Q. My nephew asks: why a paper newsletter?</p>
    <p class="a">A. Because you are holding it, and that is the entire point.</p>
  </section>

  <article class="nl-article">
    <h2 class="headline">The Garden Is Mostly Weeds, Thank You for Asking</h2>
    <p class="lede">${lorem(2)}</p>
    <p>${lorem(2)}</p>
  </article>

  <aside class="nl-media nl-ad">
    <div class="box">
      <p class="kicker">A Word From Our Sponsor</p>
      <p class="product">DR. PUTNAM&rsquo;S TONIC</p>
      <p class="tag">Cures gloom, fog, and an excess of opinions. Two spoonfuls nightly.</p>
    </div>
  </aside>

  <figure class="nl-media nl-puzzle">
    <div class="frame"><div class="nl-halftone" style="height:2.2in"></div></div>
    <p class="cap">This Month&rsquo;s Crossword &mdash; answers next issue.</p>
  </figure>

</div>
`;
