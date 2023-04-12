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

const buildFoundyXmlFile = async (data) => {
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

// <Key>GENTESTMISS</Key>
// <Name>Genemon Test Gear Missing</Name>
// <Description>
//     Downgrade the difficulty and add a blue on capture attempts two times if target is a baby Poke
//     Check the Genemon manual for more details.
//     <![CDATA[
//     <br>
//         <a href="https://docs.google.com/document/d/1RABsev4rtyAynCIb945XXNn1kAGS-hKAequhSdFHuf8/edit?usp=sharing">Genemon Rulebook</a>
//             ]]>
//         </Description>
// <Encumbrance>0</Encumbrance>
// <Price>25</Price>
// <Rarity>0</Rarity>
// <Type>General</Type>

const writeFile = async (data) => {
  try {
      await fs.writeFileSync(`./data/ConverterDataExample/Data/Gear.xml`, data, { recursive: true, });
      console.log('File saved!');
  } catch (error) {
      console.error('Error saving file. Error: ', error.message);
  }
};

(async () => {
    const data = await parseFile('./data/Genemon Data Set - Items.tsv');
    const formattedXmlData = await buildFoundyXmlFile(data);
    await writeFile(formattedXmlData);
    // console.log('XML Data: ', formattedXmlData);
})();
