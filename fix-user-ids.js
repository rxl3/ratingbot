const fs = require("node:fs");
const userIds = require("../../user_ids.json");

for (let i = userIds.idPairs.length; i >= 0; i--) {
  if (userIds.idPairs[i].discordId.length === 1) {
    userIds.idPairs.splice(i, 1);
  }
}

fs.writeFileSync("user_ids.json", JSON.stringify(userIds));
