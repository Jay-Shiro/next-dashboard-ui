"use strict";

// Small script to generate a PNG image from the SVG icon
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

async function generatePNG() {
  try {
    // Create a canvas
    const canvas = createCanvas(24, 24);
    const ctx = canvas.getContext("2d");

    // Draw a wifi-off icon
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // Draw a diagonal line (the "off" indicator)
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(22, 22);
    ctx.stroke();

    // Draw wifi arcs
    ctx.beginPath();
    ctx.arc(12, 22, 10, Math.PI, 0, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(12, 22, 6, Math.PI, 0, true);
    ctx.stroke();

    // Save to file
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./public/wifi-off.png", buffer);
    console.log("PNG file created successfully");
  } catch (err) {
    console.error("Error generating PNG:", err);
  }
}

generatePNG();
