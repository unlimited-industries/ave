const lexer = await import("./lexer.mjs");
const parser = await import("./parser.mjs")
    
function removeCycles(obj, seen = new WeakSet()) {
  if (obj && typeof obj === 'object') {
    if (seen.has(obj)) return '[Circular]';
    seen.add(obj);
    for (const key of Object.keys(obj)) {
      obj[key] = removeCycles(obj[key], seen);
    }
  }
  return obj;
}

test('Parser Test #1', async () => {
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

    const expected = {
      type: 'Program',
      body: [
        {
          type: 'Component',
          name: 'Code',
          indent: 0,
          directives: [
            { type: 'Directive', name: 'bg-location', value: 'assets' },
            { type: 'Directive', name: 'a', value: 'helloworld' },
            { type: 'Directive', name: 'scroll', value: true }
          ],
          spec: [
            { type: 'Template', unit: 'h' },
            { type: 'UnitValue', value: 1.5, unit: 'hw' },
            {
              unit: 'bg',
              type: 'Expression',
              value: {
                type: 'Concatation',
                args: [ 'code-field.png' ],
                parent: {
                  type: 'UnaryPlus',
                  args: [ '[Circular]' ],
                  parent: { args: [ '[Circular]' ], parent: undefined }
                }
              }
            }
          ],
          comment: 'it is comment',
          children: [
            {
              type: 'Component',
              name: 'Tabs',
              indent: 1,
              directives: [],
              spec: [
                {
                  unit: 'h',
                  type: 'Expression',
                  value: {
                    type: 'UnaryPlus',
                    args: [
                      {
                        type: 'Addition',
                        args: [
                          {
                            type: 'Subtraction',
                            args: [
                              {
                                type: 'Addition',
                                args: [ '1/12x', '1/10vw' ],
                                parent: '[Circular]',
                                symbol: '+'
                              },
                              'a'
                            ],
                            parent: '[Circular]',
                            symbol: '-'
                          },
                          {
                            type: 'UnaryMinus',
                            args: [
                              {
                                type: 'UnaryPlus',
                                args: [
                                  {
                                    type: 'UnaryMinus',
                                    args: [ '1.2w' ],
                                    parent: '[Circular]',
                                    symbol: 'unary_minus'
                                  }
                                ],
                                parent: '[Circular]',
                                symbol: 'unary_plus'
                              }
                            ],
                            parent: '[Circular]',
                            symbol: 'unary_minus'
                          }
                        ],
                        parent: '[Circular]',
                        symbol: '+'
                      }
                    ],
                    parent: { args: [ '[Circular]' ], parent: undefined }
                  }
                },
                { type: 'UnitValue', value: 1, unit: 'hy' },
                { type: 'UnitValue', value: 2, unit: 'w' },
                { type: 'UnitValue', value: 1, unit: 'ghx' },
                { type: 'UnitValue', value: 12.3, unit: 'm' }
              ],
              comment: null,
              children: [ { type: 'TemplateInsert', indent: 2, value: '...' } ]
            },
            {
              type: 'Component',
              name: 'Buttons',
              indent: 1,
              directives: [],
              spec: [],
              comment: null,
              children: []
            },
            {
              type: 'Component',
              name: 'Input',
              indent: 1,
              directives: [],
              spec: [
                { type: 'Flag', unit: 'center', value: true },
                {
                  unit: 'bg',
                  type: 'Expression',
                  value: {
                    type: 'Concatation',
                    args: [ 'tab.png' ],
                    parent: {
                      type: 'UnaryPlus',
                      args: [ '[Circular]' ],
                      parent: { args: [ '[Circular]' ], parent: undefined }
                    }
                  }
                }
              ],
              comment: null,
              children: [ { type: 'TemplateInsert', indent: 2, value: '...' } ]
            }
          ]
        },
        {
          type: 'Component',
          name: 'Element',
          indent: 0,
          directives: [],
          spec: [
            { type: 'UnitValue', value: 1, unit: 'px' },
            { type: 'UnitValue', value: 2, unit: 'e' }
          ],
          comment: null,
          children: []
        }
      ]
    }
    const ast = removeCycles(parser.parser(tokens));
    expect(expected).toEqual(ast);
})

test("Test #2", () => {
  const tokens = lexer.default('Tabs | (h (1 + 2 - (123 * 3)0))p');
  const ast = removeCycles(parser.parser(tokens));
  const expected = {
    type: 'Program',
      body: [
        {
          type: 'Component',
          name: 'Tabs',
          indent: 0,
          directives: [],
          spec: [
            {
              unit: 'p',
              type: 'Expression',
              value: {
                type: 'Concatation',
                args: [
                  'h1+2-',
                  {
                    type: 'Multiplication',
                    args: [ '123', '3' ],
                    parent: '[Circular]',
                    symbol: '*'
                  },
                  '0)'
                ],
                parent: {
                  type: 'UnaryPlus',
                  args: [ '[Circular]' ],
                  parent: { args: [ '[Circular]' ], parent: undefined }
                }
              }
            }
          ],
          comment: null,
          children: []
        }
      ]
    }

  expect(expected).toEqual(ast);
})

test("Test #3", () => {
  const tokens = lexer.default('Tabs | (hello (1+3 # component) world (3 * 4 + (1 + 2))a)a');
  const ast = removeCycles(parser.parser(tokens));
  const expected = {
    type: 'Program',
    body: [
      {
        type: 'Component',
        name: 'Tabs',
        indent: 0,
        directives: [],
        spec: [
          {
            unit: 'a',
            type: 'Expression',
            value: {
              type: 'Concatation',
              args: [
                'hello',
                {
                  type: 'Addition',
                  args: [
                    '1',
                    {
                      type: 'GetValue',
                      args: [ '3', 'component' ],
                      parent: '[Circular]',
                      symbol: '#'
                    }
                  ],
                  parent: '[Circular]',
                  symbol: '+'
                },
                'world',
                {
                  type: 'Addition',
                  args: [
                    {
                      type: 'Multiplication',
                      args: [ '3', '4' ],
                      parent: '[Circular]',
                      symbol: '*'
                    },
                    {
                      type: 'Addition',
                      args: [ '1', '2' ],
                      parent: '[Circular]',
                      symbol: '+'
                    }
                  ],
                  parent: '[Circular]',
                  symbol: '+'
                },
                'a'
              ],
              parent: {
                type: 'UnaryPlus',
                args: [ '[Circular]' ],
                parent: { args: [ '[Circular]' ], parent: undefined }
              }
            }
          }
        ],
        comment: null,
        children: []
      }
    ]
  };
  expect(expected).toEqual(ast);
})
