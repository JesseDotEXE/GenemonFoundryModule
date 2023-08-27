/**
 * This scripts requries the following:
 * The ./GenemonInput/Genemon Import Data - [WEAPON].tsv file.
 * All the type images in GenemonInput/TypeImages and all types exist as typename.png format.
 * Action image output name must be WeaponGENATTACKNAME.png and placed in the EquipmentImages folder.
*/
const fs = require('fs');
const Papa = require('papaparse');
const { get, toUpper, toLower, replace} = require('lodash');

const parseFile = (fileName) => {
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
}

const createFoundryDataKey = (objectName) => {
  const prefix = `GEN`; // At some point we might need this to be more unique.
  return `${prefix}${toUpper(replace(objectName, /\s/g, ''))}`; // Make sure to make all caps and strip whitespace.
};

(async () => {
  const actionFileName = './data/GenemonTsvInput/Genemon Import Data - [WEAPON].tsv';
  const actionData = await parseFile(actionFileName);

  for(const action of actionData) {
    const actionType = get(action, 'Type', null);
    const actionName = get(action, 'Name', 'UNKNOWN');
    const actionNameForFoundy = createFoundryDataKey(actionName);

    const destFileName = `Weapon${actionNameForFoundy}.png`;
    const sourceFilePath = `./data/GenemonTsvInput/TypeImages/${toLower(actionType)}.png`;
    const destFilePath = `./data/GenemonXmlOutput/Data/EquipmentImages/${destFileName}`;

    // console.log(`${sourceFilePath} - ${destFileName} - ${actionType}`);

    await fs.copyFile(sourceFilePath, destFilePath, (error) => {
      if (error) throw error;
      console.log(`File [${destFileName}] was created.`);
    });
  }
})();
