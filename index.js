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

        // AJUSTE CLAVE: Reducimos el tamaño del SVG a un valor seguro (ej. 800x1400)
        // para que Sharp lo acepte. Tu imagen base tiene ~722x1280.
        const svgText = `
            <svg width="800" height="1400"> 
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
    // Esto es el último punto de fallo.
    try {
        return await sharp(baseImageBuffer, { limitInputPixels: false }) 
            .composite(svgLayers) 
            .toFormat('jpeg')
            .toBuffer();
    } catch (e) {
        console.error("Error de Sharp al procesar la imagen:", e.message);
        // Devolvemos el error específico de Sharp
        throw new Error(`Sharp error: ${e.message}`);
    }
}

// --- RUTA API (LLAMADA POR N8N) ---
app.post('/generate-tasa', async (req, res) => {
    try {
        const payload = req.body;
        
        // Verificación de existencia
        if (!payload.tasas || !payload.coordenadas || !payload.imagen_base_b64) {
            return res.status(400).send("Faltan 'tasas', 'coordenadas' o 'imagen_base_b64' en el cuerpo.");
        }

        const imageBuffer = await generateTasaImage(payload);
        
        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);
    } catch (error) {
        // Captura el error de Sharp y lo envía al log de n8n
        res.status(500).send(`Error interno: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Microservicio Sharp corriendo en puerto ${PORT}`);
});
