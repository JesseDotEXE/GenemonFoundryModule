const fs = require('fs');
const Papa= require('papaparse');
const xml2js = require('xml2js');
const { clone, forEach, toUpper } = require('lodash');

const parseFile = async (filename) => {
    const dataStream = fs.createReadStream(filename);
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

const buildFoundyGearXmlFile = async (data) => {
    const builder = new xml2js.Builder();
    const foundyObjectType = 'Gear'; // Make a variable.

    const formattedFoundryObjects = [];
    forEach(data, (objectData) => {
        // TODO Move this code to a separate function for each object type.
        const rawFoundryObj = clone(objectData);
        rawFoundryObj.Key = `GEN${toUpper(objectData.Name)}`;
        rawFoundryObj.Description = (objectData.Link) ?
            `${objectData.Description} \<![CDATA[\<br\>\<br\>\<a href="${objectData.Link}"\>Genemon Rulebook\</a\>]]\>`
            : objectData.Description;
        rawFoundryObj.Encumbrance = 0;
        rawFoundryObj.Rarity = 0;

        const wrappedFoundryObject = {};
        wrappedFoundryObject[foundyObjectType] = rawFoundryObj;
        formattedFoundryObjects.push(wrappedFoundryObject);
    });
    const fullFormattedFoundryData = {};
    fullFormattedFoundryData[`${foundyObjectType}s`] = formattedFoundryObjects;

    return builder.buildObject(fullFormattedFoundryData);
};

const buildFoundyAbilityXmlFile = async (data) => {
    // TODO
};

const writeFile = async (data) => {
  try {
      await fs.writeFileSync(`./data/ConverterDataExample/Data/Gear.xml`, data, { recursive: true, });
      console.log('File saved!');
  } catch (error) {
      console.error('Error saving file. Error: ', error.message);
  }
};

(async () => {
    const type = 'Ability';
    let formattedXmlData = null;
    let data = null;

    switch (type) {
        case "Gear":
            data = await parseFile('./data/Genemon Data Set - Items.tsv');
            formattedXmlData = await buildFoundyGearXmlFile(data);
        case "Ability":
            data = await parseFile('./data/Genemon Data Set - Items.tsv');
            formattedXmlData = await buildFoundyAbilityXmlFile(data);
    }

    if (formattedXmlData !== null) {
        await writeFile(formattedXmlData);
        console.log('File created!');
    } else {
        console.error('Failed to parse data. Did not write file.');
    }
})();
