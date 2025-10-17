const express = require('express');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const PORT = 3000; 

app.use(express.json({ limit: '10mb' })); 

// --- FUNCIÓN DE GENERACIÓN DE IMAGEN ---
async function generateTasaImage(payload) {
    
    const { tasas, coordenadas, config } = payload;
    const baseImageBase64 = payload.imagen_base_b64; 
    
    if (!baseImageBase64) {
        throw new Error("El payload no contiene 'imagen_base_b64'.");
    }

    const baseImageBuffer = Buffer.from(baseImageBase64, 'base64');
    
    const { FONT_SIZE = 72 } = config || {}; 
    const FINAL_COLOR = "rgb(0, 0, 0)"; // NEGRO

    let svgLayers = [];
    
    for (const [clave_plantilla, coord] of Object.entries(coordenadas)) {
        const valor = tasas[clave_plantilla] || "N/A"; 

        // AJUSTE CLAVE: Usamos 'Oswald Bold' (el nombre de la fuente instalada) y eliminamos letter-spacing
        // para que la fuente angosta haga el trabajo por sí misma.
        const svgText = '<svg width="800" height="1400">' + 
            '<text x="' + coord.x + '" y="' + coord.y + '" ' + 
            'font-family="Oswald Bold" font-weight="bold" font-size="' + FONT_SIZE + '" ' + 
            'fill="' + FINAL_COLOR + '" text-anchor="end">' + 
            valor +
            '</text></svg>';

        svgLayers.push({
            input: Buffer.from(svgText),
            left: 0,
            top: 0
        });
    }

    // Componer la imagen y devolver el buffer
    try {
        return await sharp(baseImageBuffer, { limitInputPixels: false }) 
            .composite(svgLayers) 
            .toFormat('jpeg')
            .toBuffer();
    } catch (e) {
        console.error("Error de Sharp al procesar la imagen:", e.message);
        throw new Error(`Sharp error: ${e.message}`);
    }
}

// --- RUTA API (LLAMADA POR N8N) ---
app.post('/generate-tasa', async (req, res) => {
    try {
        const payload = req.body;
        
        if (!payload.tasas || !payload.coordenadas || !payload.imagen_base_b64) {
            return res.status(400).send("Faltan 'tasas', 'coordenadas' o 'imagen_base_b64' en el cuerpo.");
        }

        const imageBuffer = await generateTasaImage(payload);
        
        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).send(`Error interno: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Microservicio Sharp corriendo en puerto ${PORT}`);
});
