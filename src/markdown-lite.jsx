import { Fragment } from "react";

/** Minimal inline markdown tokenizer: **bold**, *italic*, `code`.
 * Builds React nodes only — AI output is never injected as HTML. */
function renderInline(text, keyPrefix) {
  const nodes = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g;
  let last = 0;
  let match;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("**"))
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`"))
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    else nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Block-level markdown: paragraphs, -/* bullets, numbered lists, #..### and
 * > quote lines. Unknown syntax falls through as plain paragraph text. */
export function MarkdownLite({ text }) {
  const lines = String(text ?? "").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null; // { ordered, items }
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "), `p${blocks.length}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`l-${blocks.length}`}>
        {list.items.map((item, index) => <li key={index}>{renderInline(item, `l${blocks.length}-${index}`)}</li>)}
      </Tag>,
    );
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.、]\s+(.*)$/);
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
    } else if (ordered) {
      flushParagraph();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(ordered[1]);
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <p className="md-heading" key={`h-${blocks.length}`}>
          {renderInline(heading[2], `h${blocks.length}`)}
        </p>,
      );
    } else if (quote) {
      flushParagraph();
      flushList();
      blocks.push(
        <p className="md-quote" key={`q-${blocks.length}`}>
          {renderInline(quote[1], `q${blocks.length}`)}
        </p>,
      );
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return <Fragment>{blocks}</Fragment>;
}
