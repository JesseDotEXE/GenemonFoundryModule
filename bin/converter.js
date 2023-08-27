const fs = require('fs');
const Papa= require('papaparse');
const xml2js = require('xml2js');
const { capitalize, clone, forEach, map, get, toUpper, trim, split, replace } = require('lodash');

const swffgTypeMapping = {
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptor',
    'WEAPON': 'Weapon',
    'TALENT': 'Talent',
    'REGION': 'Species',
    'POKEMONIMAGE': ''
};
const outputFileNameMapping = { // TODO Make a more robust mapping object so the writeFile function is cleaner.
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptors',
    'WEAPON': 'Weapons',
    'TALENT': 'Talents',
    'REGION': 'Species',
    'POKEMONIMAGE': ''
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

    // Basic Details
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name);
    rawFoundryObj.Name = objectData.Name;
    rawFoundryObj.Description = objectData.Description;
    rawFoundryObj.StartingChars = {
        Brawn: objectData.Brawn,
        Agility: objectData.Agility,
        Intellect: objectData.Intellect,
        Cunning: objectData.Cunning,
        Willpower: objectData.Willpower,
        Presence: objectData.Presence,
    };
    rawFoundryObj.StartingAttrs = { // These will all be set to a default.
        WoundThreshold: 10,
        StrainThreshold: 10,
        SoakValue: 0,
        DefenseMelee: 0,
        DefenseRanged: 0,
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

const buildFoundXmlObjectsForDirectory = (swffgDataType, tsvData) => {
    const foundryObjectType = swffgDataType;
    const formattedXmlObjects = [];

    forEach(tsvData, (objectData) => {
        let wrappedFoundyObject = {};

        switch (foundryObjectType) {
            case "Species": // Species needs to make the Pokemon Species and Regions. This also outputs .xml files.
                wrappedFoundyObject[foundryObjectType] = buildSwffgSpeciesObject(objectData);
                break;
        }

        const builder = new xml2js.Builder();
        const formattedXmlObject = builder.buildObject(wrappedFoundyObject);
        formattedXmlObjects.push({ name: wrappedFoundyObject[foundryObjectType].Name, xml: formattedXmlObject });
    });

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
    const swffgDataType = swffgTypeMapping[importType];

    console.log(`Converting Genemon data for SWFFG type [${swffgDataType}].`);

    const genemonData = await parseFile(fileName);

    // TODO Clean this up at some point.
    if (swffgDataType === 'Species') { // These output a folder of .xml files.
        const formattedXmlDataObjects = buildFoundXmlObjectsForDirectory(swffgDataType, genemonData);
        // console.log('formattedXmlDataObjects: ', formattedXmlDataObjects);

        if (formattedXmlDataObjects !== null && formattedXmlDataObjects !== undefined && formattedXmlDataObjects.length > 0) {
            const directoryName = outputFileNameMapping[importType];
            for (const formattedObject of formattedXmlDataObjects) {
                await writeFile(formattedObject.name, formattedObject.xml, directoryName);
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
