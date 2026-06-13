const DATE_TEXT = "date"

function isDateLiteral(node) {
	if (node.type === "Literal") {
		return node.value === DATE_TEXT
	}

	return (
		node.type === "TemplateLiteral" &&
		node.expressions.length === 0 &&
		node.quasis.length === 1 &&
		node.quasis[0].value.cooked === DATE_TEXT
	)
}

function getStaticValue(node) {
	if (!node) {
		return undefined
	}

	if (node.type === "JSXExpressionContainer") {
		return node.expression
	}

	return node
}

export default {
	meta: {
		type: "problem",
		docs: {
			description: "Ban native date inputs in favor of the shadcn date picker",
		},
		schema: [],
		messages: {
			useDatePicker:
				"Use the shadcn date picker instead of native `type=\"date\"` inputs.",
		},
	},
	create(context) {
		return {
			JSXAttribute(node) {
				if (node.name.type !== "JSXIdentifier" || node.name.name !== "type") {
					return
				}

				if (!isDateLiteral(getStaticValue(node.value))) {
					return
				}

				context.report({
					node,
					messageId: "useDatePicker",
				})
			},
		}
	},
}
