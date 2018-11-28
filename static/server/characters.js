const server = require('./server');
const { ObjectID } = require("mongodb");

exports.getCharacter = async (req, res) => {
  let characterID;
  try {
    characterID = new ObjectID(req.params.id);
  } catch (err) {
    res.status(422).json({ message: `Invalid issue ID format: ${err}` });
    return;
  }

  try {
    const character = await server.db.collection('characters')
      .find({ _id: characterID })
      .limit(1)
      .next();
    if (!character) {
      res.status(404).json({ message: `No character found: ${characterID}` });
    } else {
      res.json(character);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
};

exports.getCharacters = async (req, res) => {
  const filter = {};
  const levelFilter = { level_lte: '$lte', level_gte: '$gte' };
  Object.keys(req.query).forEach((key) => {
    if (levelFilter[key]) {
      if (!filter.level) {
        filter.level = {};
      }
      filter.level[levelFilter[key]] = parseInt(req.query[key], 10);
    } else {
      filter[key] = req.query[key];
    }
  });

  try {
    const characters = await server.db.collection('characters')
      .find(filter)
      .toArray();

    const metadata = { total_count: characters.length };
    res.json({ _metadata: metadata, characters });
  } catch (err) {
    console.log("Error: ", err);
    res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
};

exports.createCharacter = (req, res) => {
  let characterId;
  try {
    characterId = new ObjectID(req.params.id);
  } catch (e) {
    res.status(422).json({ message: `Invalid characters id format: ${e}` });
    return;
  }
  const character = req.body;
  delete character._id;
  if (character.created) {
    character.created = new Date(character.created);
  }
  server.db
    .collection("characters")
    .update({ _id: characterId }, character)
    .then(() =>
      server.db
        .collection("characters")
        .find({ _id: characterId })
        .limit(1)
        .next())
    .then((savedCharacter) => {
      res.json(savedCharacter);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: `Internal Server Error: ${error}` });
    });
}
