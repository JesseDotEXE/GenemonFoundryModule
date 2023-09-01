const fs = require('fs');
const Papa= require('papaparse');
const xml2js = require('xml2js');
const { capitalize, clone, forEach, map, get, toUpper, toLower, trim, split, replace } = require('lodash');

const swffgTypeMapping = {
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptor',
    'WEAPON': 'Weapon',
    'TALENT': 'Talent',
    'REGION': 'Species',
    'POKEMON': 'Pokemon',
};
const outputFileNameMapping = { // TODO Make a more robust mapping object so the writeFile function is cleaner.
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptors',
    'WEAPON': 'Weapons',
    'TALENT': 'Talents',
    'REGION': 'Species',
    'POKEMON': 'Pokemon'
};

const parseFile = async (fileName) => {
    console.log(`Parsing Genemon TSV data from [${fileName}].`);

    const dataStream = fs.createReadStream(fileName);
    return new Promise((resolve, reject) => {
        Papa.parse(dataStream, { // Should handle csv and tsv by default.
            header: true,
            complete: (results, file) => {
                resolve(results.data);
            },
            error: (err, file) => {
                reject(err);
            }
        })
    });
};

const createPokemonFileNameKey = (objectName) => {
    return `${toLower(replace(objectName, /\s/g, '-'))}`; // Make sure to make all caps and strip whitespace.
};

const createFoundryDataKey = (objectName) => {
    const prefix = `GEN`; // At some point we might need this to be more unique.
    return `${prefix}${toUpper(replace(objectName, /\s/g, ''))}`; // Make sure to make all caps and strip whitespace.
};

const buildSwffgGearObject = (objectData) => {
    const rawFoundryObj = clone(objectData);

    const genemonType = get(rawFoundryObj, 'Type', 'Unknown'); // Subtype
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name);
    rawFoundryObj.Name = `${rawFoundryObj.Name} [${genemonType}]`; // Add the type to the name to make searching easier.
    rawFoundryObj.Description =
      `${objectData.Description} \n<!--[CDATA[--><br><br><b>[${genemonType}]</b><!--]]-->
      `; // Add the type to the description.
    rawFoundryObj.Encumbrance = 0;
    rawFoundryObj.Rarity = 0;

    return rawFoundryObj;
};

const buildSwffgItemModifierObject = (objectData) => {
    const rawFoundryObj = clone(objectData);

    const genemonCost = get(rawFoundryObj, 'Cost', 'Unknown');
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name);
    rawFoundryObj.Name = `${rawFoundryObj.Name}`; // Add the type to the name to make searching easier.
    rawFoundryObj.Description =
      `${objectData.Description} \n<!--[CDATA[--><br><br><b>Cost: [${genemonCost}]</b><!--]]-->
      `; // Add the cost to the description.
    rawFoundryObj.Type = 'weapon'; // Leave as 'weapon' because all these will be associated weapons (moves)

    return rawFoundryObj;
};

const buildSwffgTalentObject = (objectData) => {
    const rawFoundryObj = clone(objectData);

    const genemonType = get(rawFoundryObj, 'Type', 'Unknown');
    const genemonRankMin = get(rawFoundryObj, 'Type', 'Unknown');
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name);
    rawFoundryObj.Name = `${rawFoundryObj.Name} [${genemonType}]`; // Add the type to the name to make searching easier.
    rawFoundryObj.Description =
      `${objectData.Description} 
       \n<!--[CDATA[--><br><br><b>Type: [${genemonType}]</b><!--]]-->
       \n<!--[CDATA[--><br><br><b>Rank Min: [${genemonRankMin}]</b><!--]]-->
      `; // Add the cost to the description.
    rawFoundryObj.Type = 'talent';

    // Don't want to take these fields.
    delete rawFoundryObj.Type;
    delete rawFoundryObj.Activation;
    delete rawFoundryObj.RankMin;

    return rawFoundryObj;
};

