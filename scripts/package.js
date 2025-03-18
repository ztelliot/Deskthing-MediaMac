import { createWriteStream, existsSync } from "fs";
import { join, resolve } from "path";
import archiver from "archiver";
import { readdir, stat, writeFile } from "fs/promises";

async function addFilesToArchive(archive, folderPath, baseFolder = "") {
  const files = await readdir(folderPath);

  for (const file of files) {
    const filePath = join(folderPath, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      await addFilesToArchive(archive, filePath, join(baseFolder, file));
    } else {
      archive.file(filePath, { name: join(baseFolder, file) });
    }
  }
}

async function createPackage() {
  const packageName = process.env.npm_package_name;
  const camelCaseName = packageName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const version = process.env.npm_package_version;

  console.log(`Creating package ${camelCaseName}-v${version}.zip`);
  const output = createWriteStream(`${camelCaseName}-v${version}.zip`);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(output);

  console.log("Adding static files to archive");
  await addFilesToArchive(archive, resolve("deskthing"));
  console.log("Adding dist files to archive");
  await addFilesToArchive(archive, resolve("dist"));

  await archive.finalize();
}

async function fetchBin() {
  const binUrl = "https://github.com/ztelliot/media-cli/releases/latest/download/media-cli";

  console.log("Fetching media-cli binary");
  const response = await fetch(binUrl);
  
  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await writeFile(resolve("dist/media-cli"), new Uint8Array(buffer));
}

if (!existsSync(resolve("dist/media-cli"))) {
  await fetchBin().catch(console.error);
}
createPackage().catch(console.error);
