const fs = require('fs');

let numbers = [...Array(171).keys()];
// console.log('Numbers: ', numbers);
for(const num of numbers) {
  if (num === 0) continue;
  // console.log('num: ', num);
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
