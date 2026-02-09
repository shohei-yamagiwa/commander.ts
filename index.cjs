const createJiti = require("jiti");

const jiti = createJiti(__filename, { interopDefault: true });

module.exports = jiti("./index.ts");
