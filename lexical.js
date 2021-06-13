const Token = {
  BooleanLiteral: "Boolean",
  EOF: "<end>",
  Identifier: "Identifier",
  Keyword: "Keyword",
  NullLiteral: "Null",
  NumericLiteral: "Numeric",
  StringLiteral: "String",
  Punctuator: "Punctuator",
};

class Character {
  static isWhiteSpace(character) {
    return character?.match(/ +?/);
  }

  static isIdentifierStart(character) {
    return character?.match(/[a-zA-Z_$]/);
  }

  static isIdentifierPart(character) {
    return character?.match(/[a-zA-Z0-9_]/);
  }

  static isStringStart(character) {
    return character?.match(/["']/);
  }

  static isDecimalDigit(character) {
    return character?.match(/[0-9]/);
  }

  static isLineTerminator(character) {
    const cp = character.charCodeAt(0);
    return cp === 0x0a || cp === 0x0d || cp === 0x2028 || cp === 0x2029;
  }
}

// La clase Scanner actua como Automata,
// Se encarga de identificar cada uno de los
// tokens y llevar
class Scanner {
  constructor(source) {
    this.source = source;
    this.index = 0;
    this.length = source.length;
    this.lineNumber = source.length > 0 ? 1 : 0;
  }

  throwUnexpectedToken() {
    throw new Error("Unexpected Token");
  }

  isKeyword(id) {
    switch (id.length) {
      case 2:
        return id === "if" || id === "in" || id === "do";
      case 3:
        return (
          id === "var" ||
          id === "for" ||
          id === "new" ||
          id === "try" ||
          id === "let"
        );
      case 4:
        return (
          id === "this" ||
          id === "else" ||
          id === "case" ||
          id === "void" ||
          id === "enum"
        );
      case 5:
        return (
          id === "while" ||
          id === "break" ||
          id === "catch" ||
          id === "throw" ||
          id === "const" ||
          id === "class" ||
          id === "super"
        );
      case 6:
        return (
          id === "return" ||
          id === "typeof" ||
          id === "delete" ||
          id === "switch" ||
          id === "export" ||
          id === "import"
        );
      case 7:
        return id === "default" || id === "finally" || id === "extends";
      case 8:
        return id === "function" || id === "continue" || id === "debugger";
      case 10:
        return id === "instanceof";
      default:
        return false;
    }
  }

  getIdentifier() {
    const start = this.index++;

    while (!this.eof()) {
      const ch = this.source[this.index];
      // Identifica si el caracter puede ser parte
      // de un identificador.
      if (Character.isIdentifierPart(ch)) {
        ++this.index;
      } else {
        break;
      }
    }

    return this.source.slice(start, this.index);
  }

  eof() {
    return this.index >= this.length;
  }

  scanComments() {
    while (!this.eof()) {
      const ch = this.source[this.index];
      if (Character.isWhiteSpace(ch)) ++this.index;
      else if (Character.isLineTerminator(ch)) {
        ++this.index;
        ++this.lineNumber;
      } else break;
    }
  }

  scanPunctuator() {
    const start = this.index;

    let str = this.source.substr(this.index, 3);

    // Identifica puntuadores de 3 digitos
    if (str.match(/(===|!==)/)) {
      this.index += 3;
    } else {
      str = str.substr(0, 2);

      // Identifica puntuadores de 2 digitos
      if (
        str === "&&" ||
        str === "||" ||
        str === "==" ||
        str === "!=" ||
        str === "+=" ||
        str === "-=" ||
        str === "*=" ||
        str === "/=" ||
        str === "++" ||
        str === "--" ||
        str === "^=" ||
        str === "%=" ||
        str === "<=" ||
        str === ">=" ||
        str === "=>"
      ) {
        this.index += 2;
      } else {
        str = this.source[this.index];

        // Identifica puntuadores de 1 digito
        if ("<>=!+-*%&|^/(){}.;,[]".indexOf(str) >= 0) {
          ++this.index;
        }
      }
    }

    // En caso de que no se identifique ninguna
    // Tira un error
    if (this.index === start) {
      this.throwUnexpectedToken();
    }

    return {
      type: Token.Punctuator,
      value: str,
      lineNumber: this.lineNumber,
    };
  }

  scanIdentifier() {
    // Obtiene el identificador
    const id = this.getIdentifier();
    let type;

    // Si tiene un solo caracter es un identificador
    if (id.length === 1) {
      type = Token.Identifier;

      // Busca si es una palabra clave
    } else if (this.isKeyword(id)) {
      type = Token.Keyword;

      // Null
    } else if (id === "null") {
      type = Token.NullLiteral;

      // Boolan
    } else if (id === "true" || id === "false") {
      type = Token.BooleanLiteral;
    } else {
      type = Token.Identifier;
    }

    return {
      type,
      value: id,
      lineNumber: this.lineNumber,
    };
  }

  // Busca caracteres numericos
  scanNumericLiteral() {
    const start = this.index;
    let num = "";

    let ch = this.source[start];

    if (ch !== ".") {
      num = this.source[this.index++];
      ch = this.source[this.index];

      while (Character.isDecimalDigit(this.source[this.index])) {
        num += this.source[this.index++];
      }

      ch = this.source[this.index];
    }

    if (ch === ".") {
      num += this.source[this.index++];

      while (Character.isDecimalDigit(this.source[this.index])) {
        num += this.source[this.index++];
      }

      ch = this.source[this.index];
    }

    if (Character.isIdentifierStart(this.source[this.index])) {
      this.throwUnexpectedToken();
    }

    return {
      type: Token.NumericLiteral,
      value: parseFloat(num),
      lineNumber: this.lineNumber,
    };
  }

  scanStringLiteral() {
    const start = this.index;
    let quote = this.source[start];

    ++this.index;
    let str = "";

    // Itera sobre el codigo hasta encontrar la comilla final
    while (!this.eof()) {
      let ch = this.source[this.index++];

      if (ch === quote) {
        quote = "";
        break;
      } else {
        str += ch;
      }
    }

    // En caso de no encontrarla tira un error
    if (quote !== "") {
      this.index = start;
      this.throwUnexpectedToken();
    }

    return {
      type: Token.StringLiteral,
      value: str,
      lineNumber: this.lineNumber,
    };
  }

  lex() {
    // Si se llego al final del
    // codigo se devuelve el token
    // de EOF.
    if (this.eof()) {
      return {
        type: Token.EOF,
        value: "",
      };
    }

    const ch = this.source[this.index];

    // Si el caracter es a-zA-Z_$ escanea el identificador.
    if (Character.isIdentifierStart(ch)) return this.scanIdentifier();

    // Si el caracter es " o ' escanea el string
    if (Character.isStringStart(ch)) return this.scanStringLiteral();

    // Si el caracter es un decimal escanea el numero
    if (Character.isDecimalDigit(ch)) return this.scanNumericLiteral();

    // Por ultimo escanea un puntuador
    return this.scanPunctuator();
  }
}

class Tokenizer {
  constructor(code) {
    this.code = code;
    this.scanner = new Scanner(code);
  }

  getNextToken() {
    this.scanner.scanComments();
    // Utiliza la instance de la clase Scanner para
    // buscar el siguiente token hasta que sea el final del
    // codigo.
    if (!this.scanner.eof()) return this.scanner.lex();
  }
}

class Lexical {
  // Recibe un codigo como entrada y retorna un
  // array con los tokens encontrados. En caso de
  // no reconocer algun token tira un error.
  tokenize(code) {
    const tokenizer = new Tokenizer(code);

    const tokens = [];

    // Utilize la instance de la clase Tokenizer
    // para iterar sobre cada uno de los tokens.
    // Cuando no se encuentra ningun token mas se
    // termina el ciclo.
    while (true) {
      const token = tokenizer.getNextToken();

      if (!token) break;

      tokens.push(token);
    }

    return tokens;
  }
}

module.exports = { Lexical, Tokenizer, Scanner, Character, Token };
