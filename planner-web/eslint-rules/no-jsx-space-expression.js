const SPACE_TEXT = " "

function isJsxChild(node) {
  return node.parent?.type === "JSXElement" || node.parent?.type === "JSXFragment"
}

function isSpaceExpression(expression) {
  if (expression.type === "Literal") {
    return expression.value === SPACE_TEXT
  }

  return (
    expression.type === "TemplateLiteral" &&
    expression.expressions.length === 0 &&
    expression.quasis.length === 1 &&
    expression.quasis[0].value.cooked === SPACE_TEXT
  )
}

export default {
  meta: {
    type: "layout",
    docs: {
      description: "Require &nbsp; instead of JSX space expressions",
    },
    fixable: "code",
    schema: [],
    messages: {
      useNbsp: "Use `&nbsp;` instead of a JSX space expression.",
    },
  },
  create(context) {
    return {
      JSXExpressionContainer(node) {
        if (!isJsxChild(node) || !isSpaceExpression(node.expression)) {
          return
        }

        context.report({
          node,
          messageId: "useNbsp",
          fix: (fixer) => fixer.replaceText(node, "&nbsp;"),
        })
      },
    }
  },
}
