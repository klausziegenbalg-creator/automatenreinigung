const functions = require("firebase-functions");

exports.verifyPin = require("./verifyPin").verifyPin;
exports.loadAutomaten = require("./loadAutomaten").loadAutomaten;
exports.submitCleaning = require("./submitCleaning").submitCleaning;
exports.loadLastCleaning = require("./loadLastCleaning").loadLastCleaning;
exports.loadWartungselemente = require("./loadWartungselemente").loadWartungselemente;
exports.submitWartung = require("./submitWartung").submitWartung;
exports.submitWochenWartung = require("./submitWochenWartung").submitWochenWartung;