const buildSwffgSpeciesObject = (objectData) => {
    const rawFoundryObj = {};

    const charStats = parseCharacterStats(objectData);
    const { brawn, agility, intellect, cunning, willpower, presence, woundThreshold, strainThreshold, defenseRanged, defenseMelee } = charStats;
    const statsString = createStatsString(objectData);

    // Basic Details
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name);
    rawFoundryObj.Name = objectData.Name;
    rawFoundryObj.Description = `
        ${objectData.Description}
        ${statsString}
    `;
    rawFoundryObj.StartingChars = {
        Brawn: brawn,
        Agility: agility,
        Intellect: intellect,
        Cunning: cunning,
        Willpower: willpower,
        Presence: presence,
    };
    rawFoundryObj.StartingAttrs = {
        WoundThreshold: woundThreshold, // Doesn't import automatically.
        StrainThreshold: strainThreshold, // Doesn't import automatically.
        SoakValue: 0,
        DefenseMelee: defenseMelee,
        DefenseRanged: defenseRanged,
        Experience: 0,
        ForceRating: 0,
    };
    rawFoundryObj.WeaponModifiers = {}; // Unused
    rawFoundryObj.TalentModifiers = {}; // Unused
    rawFoundryObj.OptionChoices = {}; // Unused
    rawFoundryObj.NoForceAbilities = false;

    // Advanced Details
    const skillModifiers = [];
    if (objectData.SkillMod1) skillModifiers.push(objectData.SkillMod1);
    if (objectData.SkillMod2) skillModifiers.push(objectData.SkillMod2);
    const formattedSkillModifiersObj = {};
    formattedSkillModifiersObj['SkillModifier'] = buildSkillModifiers(skillModifiers);
    rawFoundryObj['SkillModifiers'] = formattedSkillModifiersObj;

    return rawFoundryObj;
};

/**
 * // Pokemon-only at the moment.
 * @param objectData
 * @returns {{}}
 */
const buildSwffgCharacterObject = async (objectData) => {
    const rawFoundryObj = {};

    const statsString = createStatsString(objectData);

    // Basic Details
    const baseFoundryKey = createFoundryDataKey(objectData.Name)
    rawFoundryObj.Key = `Character${baseFoundryKey}`; // Prepend Character to this key to be safe.
    rawFoundryObj.Name = objectData.Name;
    rawFoundryObj.Description = {
        CharName: objectData.Name,
        OtherFeatures: objectData.CatchRate,
    };
    rawFoundryObj.Story = `
        ${objectData.Description}
        ${statsString}
    `;

    // Linked Details
    rawFoundryObj.Portrait = await convertImageToBlob(objectData.Name); // Key if old way.
    rawFoundryObj.Species = {
        SpeciesKey: baseFoundryKey,
        SubSpeciesKey: {},
        SelectedOptions: {},
        NonCareerSkills: {},
    };
    const gearArray = [];
    const abilityName = get(objectData, 'Ability', null);
    if (abilityName) gearArray.push({ ItemKey: createFoundryDataKey(abilityName), Count: 1, });
    const secondAbilityName = get(objectData, 'SecondAbility', null);
    if (secondAbilityName) gearArray.push({ ItemKey: createFoundryDataKey(secondAbilityName), Count: 1, });
    const hiddenAbilityName = get(objectData, 'HiddenAbility', null);
    if (hiddenAbilityName) gearArray.push({ ItemKey: createFoundryDataKey(hiddenAbilityName), Count: 1, });
    rawFoundryObj.Gear = { CharGear: gearArray, };

    // Derived/Modified Details - check if we need to factor in the Species values
    const characteristicArray = [];
    characteristicArray.push({ Key: 'BR', Name: 'Brawn' });
    characteristicArray.push({ Key: 'AG', Name: 'Agility' });
    characteristicArray.push({ Key: 'INT', Name: 'Intellect' });
    characteristicArray.push({ Key: 'CUN', Name: 'Cunning' });
    characteristicArray.push({ Key: 'WIL', Name: 'Willpower' });
    characteristicArray.push({ Key: 'PR', Name: 'Presence' });
    rawFoundryObj.Characteristics = { CharCharacteristic: characteristicArray, };
    const skillArray = [];
    skillArray.push({ Key: 'BRAWL' });
    skillArray.push({ Key: 'RANGLT' });
    skillArray.push({ Key: 'LORE' });
    skillArray.push({ Key: 'RESIL' });
    skillArray.push({ Key: 'VIGIL' });
    rawFoundryObj.Skills = { CharSkill: skillArray };
    rawFoundryObj.Experience = { ExperienceRanks: { StartingRanks: 0, }, };
    rawFoundryObj.Career = {}; // Triggers error, may need a temp item.
    rawFoundryObj.Specializations = {}; // Triggers error may need a temp item.
    // rawFoundryObj.Attributes = {
    //    SoakValue: { StartingRanks: 0 },
    //    WoundThreshold: { StartingRanks: 0 },
    //    StrainThreshold: { StartingRanks: 0 }
    // };
    rawFoundryObj.Attributes = {};

    // Unused or nullable for Import
    rawFoundryObj.Weapons = {};
    rawFoundryObj.Armor = {};
    rawFoundryObj.Motivations = {};
    rawFoundryObj.ForcePowers = {};
    rawFoundryObj.SigAbilities = {};
    rawFoundryObj.ObOptions = {};
    rawFoundryObj.Obligations = {};
    rawFoundryObj.DutOptions = {};
    rawFoundryObj.Duties = {};
    rawFoundryObj.Class = {};
    rawFoundryObj.Hook = {};
    rawFoundryObj.Attitude = {};
    rawFoundryObj.Vehicles = {};
    rawFoundryObj.NPCs = {};
    rawFoundryObj.SummaryPriorities = {};
    rawFoundryObj.Credits = {};
    rawFoundryObj.Morality = {};
    rawFoundryObj.Grants = {};
    rawFoundryObj.UseGrants = false;
    rawFoundryObj.Rigger = {};
    rawFoundryObj.Schematics = {};
    rawFoundryObj.Rewards = {};
    rawFoundryObj.AutoRecacl = true; // What is this?

    return rawFoundryObj;
};

