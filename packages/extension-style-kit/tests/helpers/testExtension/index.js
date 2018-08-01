import Layer from "../../../elements/layer";
import TextStyle from "../../../elements/textStyle";
import Color from "../../../values/color";
import RuleSet from "../../../ruleSet";
import { getUniqueLayerTextStyles, selectorize } from "../../../utils";

import Generator from "./generator";

/*

function getVariableMap(projectColors, params) {
    const variables = {};

    projectColors.forEach(projectColor => {
        variables[new Color(projectColor).toStyleValue(params)] = projectColor.name;
    });

    return variables;
}

function getParams(context) {
    return {
        densityDivisor: context.project.densityDivisor,
        colorFormat: context.getOption(OPTION_NAMES.COLOR_FORMAT),
        showDimensions: context.getOption(OPTION_NAMES.SHOW_DIMENSIONS),
        showDefaultValues: context.getOption(OPTION_NAMES.SHOW_DEFAULT_VALUES),
        unitlessLineHeight: context.getOption(OPTION_NAMES.UNITLESS_LINE_HEIGHT)
    };
}

*/

class Extension {
    constructor(params, variables = {}) {
        this.params = params;
        this.variables = variables;

        this.generator = new Generator(this.variables, this.params);
    }

    styleguideColors(colors) {
        return colors.map(c => this.generator.variable(c.name, new Color(c))).join("\n");
    }

    styleguideTextStyles(textStyles) {
        return textStyles.map(t => {
            const { style } = new TextStyle(t);

            return this.generator.ruleSet(style);
        }).join("\n");
    }

    layer(selectedLayer) {
        const l = new Layer(selectedLayer);
        const layerRuleSet = l.style;
        const childrenRuleSet = [];
        const { defaultTextStyle } = selectedLayer;

        if (selectedLayer.type === "text" && defaultTextStyle) {
            const textStyleProps = l.getLayerTextStyleProps(defaultTextStyle);

            textStyleProps.forEach(p => layerRuleSet.addProp(p));

            getUniqueLayerTextStyles(selectedLayer).filter(
                textStyle => !defaultTextStyle.equals(textStyle)
            ).forEach((textStyle, idx) => {
                childrenRuleSet.push(
                    new RuleSet(
                        `${selectorize(selectedLayer.name)} ${selectorize(`text-style-${idx + 1}`)}`,
                        l.getLayerTextStyleProps(textStyle)
                    )
                );
            });
        }

        const layerStyle = this.generator.ruleSet(layerRuleSet);
        const childrenStyles = childrenRuleSet.map(s => this.generator.ruleSet(s, { parentProps: layerRuleSet.props }));

        return [layerStyle, ...childrenStyles].join("\n\n");
    }
}

export default Extension;