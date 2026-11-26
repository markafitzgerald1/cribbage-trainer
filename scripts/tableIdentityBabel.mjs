import {
  TABLE_IDENTITY_MODULE,
  readTableIdentity,
} from "./expectedTableIdentity.mjs";

export default ({ types }) => ({
  visitor: {
    ImportDeclaration(path) {
      if (path.node.source.value === TABLE_IDENTITY_MODULE) {
        path.replaceWith(
          types.variableDeclaration("const", [
            types.variableDeclarator(
              path.node.specifiers[0].local,
              types.valueToNode(readTableIdentity()),
            ),
          ]),
        );
      }
    },
  },
});
