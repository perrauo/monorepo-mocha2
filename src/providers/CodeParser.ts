import { parse, ParserOptions } from "@babel/parser";
import traverse from "@babel/traverse";
import { CallExpression, Identifier, SourceLocation } from "@babel/types";

const parentTokens = ["each"];
const testTokens = ["describe", "it"];

export interface TestEntryPoint {
  loc: SourceLocation;
  testName: string;
}

const STRING = "StringLiteral";
const IDENT = "Identifier";

function codeParser(sourceCode: string, onToken: (entryPoint: TestEntryPoint) => void): TestEntryPoint[] {
  const parserOptions: ParserOptions = {
    plugins: [
      "typescript",
      ["decorators", { decoratorsBeforeExport: false }],
      "classPrivateMethods",
      "classPrivateProperties",
      "topLevelAwait",
      "jsx"
    ],
    sourceType: "module"
  };

  const ast = parse(sourceCode, parserOptions);

  const result: TestEntryPoint[] = [];

  const pushResult = (
    node: CallExpression,
    identifier: Identifier,
    replacePlaceHolder: boolean,
  ) => {
    const args = node.arguments;
        args.forEach(a => {
          if (a.type === STRING) {
            if (identifier.loc) {
              const entryPoint = {
                loc: identifier.loc,
                testName: replacePlaceHolder
                  ? a.value.replace(/(\$\{[^\}]*\})|(\$[^ ]*)/g, ".*")
                  : a.value
              };
              result.push(entryPoint);
              onToken(entryPoint);
              console.log(`${identifier.name} ${a.value}`);
            }
          }
        });
  };

  traverse(ast, {
    CallExpression: p => {
      const node = p.node;
      if (
        node.callee.type === IDENT &&
        testTokens.includes(node.callee.name)
      ) {
        // Callee is a direct call to a test function
        pushResult(node, node.callee, false);
      } else if (node.callee.type === "MemberExpression") {
        //
        if (
          node.callee.property.type === IDENT &&
          testTokens.includes(node.callee.property.name)
        ) {
          // Callee seems to be a test function. Check if known parent object
          // is present
          if (
            node.callee.object.type === "CallExpression" &&
            node.callee.object.callee.type === IDENT &&
            parentTokens.includes(node.callee.object.callee.name)
          ) {
            pushResult(node, node.callee.object.callee, true);
          } else if (
            node.callee.object.type === "TaggedTemplateExpression" &&
            node.callee.object.tag.type === IDENT &&
            parentTokens.includes(node.callee.object.tag.name)
          ) {
            pushResult(node, node.callee.object.tag, true);
          }
        }
      }
    }
  });
  return result;
}

export { codeParser };