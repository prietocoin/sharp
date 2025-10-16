const express = require('express');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const PORT = 3000; 

// Aumentamos el límite de cuerpo para aceptar buffers de imágenes grandes
// ¡IMPORTANTE! n8n enviará la imagen en este cuerpo.
app.use(express.json({ limit: '5mb' })); 

// --- FUNCIÓN DE GENERACIÓN DE IMAGEN ---
async function generateTasaImage(payload) {
    
    const { tasas, coordenadas, config } = payload;
    
    // CLAVE: Recibimos el Buffer de la imagen base como un string Base64
    const baseImageBase64 = payload.imagen_base_b64; 
    
    if (!baseImageBase64) {
        throw new Error("El payload no contiene 'imagen_base_b64'.");
    }

    // Convertir el string Base64 de vuelta a un Buffer binario para Sharp
    const baseImageBuffer = Buffer.from(baseImageBase64, 'base64');
    
    // Configuración de diseño por defecto (se puede sobrescribir desde n8n)
    const { FONT_SIZE = 48, FONT_COLOR = '#FFFFFF' } = config || {};

    let svgLayers = [];
    
    // ITERAMOS sobre las coordenadas (CLAVE = nombre de campo definido en n8n)
    for (const [clave_plantilla, coord] of Object.entries(coordenadas)) {
        
        // 1. Obtener el valor de la tasa del objeto 'tasas'
        //    (Las claves en 'tasas' deben coincidir con las claves de 'coordenadas' que enviamos desde n8n)
        const valor = tasas[clave_plantilla] || "N/A"; 

        // 2. Crear el SVG
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

    // 3. Componer la imagen y devolver el buffer
    return sharp(baseImageBuffer) 
        .composite(svgLayers) 
        .toFormat('jpeg')
        .toBuffer();
}

// --- RUTA API (LLAMADA POR N8N) ---
app.post('/generate-tasa', async (req, res) => {
    try {
        const payload = req.body;
        
        if (!payload.tasas || !payload.coordenadas || !payload.imagen_base_b64) {
            return res.status(400).send("Faltan 'tasas', 'coordenadas' o 'imagen_base_b64' en el cuerpo.");
        }

        const imageBuffer = await generateTasaImage(payload);
        
        // Enviamos la imagen con el Content-Type correcto
        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);
    } catch (error) {
        console.error("Error al generar la imagen:", error.message);
        // Devolvemos el error en texto para poder debuguear en n8n
        res.status(500).send(`Error interno: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Microservicio Sharp corriendo en puerto ${PORT}`);
});
