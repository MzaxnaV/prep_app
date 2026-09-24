import { Link } from 'react-router-dom';

/**
 * Renders a section of timeline.md without a markdown library.
 *
 * This is deliberately not a markdown implementation — it handles only the
 * constructs that file actually uses, and treats anything else as plain text.
 * If timeline.md ever grows a construct that isn't here, it degrades to a
 * paragraph rather than breaking.
 *
 * Blocks:  tables · bullet lists · numbered lists · blockquotes · h4 · paragraphs
 * Inline:  **bold** · ~~struck~~ · *italic* · `code` · [text](url)
 *
 * Strikethrough matters more than usual here: superseded decisions in the plan
 * are struck rather than deleted, and that history is the point.
 */

const INLINE =
  /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*)/g;

function Inline({ text }) {
  if (!text) return null;
  const parts = text.split(INLINE).filter(Boolean);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return (
        <del key={i} className="line-through text-muted-foreground/40">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-[11px] px-1 py-0.5 rounded bg-muted text-foreground/80">
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const cls = 'text-emerald-500 hover:underline underline-offset-2 font-medium';
      // A bare path is a route in this app — route it, don't reload the page.
      if (href.startsWith('/')) {
        return <Link key={i} to={href} className={cls}>{label}</Link>;
      }
      return (
        <a
          key={i}
          href={href}
          target={href.startsWith('#') ? undefined : '_blank'}
          rel="noreferrer"
          className={cls}
        >
          {label}
        </a>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const isTableRow = l => l.trimStart().startsWith('|');
const isDivider = l => /^\|[\s|:-]+\|$/.test(l.trim());
const bulletOf = l => l.match(/^\s*[-*]\s+(.*)$/);
const numberOf = l => l.match(/^\s*\d+\.\s+(.*)$/);
const isContinuation = l => /^\s{2,}\S/.test(l);

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

/** Group the raw lines into renderable blocks. */
function toBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (isTableRow(line)) {
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isDivider(lines[i])) rows.push(splitRow(lines[i]));
        i++;
      }
      const [head, ...body] = rows;
      blocks.push({ type: 'table', head, body });
      continue;
    }

    const h4 = line.match(/^####\s+(.*)$/);
    if (h4) { blocks.push({ type: 'h4', text: h4[1] }); i++; continue; }

    if (line.trimStart().startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quote.push(lines[i].trimStart().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: quote.join(' ').trim() });
      continue;
    }

    if (bulletOf(line) || numberOf(line)) {
      const ordered = !!numberOf(line);
      const items = [];
      while (i < lines.length) {
        const m = ordered ? numberOf(lines[i]) : bulletOf(lines[i]);
        if (m) {
          items.push(m[1]);
        } else if (items.length && isContinuation(lines[i])) {
          // Wrapped continuation of the item above — rejoin it.
          items[items.length - 1] += ' ' + lines[i].trim();
        } else {
          break;
        }
        i++;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }

    // Paragraph: timeline.md hard-wraps at ~110 columns, so consecutive
    // non-blank lines are one paragraph and rejoin with a space.
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isTableRow(lines[i]) &&
      !bulletOf(lines[i]) &&
      !numberOf(lines[i]) &&
      !lines[i].startsWith('####') &&
      !lines[i].trimStart().startsWith('> ')
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }

  return blocks;
}

export default function PlanBody({ text }) {
  if (!text) return null;

  return (
    <div className="space-y-3">
      {toBlocks(text).map((b, i) => {
        switch (b.type) {
          case 'h4':
            return (
              <h4 key={i} className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">
                <Inline text={b.text} />
              </h4>
            );

          case 'quote': {
            // A blockquote opening with → is a pointer to the page that owns
            // this data — timeline.md keeps the reasoning, the app keeps the
            // table. Give those a distinct look so they don't read as prose.
            const pointer = b.text.trimStart().startsWith('→');
            if (pointer) {
              return (
                <div
                  key={i}
                  className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 px-4 py-3"
                >
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <Inline text={b.text.replace(/^\s*→\s*/, '')} />
                  </p>
                </div>
              );
            }
            return (
              <blockquote key={i} className="border-l-2 border-accent/50 pl-4 py-0.5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <Inline text={b.text} />
                </p>
              </blockquote>
            );
          }

          case 'ul':
          case 'ol':
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <span className="text-muted-foreground/50 shrink-0 font-mono text-xs pt-0.5">
                      {b.type === 'ol' ? `${j + 1}.` : '·'}
                    </span>
                    <span className="min-w-0"><Inline text={item} /></span>
                  </li>
                ))}
              </ul>
            );

          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      {b.head.map((cell, j) => (
                        <th
                          key={j}
                          className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground border-b border-border whitespace-nowrap"
                        >
                          <Inline text={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.body.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="px-3 py-2 text-xs align-top text-foreground/85 border-b border-border/40 last:[&]:border-b"
                          >
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return (
              <p key={i} className="text-sm leading-relaxed text-foreground/85">
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
