const express = require('express');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const PORT = 3000; 

// Aumentamos el límite de cuerpo para aceptar buffers de imágenes grandes
app.use(express.json({ limit: '10mb' })); 

// --- FUNCIÓN DE GENERACIÓN DE IMAGEN ---
async function generateTasaImage(payload) {
    
    const { tasas, coordenadas, config } = payload;
    
    // Convertir el string Base64 de vuelta a un Buffer binario para Sharp
    const baseImageBase64 = payload.imagen_base_b64; 
    
    if (!baseImageBase64) {
        throw new Error("El payload no contiene 'imagen_base_b64'.");
    }

    // Convertimos la cadena Base64 a un Buffer
    const baseImageBuffer = Buffer.from(baseImageBase64, 'base64');
    
    const { FONT_SIZE = 48, FONT_COLOR = '#FFFFFF' } = config || {};

    let svgLayers = [];
    
    // ITERAMOS sobre las coordenadas
    for (const [clave_plantilla, coord] of Object.entries(coordenadas)) {
        const valor = tasas[clave_plantilla] || "N/A"; 

        const svgText = `
            <svg width="1000" height="1000"> 
                <text x="${coord.x}" y="${coord.y}" 
                    font-family="Arial, sans-serif" 
                    font-size="${FONT_SIZE}" 
                    fill="${FONT_COLOR}" 
                    text-anchor="end"> 
                    ${valor}
                </text>
            </svg>
        `;

        svgLayers.push({
            input: Buffer.from(svgText),
            left: 0,
            top: 0
        });
    }

    // Componer la imagen y devolver el buffer
    // CLAVE: Usamos { limitInputPixels: false } para aumentar la tolerancia de Sharp
    try {
        return await sharp(baseImageBuffer, { limitInputPixels: false }) 
            .composite(svgLayers) 
            .toFormat('jpeg')
            .toBuffer();
    } catch (e) {
        console.error("Error de Sharp al procesar la imagen:", e.message);
        // Devolvemos un error 500 con el mensaje específico de Sharp
        throw new Error(`Input buffer contains unsupported image format. Sharp error: ${e.message}`);
    }
}

// --- RUTA API (LLAMADA POR N8N) ---
app.post('/generate-tasa', async (req, res) => {
    try {
        const payload = req.body;
        
        // Verificación de existencia (para evitar 400s innecesarios)
        if (!payload.tasas || !payload.coordenadas || !payload.imagen_base_b64) {
            // Este mensaje ya lo recibimos, ahora sabemos que la data sí llega
            return res.status(400).send("Faltan 'tasas', 'coordenadas' o 'imagen_base_b64' en el cuerpo.");
        }

        const imageBuffer = await generateTasaImage(payload);
        
        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);
    } catch (error) {
        // Captura el error de Sharp o el error de lógica
        res.status(500).send(`Error interno: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Microservicio Sharp corriendo en puerto ${PORT}`);
});
