import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) {
    console.log("Usage: node scripts/test.mjs path/to/page.jpg");
    process.exit(1);
}

const image = (await readFile(path)).toString("base64");

const res = await fetch("http://localhost:3000/api/simplify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, mimeType: "image/jpeg" }),
});

console.log(JSON.stringify(await res.json(), null, 2));