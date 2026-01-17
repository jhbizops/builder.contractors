import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = path.join(rootDir, "dist", "public");
const filesToRemove = ["sitemap.xml", "robots.txt"];

const removeIfExists = async (filePath) => {
  try {
    await fs.rm(filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
};

await Promise.all(filesToRemove.map((file) => removeIfExists(path.join(publicDir, file))));
