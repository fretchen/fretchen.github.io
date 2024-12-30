/**
 * Removes all the content of the server directory for the build directory. And moves all the content from
 * build/client directory to the build directory
 * at the end remove the left over server directory and assets.json file
 */

import fs from "fs";
import path from "path";

const serverDirectory = "./build/server";
const clientDirectory = "./build/client";
const assetsFile = "./build/assets.json";

const moveFiles = (source: string, destination: string) => {
  fs.readdirSync(source).forEach((file) => {
    fs.renameSync(`${source}/${file}`, `${destination}/${file}`);
  });
};

fs.readdirSync(serverDirectory).forEach((file) => {
  fs.rmSync(`${serverDirectory}/${file}`, { recursive: true });
});

export function cleanVike() {
  // Entfernt den übrig gebliebenen 'server'-Ordner
  if (fs.existsSync(serverDirectory)) {
    fs.rmSync(serverDirectory, { recursive: true, force: true });
  }

  // Entfernt die übrig gebliebene 'assets.json' Datei
  if (fs.existsSync(assetsFile)) {
    fs.unlinkSync(assetsFile);
  }
}

moveFiles(clientDirectory, "./build");
cleanVike();
