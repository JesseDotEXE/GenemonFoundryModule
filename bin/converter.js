const fs = require('fs');
const Papa= require('papaparse');
const xml2js = require('xml2js');
const { capitalize, clone, forEach, map, get, toUpper, trim, split, replace } = require('lodash');

const swffgTypeMapping = {
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptor',
    'WEAPON': 'Weapon',
};
const outputFileNameMapping = {
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptors',
    'WEAPON': 'Weapons',
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
    return `${prefix}${toUpper(replace(objectName, ' ', ''))}`; // Make sure to make all caps and strip whitespace.
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
            case "Weapon":
                wrappedFoundryObject[foundyObjectType] = buildSwffgWeaponObject(objectData);
        }

        formattedFoundryObjects.push(wrappedFoundryObject);
    });

    const fullFormattedFoundryData = {};
    fullFormattedFoundryData[`${foundyObjectType}s`] = formattedFoundryObjects;

    const builder = new xml2js.Builder();
    return builder.buildObject(fullFormattedFoundryData);
};

/**
 *
 * @param swffgDataType - must be in 'Capitalize' format
 * @param data
 * @returns {Promise<void>}
 */
const writeFile = async (swffgDataType, data) => {
    try {
        const outputFileName = outputFileNameMapping[swffgDataType];
        const baseFolder = `./data/GenemonXmlOutput/Data`;
        const fileName = `${baseFolder}/${outputFileName}.xml`;
        console.log(`Saving Genemon XML data to [${fileName}].`);

        await fs.mkdirSync(baseFolder, { recursive: true }); // Make folder first.
        await fs.writeFileSync(fileName, data);
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

    const formattedXmlData = await buildFoundryXmlFile(swffgDataType, genemonData);

    if (formattedXmlData !== null && formattedXmlData !== undefined) {
        await writeFile(importType, formattedXmlData);
    } else {
        console.error('Failed to parse data. Did not write file.');
    }
})();
