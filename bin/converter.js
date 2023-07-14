const fs = require('fs');
const Papa= require('papaparse');
const xml2js = require('xml2js');
const { capitalize, clone, forEach, get, toUpper, replace } = require('lodash');

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

const createFoundryDataKey = (objectName, objectType) => {
    // const prefix = `GEN-${objectType}-`; // Keys might need to be more unique because there is clashing for searching on images.
    const prefix = `GEN`;
    return `${prefix}${toUpper(replace(objectName, ' ', ''))}`; // Make sure to make all caps and strip whitespace.
};

const buildSwffgGearObject = (objectData) => {
    const rawFoundryObj = clone(objectData);

    const genemonType = get(rawFoundryObj, 'Type', 'Unknown');
    rawFoundryObj.Key = createFoundryDataKey(objectData.Name, toUpper(genemonType));
    rawFoundryObj.Name = `${rawFoundryObj.Name} [${genemonType}]`; // Add the type to the name to make searching easier.
    rawFoundryObj.Description =
      `${objectData.Description} \n<!--[CDATA[--><br><br><b>[${genemonType}]</b><!--]]-->
      `; // Add the type to the description.
    rawFoundryObj.Encumbrance = 0;
    rawFoundryObj.Rarity = 0;

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

    const formattedFoundryObjects = [];
    forEach(tsvData, (objectData) => {
        let wrappedFoundryObject = {};

        switch (foundyObjectType) {
            case "Gear":
                wrappedFoundryObject[foundyObjectType] = buildSwffgGearObject(objectData);
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
        const baseFolder = `./data/GenemonXmlOutput/Data`;
        const fileName = `${baseFolder}/${swffgDataType}.xml`;
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
    const swffgDataType = capitalize(get(process, 'argv[2]', 'UNKNOWN')); // Must be in 'Captialize' format.
    const fileName = `./data/GenemonTsvInput/Genemon Import Data - [${swffgDataType}].tsv`;

    console.log(`Converting Genemon data for SWFFG type [${swffgDataType}].`);

    const genemonData = await parseFile(fileName);

    const formattedXmlData = await buildFoundryXmlFile(swffgDataType, genemonData);

    if (formattedXmlData !== null && formattedXmlData !== undefined) {
        await writeFile(swffgDataType, formattedXmlData);
    } else {
        console.error('Failed to parse data. Did not write file.');
    }
})();
