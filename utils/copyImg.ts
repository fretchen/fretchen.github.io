/**
 * This copies all the image files from the original folder to the corresponding subfolder
 * in the public folder
 */

import fs from "fs";

const publicFolder = "./public";

export const copyImg = (imgDirectory: string = "amo") => {
  const imgFiles = fs.readdirSync(`./${imgDirectory}`);
  console.log(imgFiles);
  imgFiles.forEach((file) => {
    // check that the file is an image file with ending .png, .jpg or .svg
    if (!file.endsWith(".png") && !file.endsWith(".jpg") && !file.endsWith(".svg")) {
      return;
    }
    const imgFileContent = fs.readFileSync(`${imgDirectory}/${file}`);
    fs.writeFileSync(`${publicFolder}/${imgDirectory}/${file}`, imgFileContent);
  });
};
