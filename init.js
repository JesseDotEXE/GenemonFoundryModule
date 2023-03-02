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

function register_hooks() {
    libWrapper.register("genemon");
}
