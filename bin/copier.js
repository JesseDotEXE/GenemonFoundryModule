// This is a janky file copier for duplicating files quickly.
// Needs a lot of work to be generic.

const fs = require('fs');

let numbers = [...Array(171).keys()];

for(const num of numbers) {
  if (num === 0) continue;

  let leadingZeroes = '';
  if (num < 10) leadingZeroes = '00';
  else if (num < 100) leadingZeroes = '0';

  const numStr = `${leadingZeroes}${num}`;
  const sourceFilePath = './data/ConverterDataExample/Data/EquipmentImages/GearGENTM.png';
  const destFileName = `GearGENTM${numStr}.png`;
  const destFilePath = `./data/ConverterDataExample/Data/EquipmentImages/${destFileName}`

  fs.copyFile(sourceFilePath, destFilePath, (error) => {
    if (error) throw error;
    console.log(`File [${destFileName}] was created.`);
  });
}
