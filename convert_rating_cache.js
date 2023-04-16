const fs = require("node:fs");

const ratings = require("./rating_cache.json");

let map = {};
let obj = {
  ratings: map,
};
ratings.ratings.forEach((r) => {
  obj.ratings[r.discordId] = {
    rating: r.rating,
    name: r.name,
  };
});

// console.log(JSON.stringify(obj));

fs.writeFileSync("rating_cache.json", JSON.stringify(obj));
