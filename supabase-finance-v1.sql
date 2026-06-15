const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "public/driftspartner-property-os.html",
  "public/index.html",
  "public/kommersielt.html",
  "public/assets/driftspartner-property-os.css",
  "public/assets/logo-os.jpg",
  "public/assets/prod/00-core.js",
  "public/assets/prod/01-auth-data.js",
  "public/assets/prod/02-dashboard-property.js",
  "public/assets/prod/03-people-cases-docs.js",
  "public/assets/prod/04-finance-market-admin.js",
  "netlify/functions/ai-director.js",
  "netlify/functions/ai-ping.js",
  "netlify/functions/auth-profile.js",
  "netlify/functions/create-user.js",
  "netlify/functions/send-email.js",
  "netlify.toml"
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Mangler filer for produksjonsdeploy:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log("Driftspartner OS produksjonskontroll OK.");