const parseCharacterStats = (characterObj) => {
    const brawn = get(characterObj, 'Brawn', 0);
    const agility = get(characterObj, 'Agility', 0);
    const intellect = get(characterObj, 'Intellect', 0);
    const cunning = get(characterObj, 'Cunning', 0);
    const willpower = get(characterObj, 'Willpower', 0);
    const presence = get(characterObj, 'Presence', 0);
    const woundThreshold = get(characterObj, 'WoundThreshold', 0);
    const strainThreshold = get(characterObj, 'StrainThreshold', 0);
    const defenseRanged = get(characterObj, 'DefenseRanged', 0);
    const defenseMelee = get(characterObj, 'DefenseMelee', 0);

    return { brawn, agility, intellect, cunning, willpower, presence, woundThreshold, strainThreshold, defenseRanged, defenseMelee };
}

const createStatsString = (characterObj) => {
    const charStats = parseCharacterStats(characterObj);
    const { brawn, agility, intellect, cunning, willpower, presence, woundThreshold, strainThreshold, defenseRanged, defenseMelee } = charStats;

    const statsString = `
        <!--[CDATA[--><br><br><b>Starting Stats</b><!--]]-->
        \n<!--[CDATA[--><br>Brawn: [${brawn}]<!--]]-->
        \n<!--[CDATA[--><br>Agility: [${agility}]<!--]]-->
        \n<!--[CDATA[--><br>Intellect: [${intellect}]<!--]]-->
        \n<!--[CDATA[--><br>Cunning: [${cunning}]<!--]]-->
        \n<!--[CDATA[--><br>Willpower: [${willpower}]<!--]]-->
        \n<!--[CDATA[--><br>Presence: [${presence}]<!--]]-->
        \n<!--[CDATA[--><br>Wound Threshold: [${woundThreshold}]<!--]]-->
        \n<!--[CDATA[--><br>Strain Threshold: [${strainThreshold}]<!--]]-->
        \n<!--[CDATA[--><br>Defense Ranged: [${defenseRanged}] (will not autopopulate)<!--]]-->
        \n<!--[CDATA[--><br>Defense Melee: [${defenseMelee}] (will not autopopulate)<!--]]-->                
    `;

    return statsString;
};

const convertImageToBlob = async (name) => {
    const cleanedName = createPokemonFileNameKey(name);
    const path = `./data/GenemonXmlOutput/Data/Characters/PokemonImages/${cleanedName}.png`;

    try {
        const image = await fs.readFileSync(path);
        return Buffer.from(image).toString('base64');
    } catch (error) {
        console.error('Error reading image file. Error: ', error.message);
        return null;
    }
};

