import fs from "fs";

const endpoint = "https://cocoon.huma-num.fr/sparql";
const query = fs.readFileSync("data/query.rq", "utf-8");

const res = await fetch(endpoint, {
    method: "POST",
    headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/sparql-results+json"
    },
    body: query
});

console.log("Endpoint:", endpoint);

if (!res.ok) {
    throw new Error("SPARQL request failed: " + res.status);
}

const data = await res.json();

// Count results
const count = data.results.bindings.length;
console.log(`✅ Number of results: ${count}`);

// Optional cleanup for frontend
const simplified = data.results.bindings.map(b => ({
    id: b.id?.value,
    title: b.title?.value,
    description: b.description?.value,
    src: b.src?.value,
    lat: parseFloat(b.lat?.value) || null,
    long: parseFloat(b.long?.value) || null,
}));

fs.writeFileSync("data/data.json", JSON.stringify(simplified, null, 2));

console.log("✅ data.json updated");