const fs = require('fs');
const Papa= require('papaparse');
const xml2js = require('xml2js');
const { capitalize, clone, forEach, get, toUpper, replace } = require('lodash');

const swffgTypeMapping = {
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptor'
};
const outputFileNameMapping = {
    'GEAR': 'Gear',
    'ITEMMODIFIER': 'ItemDescriptors'
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

/**
 *
 * @param swffgDataType - must be in 'Capitalize' format
 * @param tsvData
 * @returns {*}
 */
const buildFoundryXmlFile = (swffgDataType, tsvData) => {
    const foundyObjectType = swffgDataType;

    console.log('foundyObjectType: ', foundyObjectType);

    const formattedFoundryObjects = [];
    forEach(tsvData, (objectData) => {
        let wrappedFoundryObject = {};

        switch (foundyObjectType) {
            case "Gear":
                wrappedFoundryObject[foundyObjectType] = buildSwffgGearObject(objectData);
            case "ItemDescriptor":
                wrappedFoundryObject[foundyObjectType] = buildSwffgItemModifierObject(objectData);
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
