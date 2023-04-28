console.log("GENEMON | Initializing Genemon - START.");

import { GENEMON } from "./genemon-config.js";
import TemplateHelpers from "./scripts/template-helper.js";
import { init as pokemonInit } from "./scripts/pokemon-sheet.js";
import { init as shopInit } from "./scripts/shop_sheet.js";

Hooks.once("init", async function () {
    console.log("GENEMON | Genemon initialized.");

    TemplateHelpers.preload();

    CONFIG.GENEMON = GENEMON;

    pokemonInit();
    shopInit();
});

Hooks.on("createActor", (actor) => {
    console.log('GENEMON | ACTOR CREATE', actor);
});

// Handlebars Config
Handlebars.registerHelper('loud', function (aString) {
    return aString.toUpperCase()
});

Handlebars.registerHelper('nature', function (items) {
    let results = '';
    for (const item of items) {
        const itemDescription = item?.system?.description;
        const doesDescriptionIncludeNature = itemDescription.includes('NATURE'); // Consider this a 'tag' we can throw in the description to look for.
        results = (doesDescriptionIncludeNature) ? item?.name : '';
    }
    return (!!results) ? results : 'NOT FOUND!';
});

function register_hooks() {
    libWrapper.register("genemon");
}
