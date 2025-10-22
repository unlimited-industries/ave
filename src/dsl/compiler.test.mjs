const lexer = await import("./lexer.mjs");
const parser = await import("./parser.mjs");
const compiler = await import("./compiler.mjs");

test('Parser Test #1', () => {
  const tokens = lexer.default(
    '@bg-location`assets @a`hello world` @scroll\n' +
    '  Code | h 1.5hw (code-field.png)bg #id :: it is comment\n' +
    '  > Tabs | (1/12x + 1/10vw - a + -+-1.2w)h 1/4hy 2/3w 1/3ghx 12.3m\n' +
    '  :> ...\n' +
    '\n' +
    '  > Buttons\n' +
    '  > Input | +center (tab.png)bg\n' +
    '  :> ...\n' +
    '\n' +
    'Element | 1px 2e');

    const ast = parser.parser(tokens);
    const code = compiler.buildIR(ast);

    const expected = `function anonymous(createSignal,createEffect,units
) {
signals = []
const element1 = document.createElement('div');
signals.push(signal_0)
const [signal_0_get, signal_0_set] = createSignal();
createEffect(() => units['h'].set(element1, signal_0_get()));
const element2 = element1.createElement('div');
(+(((undefined + undefined) - "a") + (-(+(-units['w'].get(w) * 1.2)))))
units['w'].set(element2, 2)
element1.appendChild(element2);
const element3 = element1.createElement('div');
element1.appendChild(element3);
const element4 = element1.createElement('div');
element1.appendChild(element4);
const element5 = document.createElement('div');
return signal
}`;

    expect(expected).toEqual(code.toString());
})

test("Test #2", () => {
  const tokens = lexer.default('Tabs | (h (1 + 2 - (123 * 3)0))p');
  const ast = parser.parser(tokens);
  const code = compiler.buildIR(ast);
  const expected = `function anonymous(createSignal,createEffect,units
) {
signals = []
const element1 = document.createElement('div');
return signal
}`;
  expect(expected).toEqual(code.toString());
})

test("Test #3", () => {
  const tokens = lexer.default('Tabs | (hello (1+3 # component) world (3 * 4 + (1 + 2))a)a');
  const ast = parser.parser(tokens);
  const code = compiler.buildIR(ast);
  const expected = `function anonymous(createSignal,createEffect,units
) {
signals = []
const element1 = document.createElement('div');
return signal
}`
  expect(expected).toEqual(code.toString());
})
