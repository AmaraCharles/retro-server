// models/ArtCollection.js
const mongoose = require("mongoose");

const artCollectionSchema = new mongoose.Schema({
  artworks: [String],
});

const ArtCollection = mongoose.model("ArtCollection", artCollectionSchema);

module.exports = ArtCollection;
