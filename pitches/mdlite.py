#!/usr/bin/env python3
"""Minimal Markdown -> HTML for the committee's pitch files (headings, paragraphs, bullet/numbered lists,
tables, bold/italic/code, hr). No external dependencies. Output is a fragment, not a page."""
import re, html

def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", s)
    return s

def convert(md, shift=0):
    """shift: add to heading levels (e.g. shift=1 turns # into h2)."""
    out, i, lines = [], 0, md.splitlines()
    def flush_para(buf):
        if buf:
            out.append("<p>" + inline(" ".join(x.strip() for x in buf)) + "</p>")
    para = []
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            flush_para(para); para = []; i += 1; continue
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            flush_para(para); para = []
            lvl = min(6, len(m.group(1)) + shift)
            out.append(f"<h{lvl}>{inline(m.group(2).strip())}</h{lvl}>"); i += 1; continue
        if re.match(r"^\s*(-{3,}|\*{3,})\s*$", line):
            flush_para(para); para = []; out.append("<hr>"); i += 1; continue
        if line.lstrip().startswith("|"):
            flush_para(para); para = []
            rows = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            rows = [r for r in rows if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
            if rows:
                out.append("<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in rows[0]) + "</tr></thead><tbody>" +
                           "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows[1:]) + "</tbody></table>")
            continue
        m = re.match(r"^(\s*)([-*]|\d+[.)])\s+(.*)$", line)
        if m:
            flush_para(para); para = []
            tag = "ol" if m.group(2)[0].isdigit() else "ul"
            items = []
            while i < len(lines):
                mm = re.match(r"^(\s*)([-*]|\d+[.)])\s+(.*)$", lines[i])
                if mm and len(mm.group(1)) == len(m.group(1)):
                    items.append(mm.group(3)); i += 1
                elif lines[i].startswith(" " * (len(m.group(1)) + 2)) and lines[i].strip() and not re.match(r"^\s*([-*]|\d+[.)])\s+", lines[i]):
                    items[-1] += " " + lines[i].strip(); i += 1
                else:
                    break
            out.append(f"<{tag}>" + "".join(f"<li>{inline(it)}</li>" for it in items) + f"</{tag}>")
            continue
        para.append(line); i += 1
    flush_para(para)
    return "\n".join(out)

if __name__ == "__main__":
    import sys
    print(convert(open(sys.argv[1], encoding="utf-8").read()))
