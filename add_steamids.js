const fs = require("node:fs");
const userIds = require("./user_ids.json");

const steamId64Ident = 76561197960265728;

module.exports = {
  convertCommIdToUSteamId,
};

function convertCommIdToSteamId(commId) {
  let steamId = [];
  steamId.push("STEAM_0");
  let steamIdAcct = +commId - steamId64Ident;

  if (steamIdAcct % 2 === 0) {
    steamId.push("0");
  } else {
    steamId.push("1");
  }

  steamId.push(Math.floor(steamIdAcct / 2) + "");

  return steamId.join(":");
}

function convertSteamIdToUSteamId(steamId) {
  let steamIdSplit = steamId.split(":");
  let uSteamId = [];
  uSteamId.push("U");
  uSteamId.push("1");

  let y = +steamIdSplit[1];
  let z = +steamIdSplit[2];

  let steamAcct = z * 2 + y;

  uSteamId.push(steamAcct);

  return "[" + uSteamId.join(":") + "]";
}

function convertCommIdToUSteamId(commId) {
  let steamId = convertCommIdToSteamId(commId);
  let uSteamId = convertSteamIdToUSteamId(steamId);
  return uSteamId;
}

for (let id of userIds.idPairs) {
  const uid = convertCommIdToUSteamId(id.steamId);

  id.uSteamId = uid;
}

fs.writeFileSync("user_ids.json", JSON.stringify(userIds));
