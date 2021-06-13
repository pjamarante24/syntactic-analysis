const fs = require("fs");
const path = require("path");
const { Parser } = require("./syntatic");

const start = () => {
  const program = fs.readFileSync(path.resolve(__dirname, "./code.js"), {
    encoding: "utf-8",
  });

  const parser = new Parser(program);
  const tree = parser.analyse();

  console.log(JSON.stringify(tree, null, 2));
};

start();
