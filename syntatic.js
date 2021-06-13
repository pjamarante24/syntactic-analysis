const { Scanner, Token } = require("./lexical");
const Node = require("./node");

class Parser {
  constructor(source) {
    this.scanner = new Scanner(source);
    this.lookahead = {
      type: Token.EOF,
      value: "",
      lineNumber: this.scanner.lineNumber,
    };
    this.hasLineTerminator = false;

    this.nextToken();
  }

  throwUnexpectedToken() {
    throw new Error("Unexpected Token");
  }

  nextToken() {
    const token = this.lookahead;

    this.scanner.scanComments();

    const next = this.scanner.lex();
    this.hasLineTerminator = token.lineNumber !== next.lineNumber;

    this.lookahead = next;

    this.literalTokens = [
      Token.BooleanLiteral,
      Token.NullLiteral,
      Token.NumericLiteral,
      Token.StringLiteral,
    ];

    return token;
  }

  match(value) {
    return (
      this.lookahead.type === Token.Punctuator && this.lookahead.value === value
    );
  }

  consumeSemiColon() {
    if (this.match(";")) {
      this.nextToken();
    }
  }

  parseVariableIdentifier() {
    const token = this.nextToken();

    if (token.type !== Token.Identifier) {
      this.throwUnexpectedToken();
    }

    return Node.Identifier({ name: token.value });
  }

  parseAssignmentExpression() {
    const token = this.nextToken();

    if (!this.literalTokens.includes(token.type)) this.throwUnexpectedToken();

    return Node.Literal({ value: token.value });
  }

  parseLexicalBinding(kind) {
    const params = [];
    const id = this.parseVariableIdentifier(params, kind);

    const token = this.nextToken();
    if (token.type !== Token.Punctuator && token.value !== "=") {
      this.throwUnexpectedToken();
    }

    const init = this.parseAssignmentExpression();

    return Node.VariableDeclarator({ id, init });
  }

  parseBindingList(kind) {
    const list = [this.parseLexicalBinding(kind)];

    return list;
  }

  parseLexicalDeclaration() {
    const kind = this.nextToken().value;
    const declarations = this.parseBindingList(kind);
    this.consumeSemiColon();

    return Node.VariableDeclaration({ kind, declarations });
  }

  parseStatementListItem() {
    let statement;

    if (this.lookahead.type === Token.Keyword) {
      switch (this.lookahead.value) {
        case "const":
        case "let":
        case "var":
          statement = this.parseLexicalDeclaration();
          break;

        default:
          this.throwUnexpectedToken();
      }
    } else {
      this.throwUnexpectedToken();
    }

    return statement;
  }

  analyse() {
    const body = [];
    while (this.lookahead && this.lookahead.type !== Token.EOF) {
      body.push(this.parseStatementListItem());
    }

    return Node.Program({ body });
  }
}

module.exports = { Parser };
