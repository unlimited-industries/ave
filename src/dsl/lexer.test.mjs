const lexer = await import("./lexer.mjs");

test('Test #1', () => {
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
  
    const expected = [
      {
        "type": "DIRECTIVE",
        "value": "@bg-location"
      },
      {
        "type": "BACKTICK",
        "value": "`"
      },
      {
        "type": "IDENT",
        "value": "assets"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "DIRECTIVE",
        "value": "@a"
      },
      {
        "type": "BACKTICK",
        "value": "`"
      },
      {
        "type": "IDENT",
        "value": "hello"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "IDENT",
        "value": "world"
      },
      {
        "type": "BACKTICK",
        "value": "`"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "DIRECTIVE",
        "value": "@scroll"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "WHITESPACE",
        "value": "  "
      },
      {
        "type": "IDENT",
        "value": "Code"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "SEPARATOR",
        "value": "|"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "IDENT",
        "value": "h"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1.5hw"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "PAREN_OPEN",
        "value": "("
      },
      {
        "type": "IDENT",
        "value": "code-field"
      },
      {
        "type": "UNKNOWN",
        "value": "."
      },
      {
        "type": "IDENT",
        "value": "png"
      },
      {
        "type": "PAREN_CLOSE",
        "value": ")"
      },
      {
        "type": "IDENT",
        "value": "bg"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "HASH",
        "value": "#id"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "COMMENT",
        "value": ":: it is comment"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "WHITESPACE",
        "value": "  "
      },
      {
        "type": "INDENT",
        "value": ">"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "IDENT",
        "value": "Tabs"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "SEPARATOR",
        "value": "|"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "PAREN_OPEN",
        "value": "("
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1/12x"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "PLUS",
        "value": "+"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1/10vw"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "UNKNOWN",
        "value": "-"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "IDENT",
        "value": "a"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "PLUS",
        "value": "+"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "UNKNOWN",
        "value": "-"
      },
      {
        "type": "PLUS",
        "value": "+"
      },
      {
        "type": "UNKNOWN",
        "value": "-"
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1.2w"
      },
      {
        "type": "PAREN_CLOSE",
        "value": ")"
      },
      {
        "type": "IDENT",
        "value": "h"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1/4hy"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "2/3w"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1/3ghx"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "12.3m"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "WHITESPACE",
        "value": "  "
      },
      {
        "type": "INDENT",
        "value": ":>"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "SPREAD",
        "value": "..."
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "WHITESPACE",
        "value": "  "
      },
      {
        "type": "INDENT",
        "value": ">"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "IDENT",
        "value": "Buttons"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "WHITESPACE",
        "value": "  "
      },
      {
        "type": "INDENT",
        "value": ">"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "IDENT",
        "value": "Input"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "SEPARATOR",
        "value": "|"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "PLUS",
        "value": "+"
      },
      {
        "type": "IDENT",
        "value": "center"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "PAREN_OPEN",
        "value": "("
      },
      {
        "type": "IDENT",
        "value": "tab"
      },
      {
        "type": "UNKNOWN",
        "value": "."
      },
      {
        "type": "IDENT",
        "value": "png"
      },
      {
        "type": "PAREN_CLOSE",
        "value": ")"
      },
      {
        "type": "IDENT",
        "value": "bg"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "WHITESPACE",
        "value": "  "
      },
      {
        "type": "INDENT",
        "value": ":>"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "SPREAD",
        "value": "..."
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "NEWLINE",
        "value": "\n"
      },
      {
        "type": "IDENT",
        "value": "Element"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "SEPARATOR",
        "value": "|"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "1px"
      },
      {
        "type": "WHITESPACE",
        "value": " "
      },
      {
        "type": "NUMBER_UNIT",
        "value": "2e"
      }
    ]

    expect(expected).toEqual(tokens);
})

test("Test #2", () => {
  const tokens = lexer.default('Tabs | (h (1 + 2 - (123 * 3)0))p');
  const expected = [
    {
      "type": "IDENT",
      "value": "Tabs"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "SEPARATOR",
      "value": "|"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "PAREN_OPEN",
      "value": "("
    },
    {
      "type": "IDENT",
      "value": "h"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "PAREN_OPEN",
      "value": "("
    },
    {
      "type": "NUMBER",
      "value": "1"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "PLUS",
      "value": "+"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "NUMBER",
      "value": "2"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "UNKNOWN",
      "value": "-"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "PAREN_OPEN",
      "value": "("
    },
    {
      "type": "NUMBER",
      "value": "123"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "UNKNOWN",
      "value": "*"
    },
    {
      "type": "WHITESPACE",
      "value": " "
    },
    {
      "type": "NUMBER",
      "value": "3"
    },
    {
      "type": "PAREN_CLOSE",
      "value": ")"
    },
    {
      "type": "NUMBER",
      "value": "0"
    },
    {
      "type": "PAREN_CLOSE",
      "value": ")"
    },
    {
      "type": "PAREN_CLOSE",
      "value": ")"
    },
    {
      "type": "IDENT",
      "value": "p"
    }
  ]
  expect(expected).toEqual(tokens);
})

test("Test #3", () => {
  const tokens = lexer.default('Tabs | (hello (1+3 # component) world (3 * 4 + (1 + 2))a)a');
  const expected = [
  {
    "type": "IDENT",
    "value": "Tabs"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "SEPARATOR",
    "value": "|"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "PAREN_OPEN",
    "value": "("
  },
  {
    "type": "IDENT",
    "value": "hello"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "PAREN_OPEN",
    "value": "("
  },
  {
    "type": "NUMBER",
    "value": "1"
  },
  {
    "type": "PLUS",
    "value": "+"
  },
  {
    "type": "NUMBER",
    "value": "3"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "UNKNOWN",
    "value": "#"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "IDENT",
    "value": "component"
  },
  {
    "type": "PAREN_CLOSE",
    "value": ")"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "IDENT",
    "value": "world"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "PAREN_OPEN",
    "value": "("
  },
  {
    "type": "NUMBER",
    "value": "3"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "UNKNOWN",
    "value": "*"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "NUMBER",
    "value": "4"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "PLUS",
    "value": "+"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "PAREN_OPEN",
    "value": "("
  },
  {
    "type": "NUMBER",
    "value": "1"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "PLUS",
    "value": "+"
  },
  {
    "type": "WHITESPACE",
    "value": " "
  },
  {
    "type": "NUMBER",
    "value": "2"
  },
  {
    "type": "PAREN_CLOSE",
    "value": ")"
  },
  {
    "type": "PAREN_CLOSE",
    "value": ")"
  },
  {
    "type": "IDENT",
    "value": "a"
  },
  {
    "type": "PAREN_CLOSE",
    "value": ")"
  },
  {
    "type": "IDENT",
    "value": "a"
  }
]
  expect(expected).toEqual(tokens);
})
