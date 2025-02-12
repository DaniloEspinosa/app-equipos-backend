// models/Player.js
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  skills: {
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    stamina: { type: Number, required: true },
    speed: { type: Number, required: true },
  },
  registeredForWeek: { type: Boolean, default: false },
});

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;

//cambiado el nombre del archivo a minuscula para no generar conflicto en render
