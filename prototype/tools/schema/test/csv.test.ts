import { describe, it, expect } from 'vitest';
import { CsvError, cmpStr, formatCsv, parseCsv, readCsvTable, writeCsvTable } from '../csv.ts';

const fields = (text: string) => parseCsv(text).map((r) => r.fields);

describe('RFC 4180 reader', () => {
  it('reads plain records with LF, CRLF and CR line ends, with or without a final break', () => {
    expect(fields('a,b\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
    expect(fields('a,b\r\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(fields('a,b\r1,2\r')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('keeps empty fields, including a trailing one', () => {
    expect(fields(',a,\n')).toEqual([['', 'a', '']]);
    expect(fields('a,')).toEqual([['a', '']]);
  });
  it('reads quoted fields with commas, doubled quotes and line breaks', () => {
    expect(fields('"a,b","say ""hi""","line1\nline2",x\n')).toEqual([['a,b', 'say "hi"', 'line1\nline2', 'x']]);
    expect(fields('"",""""\n')).toEqual([['', '"']]);
    expect(fields('"a\r\nb",c')).toEqual([['a\r\nb', 'c']]);
  });
  it('reports the starting line of each record', () => {
    const recs = parseCsv('h\n"multi\nline"\nnext\n');
    expect(recs.map((r) => r.line)).toEqual([1, 2, 4]);
  });
  it('ignores a byte-order mark', () => {
    expect(fields('﻿a,b\n')).toEqual([['a', 'b']]);
  });
  it('rejects malformed quoting with the line number', () => {
    expect(() => parseCsv('a\n"open')).toThrow(CsvError);
    expect(() => parseCsv('a\n"open')).toThrow(/line 2: unterminated/);
    expect(() => parseCsv('a,b"c\n')).toThrow(/double quote inside an unquoted field/);
    expect(() => parseCsv('"a"b,c\n')).toThrow(/after a closing quote/);
  });
  it('returns nothing for empty text', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('RFC 4180 writer', () => {
  it('quotes only where needed and round-trips', () => {
    const rows = [['id', 'text'], ['1', 'plain'], ['2', 'a,b'], ['3', 'say "hi"'], ['4', 'x\ny'], ['5', ' padded '], ['6', '']];
    const text = formatCsv(rows);
    expect(text).toBe('id,text\n1,plain\n2,"a,b"\n3,"say ""hi"""\n4,"x\ny"\n5," padded "\n6,\n');
    expect(fields(text)).toEqual(rows);
  });
  it('round-trips arbitrary printable and control text', () => {
    const tricky = ['', ',', '"', '""', '\n', '\r\n', 'a"b', '〃', '—', '  ', 'x,y\nz'];
    const rows = [tricky, [...tricky].reverse()];
    expect(fields(formatCsv(rows))).toEqual(rows);
  });
});

describe('header tables', () => {
  it('reads objects, skips blank lines and reports field-count mismatches', () => {
    const t = readCsvTable('a,b\n1,2\n\n3\n4,5\n');
    expect(t.header).toEqual(['a', 'b']);
    expect(t.rows.map((r) => r.values)).toEqual([{ a: '1', b: '2' }, { a: '4', b: '5' }]);
    expect(t.problems).toEqual([{ line: 4, message: '1 fields, header has 2' }]);
  });
  it('reports duplicate column names', () => {
    expect(readCsvTable('a,a\n1,2\n').problems[0]!.message).toMatch(/duplicate column/);
  });
  it('writes objects under a header', () => {
    expect(writeCsvTable(['a', 'b'], [{ a: '1' }, { a: 'x,y', b: '2' }])).toBe('a,b\n1,\n"x,y",2\n');
  });
  it('compares strings by code unit', () => {
    expect(['b', 'B', 'a', 'é'].sort(cmpStr)).toEqual(['B', 'a', 'b', 'é']);
  });
});
