import { Fragment, type ReactNode } from "react";

// Markdown tối giản cho note: "## heading", "- bullet", **đậm**, *nghiêng*.
// Render ra React element (không dùng innerHTML) nên an toàn với nội dung GV nhập.

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(
      tok.startsWith("**") ? <strong key={k++}>{tok.slice(2, -2)}</strong> : <em key={k++}>{tok.slice(1, -1)}</em>,
    );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={key++}>
        {list.map((l, i) => (
          <li key={i}>{inline(l)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    blocks.push(<p key={key++}>{inline(para.join(" "))}</p>);
    para = [];
  };

  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (/^[-*] /.test(line)) {
      flushPara();
      list.push(line.slice(2));
    } else if (!line.trim()) {
      flushList();
      flushPara();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="prose-note space-y-2">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
