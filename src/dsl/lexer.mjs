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

// const tokens = lexer(
// '@bg-location`assets @a`hello world` @scroll\n' +
// '  Code | h 1.5hw (code-field.png)bg #id :: it is comment\n' + 
// '  > Tabs | (1/12x + 1/10vw # Code - a + -+-1.2w)h 1/4hy 2/3w 1/3ghx 12.3m\n' + 
// '  :> ...\n' +
// '\n' + 
// '  > Buttons\n' +
// '  > Input | +center (tab.png)bg\n' +
// '  :> ...');


// const tokens = lexer('Tabs | (h (1 + 2 - (123 * 3)0))p');
const tokens = lexer('Tabs | (hello (1+3) world (3 * 4 + (1 + 2))a)a');
// const tokens = lexer('Tabs | (123 + (3 * 4))a');

parser.then((res) => {
  const ast = res.parser(tokens);
  console.dir(ast, { depth: null });
})

export default lexer;