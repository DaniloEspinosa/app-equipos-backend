// index.js
const express = require("express");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types;
const dotenv = require("dotenv");
const Player = require("./models/player.js");
const cors = require("cors");

dotenv.config(); // Cargar variables de entorno

const app = express();

app.use(cors());
app.use(express.json()); // Para procesar JSON en requests

// Conectar con MongoDB --------------------------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost/futbol", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar con MongoDB Atlas", err));

// Ruta de landing page ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("¡Bienvenido a la aplicación de fútbol!");
});

// Ruta para agregar un jugador -------------------------------------------------------------------
app.post("/players", async (req, res) => {
  const { name, skills } = req.body;
  const { attack, defense, stamina, speed } = skills;

  console.log("Datos recibidos en el servidor:", req.body); // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  // Validar que el nombre y las habilidades estén presentes
  if (!name || !skills) {
    return res
      .status(400)
      .json({ message: "El nombre y las habilidades son obligatorios" });
  }
  // Validar que las habilidades estén completas
  if (
    attack === undefined ||
    defense === undefined ||
    stamina === undefined ||
    speed === undefined
  ) {
    return res.status(400).json({
      message:
        "Las habilidades (attack, defense, stamina, speed) son obligatorias",
    });
  }

  // Validar que las habilidades sean números dentro del rango 1-10
  if (
    typeof attack !== "number" ||
    typeof defense !== "number" ||
    typeof stamina !== "number" ||
    typeof speed !== "number" ||
    attack < 1 ||
    attack > 10 ||
    defense < 1 ||
    defense > 10 ||
    stamina < 1 ||
    stamina > 10 ||
    speed < 1 ||
    speed > 10
  ) {
    return res
      .status(400)
      .json({ message: "Las habilidades deben ser números entre 1 y 10" });
  }

  try {
    // Crear un nuevo jugador con Mongoose
    const newPlayer = new Player({ name, skills });

    // Guardar en la base de datos
    await newPlayer.save();

    // Respuesta exitosa
    res.status(201).json(newPlayer);
  } catch (err) {
    // Manejar errores al crear el jugador
    res.status(400).json({ message: "Error al crear jugador", error: err });
  }
});

// Ruta para obtener la lista completa de jugadores desde MongoDB -------------------------------------------------------
app.get("/players", async (req, res) => {
  try {
    const players = await Player.find(); // Obtener todos los jugadores
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los jugadores" });
  }
});

// Ruta para registrar a un jugador para el partido de la semana ----------------------------------
app.put("/players/:id/register", async (req, res) => {
  try {
    // Validar que el ID proporcionado sea un ObjectId válido
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID no válido" });
    }

    // Buscar al jugador en la base de datos
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    // Contar cuántos jugadores están registrados para la semana
    const registeredPlayers = await Player.countDocuments({
      registeredForWeek: true,
    });

    // Verificar si el número de jugadores ya registrados es menor a 12
    if (!player.registeredForWeek && registeredPlayers >= 12) {
      return res.json({
        message: "El partido ya tiene 12 jugadores registrados.",
        error: true,
      });
    }

    // Cambiar el estado de registro del jugador
    player.registeredForWeek = !player.registeredForWeek;
    await player.save();

    // Responder con un mensaje de éxito
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: "Error al registrar el jugador", error });
  }
});

// Ruta para listar todos los jugadores registrados para el partido ----------------------------
app.get("/players/registered", async (req, res) => {
  try {
    const registeredPlayers = await Player.find({ registeredForWeek: true });

    res.json(registeredPlayers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los jugadores registrados" });
  }
});

// Ruta para eliminar un jugador por su ID ------------------------------------------------------
app.delete("/players/:id", async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id); // Buscar y eliminar por ID

    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    res.json({ message: `Jugador ${player.name} eliminado correctamente.` });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el jugador", error });
  }
});

// Ruta para actualizar parcialmente un jugador por su ID ---------------------------------------
app.patch("/players/:id/update", async (req, res) => {
  const { name, skills } = req.body;

  try {
    // Buscar el jugador actual
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Jugador no encontrado" });
    }

    // Si se proporciona `name`, actualizar el nombre
    if (name) {
      player.name = name;
    }

    // Actualizar las habilidades de manera parcial
    if (skills) {
      player.skills = { ...player.skills.toObject(), ...skills }; // Fusionar las nuevas habilidades con las existentes
    }

    // Guardar el jugador actualizado
    await player.save();

    res.json({ message: "Jugador actualizado correctamente", player });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el jugador", error });
  }
});

// Iniciar el servidor --------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Servidor en ejecución en el puerto http://localhost:${PORT}`)
);
