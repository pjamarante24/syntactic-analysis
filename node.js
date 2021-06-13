const Syntax = {
  Identifier: "Identifier",
  Literal: "Literal",
  Program: "Program",
  VariableDeclaration: "VariableDeclaration",
  VariableDeclarator: "VariableDeclarator",
};

function Program({ body }) {
  return { type: Syntax.Program, body };
}

function VariableDeclaration({ declarations, kind }) {
  return { type: Syntax.VariableDeclaration, declarations, kind };
}

function VariableDeclarator({ id, init }) {
  return { type: Syntax.VariableDeclarator, id, init };
}

function Identifier({ name }) {
  return { type: Syntax.Identifier, name };
}

function Literal({ value }) {
  return { type: Syntax.Literal, value };
}

module.exports = {
  Identifier,
  Literal,
  Program,
  VariableDeclaration,
  VariableDeclarator,
};
