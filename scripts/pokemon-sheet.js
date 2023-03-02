import { log } from './logger.js';
import { ActorSheetFFGV2 } from '../../../systems/starwarsffg/modules/actors/actor-sheet-ffg-v2.js';

let moduleName = "PokemonSheet";

export function init() {
    console.log('GENEMON | Registering Pokemon sheet.');
    log(moduleName, "Registering sheet");
    Actors.registerSheet("ffg", Pokemon, {
        label: "pokemon",
        makeDefault: false,
    });
}

export class Pokemon extends ActorSheetFFGV2 {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        console.log('GENEMON | Preparing Pokemon defaultOptions.');

        const options = super.defaultOptions;
        log(moduleName, options);

        mergeObject(options, {
            classes: ["starwarsffg", "sheet", "actor", "v2", "ffg-sw-enhanced", "vendor"],
            template: "modules/genemon/templates/pokemon.html",
            width: 710,
            height: 650,
            scrollY: [".inventory", ".vendor_item"],
        });
        return options;
    }

    get template() {
        return "modules/genemon/templates/pokemon.html";
    }

    activateListeners(html) {
        log(moduleName, 'GET DATA')
        super.activateListeners(html);
    }

    getData() {
        const data = super.getData();

        console.log('GENEMON | data', data);

        // TODO Can I do anything with the skills here?

        // data.data.skills = JSON.parse(JSON.stringify(CONFIG.GENEMON.pokemonSkills));
        // this.actor._applyModifiers(data.actor);
        // super._createSkillColumns(data);
        // data.data.skilllist =
        const pokemonOnlySkillList = [];
        data.data.skilllist.forEach((skillListItem) => {
            console.log('GENEMON | SkillListItem: ', skillListItem);
            const pokemonSkills = skillListItem.filter((skill) => {
               return (skill.type === 'Pokemon');
            });
            pokemonSkills.forEach((pSkill) => pokemonOnlySkillList.push(pSkill));
        });
        console.log('GENEMON | pokemonOnlySkillList', pokemonOnlySkillList);

        data.data.skilllist = [pokemonOnlySkillList];

        console.ll

        return data;
    }
}
