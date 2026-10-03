import { describe, it, expect } from 'vitest';
import { escapeForScript, escapeJson, fillTemplate, toFragment } from '../bundle-game.ts';

describe('single-file bundling', () => {
  it('escapes script and JSON payloads so they cannot close their tags', () => {
    expect(escapeForScript('a</script>b<!--c')).toBe('a<\\/script>b<\\!--c');
    expect(escapeJson('{"x":"</script>"}')).toBe('{"x":"\\u003c/script>"}');
  });
  it('fills slots literally, without $ replacement patterns', () => {
    const html = fillTemplate('<style><!--STYLE--></style><!--DATA--><!--SCRIPT--><!--BUILD_ID-->', { css: 'a{}', data: '{"a":1}', js: "x='$&$1'", buildId: 'b1' });
    expect(html).toBe(`<style>a{}</style>{"a":1}x='$&$1'b1`);
  });
  it('makes a publishable fragment with the title first', () => {
    const frag = toFragment('<html><head>\n<meta charset="utf-8">\n<meta name="viewport" content="x">\n<title>T</title>\n<style>s</style>\n</head><body>\n<div id="app"></div>\n</body></html>');
    expect(frag.startsWith('<title>T</title>')).toBe(true);
    expect(frag).toContain('<div id="app"></div>');
    expect(frag).not.toContain('charset');
  });
});