const buildSkillModifiers = (skillModData) => {
    const formattedSkillModifiers = [];
    forEach(skillModData, (modifier) => {
        const formattedSkillMod = {
            Key: modifier,
            RankStart: 1,
            RankLimit: 2,
        };
        formattedSkillModifiers.push(formattedSkillMod);
    });
    return formattedSkillModifiers;
};

const buildSwffgWeaponObject = (objectData) => {
    const rawFoundryObj = clone(objectData);

    // Basic Details
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name);
    rawFoundryObj.Name = `${rawFoundryObj.Name}`; // Add the type to the name to make searching easier.
    const genemonType = get(rawFoundryObj, 'Type', 'Unknown');
    rawFoundryObj.ElementType = genemonType
    rawFoundryObj.Description =
      `${objectData.Description} \n<!--[CDATA[--><br><br><b>Type: [${genemonType}]</b><!--]]-->
      `; // Add the cost to the description.
    rawFoundryObj.Type = ''; // Reset type so it doesn't mess with the importer.
    rawFoundryObj.Damage = get(rawFoundryObj, 'Damage', 'Unknown');
    rawFoundryObj.Crit = 0;
    rawFoundryObj.Encumbrance = 0;
    rawFoundryObj.Price = 0;
    rawFoundryObj.Rarity = 0;
    rawFoundryObj.SkillKey = get(rawFoundryObj, 'Skill', 'Unknown'); // Must be in capital first letter format.
    rawFoundryObj.RangeValue = get(rawFoundryObj, 'Range', 'Unknown');
    rawFoundryObj.HP = 0; // Hardpoints

    // Advanced Details
    // Ignore 'Categories' in the OggDude XML.
    const genemonQualities = get(rawFoundryObj, 'Qualities', 'Unknown');
    const qualitiesObj = {};
    qualitiesObj['Quality'] = buildConverterWeaponQualityObject(genemonQualities);
    rawFoundryObj['Qualities'] = qualitiesObj;

    return rawFoundryObj;
};

/**
 * Converts the move qualities to the format for OggDude importer to read.
 * It's really fucking weird.
 * @param qualitiesString - string | It comes in this format: "Linked 5-Inaccurate 2"
 */
const buildConverterWeaponQualityObject = (qualitiesString) => {
    const formattedQualities = [];

    const splitQualities = split(qualitiesString, '-'); // Now in ['Linked 5', 'Inaccurate 2'] format.
    forEach(splitQualities, (quality) => {
        const splitValueQualities = quality.match(/[\d\.]+|\D+/gi); // Now in [ 'Linked', ' 5' ] format. Improve regex if needed.

        const qualityName = get(splitValueQualities, '[0]', 'Unknown');
        const qualityRank = parseInt(get(splitValueQualities, '[1]', null));

        const newQuality = {};
        newQuality.Key = createFoundryDataKey(trim(qualityName));
        if (qualityRank) { // Will be number or NaN
            newQuality.Count = qualityRank;
        }

        formattedQualities.push(newQuality);
    });

    return formattedQualities;
};

/**
 *
 * @param swffgDataType - must be in 'Capitalize' format
 * @param tsvData
 * @returns {*}
 */
const buildFoundryXmlFile = (swffgDataType, tsvData) => {
    const foundyObjectType = swffgDataType;

    const formattedFoundryObjects = [];
    forEach(tsvData, (objectData) => {
        let wrappedFoundryObject = {};

        switch (foundyObjectType) {
            case "Gear":
                wrappedFoundryObject[foundyObjectType] = buildSwffgGearObject(objectData);
                break;
            case "ItemDescriptor":
                wrappedFoundryObject[foundyObjectType] = buildSwffgItemModifierObject(objectData);
                break;
            case "Talent":
                wrappedFoundryObject[foundyObjectType] = buildSwffgTalentObject(objectData);
                break;
            case "Weapon":
                wrappedFoundryObject[foundyObjectType] = buildSwffgWeaponObject(objectData);
                break;
        }

        formattedFoundryObjects.push(wrappedFoundryObject);
    });

    const fullFormattedFoundryData = {};
    fullFormattedFoundryData[`${foundyObjectType}s`] = formattedFoundryObjects;

    const builder = new xml2js.Builder();
    return builder.buildObject(fullFormattedFoundryData);
};

