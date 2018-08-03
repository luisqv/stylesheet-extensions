import Mixin from "zeplin-extension-style-kit/declarations/mixin";
import { isHtmlTag, isDeclarationInherited } from "zeplin-extension-style-kit/utils";

const PREFIX = "$";
const MIDFIX = ":";
const SUFFIX = ";";
const INDENTATION = "  ";

class SCSS {
    constructor(variables, params) {
        this.variables = variables;
        this.params = params;

        Object.keys(variables).forEach(vName => {
            this.variables[vName] = `${PREFIX}${variables[vName]}`;
        });
    }

    filterDeclarations(childDeclarations, parentDeclarations, isMixin) {
        const { params: { showDefaultValues, showDimensions } } = this;

        return childDeclarations.filter(declaration => {
            if (!showDimensions && (declaration.name === "width" || declaration.name === "height")) {
                return false;
            }

            const parentDeclaration = parentDeclarations.find(p => p.name === declaration.name);

            if (parentDeclaration) {
                if (!parentDeclaration.equals(declaration)) {
                    return true;
                }

                return !isDeclarationInherited(declaration.name);
            }

            if (declaration.hasDefaultValue && declaration.hasDefaultValue()) {
                return !isMixin && showDefaultValues;
            }

            return true;
        });
    }

    declaration(p, mixin) {
        if (p instanceof Mixin) {
            return `${INDENTATION}@include ${p.identifier}${SUFFIX}`;
        }

        let { params } = this;

        if (mixin) {
            params = Object.assign({}, params, { showDefaultValues: false });
        }

        return `${INDENTATION}${p.name}${MIDFIX} ${p.getValue(params, this.variables)}${SUFFIX}`;
    }

    variable(name, value) {
        return `${PREFIX}${name}${MIDFIX} ${value.toStyleValue(this.params)}${SUFFIX}`;
    }

    ruleSet({ selector, declarations }, { parentDeclarations = [], mixin = false } = {}) {
        const isMixin = !isHtmlTag(selector) && mixin;
        const filteredDeclarations = this.filterDeclarations(declarations, parentDeclarations, isMixin);
        const ruleSelector = isMixin ? selector.replace(/^\./, "@mixin ") : selector;

        return `${ruleSelector}${isMixin ? "()" : ""} {\n${filteredDeclarations.map(p => this.declaration(p, isMixin)).join("\n")}\n}`;
    }
}

export default SCSS;