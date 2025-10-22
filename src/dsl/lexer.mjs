const compiler = await import('./compiler.mjs');
const parser = import('./parser.mjs');

const TOKEN_SPEC = [
  ['DIRECTIVE', /@[A-Za-z_][\w-]*/y],
  ['BACKTICK', /`/y],
  ['NEWLINE', /\n/y],
  ['COMMENT', /::[^\n]*/y],
  ['SPREAD', /\.{3}/y],
  ['INDENT', /:?>+/y],
  ['SEPARATOR', /\|/y],
  ['PLUS', /\+/y],
  ['HASH', /#[\w-]+/y],
  ['PAREN_OPEN', /\(/y],
  ['PAREN_CLOSE', /\)/y],
  ['NUMBER_UNIT', /\d+(\.\d+)?(\/\d+)?[a-z%]+/y],
  ['NUMBER', /\d+(\.\d+)?/y],
  ['IDENT', /[A-Za-z_][\w-]*/y],
  ['WHITESPACE', /[ \t]+/y],
  ['UNKNOWN', /./y],
];

function lexer(input) {
  const tokens = [];
  let pos = 0;

  while (pos < input.length) {
    let match = null;

    for (let [type, regex] of TOKEN_SPEC) {
      regex.lastIndex = pos;
      const result = regex.exec(input);
      if (result) {
        const value = result[0];
        tokens.push({ type, value });
        pos += value.length;
        match = true;
        break;
      }
    }

    if (!match) {
      throw new SyntaxError(`Unrecognized token at position ${pos}: '${input[pos]}'`);
    }
  }

  return tokens;
}

export default lexer;