const buildFoundXmlObjectsForDirectory = async (swffgDataType, tsvData) => {
    const foundryObjectType = swffgDataType;
    const formattedXmlObjects = [];

    for (const objectData of tsvData) {
        let wrappedFoundyObject = {};

        switch (foundryObjectType) {
            case "Species": // Species needs to make the Pokemon Species and Regions. This also outputs .xml files.
                wrappedFoundyObject[foundryObjectType] = buildSwffgSpeciesObject(objectData);
                break;
            case "Character":
                wrappedFoundyObject[foundryObjectType] = await buildSwffgCharacterObject(objectData);
                break;
        }

        const builder = new xml2js.Builder();
        const formattedXmlObject = builder.buildObject(wrappedFoundyObject);
        formattedXmlObjects.push({ name: wrappedFoundyObject[foundryObjectType].Name, xml: formattedXmlObject });
    }

    return formattedXmlObjects;
}

/**
 *
 * @param fileName - must be in 'Capitalize' format; will be either a swffg
 * @param data
 * @param dirLocation
 * @returns {Promise<void>}
 */
const writeFile = async (fileName, data, dirLocation = null) => {
    try {
        let outputFileName = fileName;
        let baseFolder = `./data/GenemonXmlOutput/Data`;
        if (dirLocation) {
            baseFolder = `${baseFolder}/${dirLocation}`;
        }
        const fullFileName = `${baseFolder}/${outputFileName}.xml`;

        console.log(`Saving Genemon XML data to [${fullFileName}].`);

        await fs.mkdirSync(baseFolder, { recursive: true }); // Make folder first.
        await fs.writeFileSync(fullFileName, data);
        console.log('File saved successfully.');
    } catch (error) {
        console.error('Error saving file. Error: ', error.message);
    }
};

// Will automatically run on launching file.
(async () => {
    const importType = toUpper(get(process, 'argv[2]', 'UNKNOWN')); // Must be in 'Captialize' format.
    const fileName = `./data/GenemonTsvInput/Genemon Import Data - [${importType}].tsv`;
    let swffgDataType = swffgTypeMapping[importType];

    console.log(`Converting Genemon data for SWFFG type [${swffgDataType}].`);

    const genemonData = await parseFile(fileName);

    // TODO Clean this up at some point.
    if (swffgDataType === 'Species') { // These output a folder of .xml files.
        const formattedXmlDataObjects = await buildFoundXmlObjectsForDirectory(swffgDataType, genemonData);
        if (formattedXmlDataObjects !== null && formattedXmlDataObjects !== undefined && formattedXmlDataObjects.length > 0) {
            const directoryName = outputFileNameMapping[importType];
            for (const formattedObject of formattedXmlDataObjects) {
                await writeFile(formattedObject.name, formattedObject.xml, directoryName);
            }
        }
    } else if (swffgDataType === 'Pokemon') {
        // Create Pokemon Species
        const formattedXmlSpeciesObjects = await buildFoundXmlObjectsForDirectory('Species', genemonData);
        if (formattedXmlSpeciesObjects !== null && formattedXmlSpeciesObjects !== undefined && formattedXmlSpeciesObjects.length > 0) {
            for (const formattedObject of formattedXmlSpeciesObjects) {
                await writeFile(formattedObject.name, formattedObject.xml, 'Species');
            }
        }

        // Create Pokemon XMLs
        const formattedXmlCharacterObjects = await buildFoundXmlObjectsForDirectory('Character', genemonData);
        if (formattedXmlCharacterObjects !== null && formattedXmlCharacterObjects !== undefined && formattedXmlCharacterObjects.length > 0) {
            for (const formattedObject of formattedXmlCharacterObjects) {
                await writeFile(formattedObject.name, formattedObject.xml, 'Characters');
            }
        }
    } else { // These are in a single file.
        const formattedXmlData = await buildFoundryXmlFile(swffgDataType, genemonData);
        if (formattedXmlData !== null && formattedXmlData !== undefined) {
            const fileName = outputFileNameMapping[importType];
            await writeFile(fileName, formattedXmlData, null);
        } else {
            console.error('Failed to parse data. Did not write file.');
        }
    }
})();
