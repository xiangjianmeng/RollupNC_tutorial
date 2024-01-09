const fs = require("fs");

const inputs = {
    "in": "0x0000000000000000000000000000000000000000000000000000000000001234",
}

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);