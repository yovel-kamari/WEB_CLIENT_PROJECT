import { promises as fs } from "fs";
import path from "path";

const dataDir = path.resolve("data");

async function readJson(file, fallback) {
  try {
    const data = await fs.readFile(path.join(dataDir, file), "utf-8");
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.writeFile(
    path.join(dataDir, file),
    JSON.stringify(data, null, 2)
  );
}

export const readUsers = () => readJson("users.json", []);
export const writeUsers = users => writeJson("users.json", users);

export const readPlaylists = () => readJson("playlists.json", []);
export const writePlaylists = p => writeJson("playlists.json", p);
