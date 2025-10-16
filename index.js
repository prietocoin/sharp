// Paso 1: Obtener las tasas (del nodo 3: "Get Rates")
// El JSON del API viene como un array: [{COP: '14.86', ...}]
const tasasObj = $node["Get Rates"].json[0]; 

// Paso 2: Definir las coordenadas y su respectivo Mapeo de la API
// { "nombre_de_campo_plantilla": { x: 950, y: 110, api_key: "COP" } }
const MAPPING_CONFIG = {
    // Tasa 1: Colombia (COP)
    colombia: { x: 950, y: 110, api_key: "COP" }, 
    
    // Tasa 2: Brasil (BRL)
    brasil: { x: 950, y: 225, api_key: "BRL" }, 
    
    // Tasa 3: Perú (S/.)
    peru: { x: 950, y: 340, api_key: "PEN" }, // ¡Ahora usa PEN!
    
    // Tasa 4: Chile (CLP)
    chile: { x: 950, y: 455, api_key: "CLP" },
    
    // Tasa 5: EE.UU. (USD)
    eeuu: { x: 950, y: 570, api_key: "USD" },
    
    // Tasa 6: México (MXN)
    mexico: { x: 950, y: 685, api_key: "MXN" },
    
    // Tasa 7: Ecuador (ECU)
    ecuador: { x: 950, y: 795, api_key: "ECU" }, // ¡Ahora usa ECU!
    
    // Tasa 8: Euros (EUR)
    euros: { x: 950, y: 910, api_key: "EUR" },
    
    // Ejemplo opcional (Argentina), si quieres mapear en un lugar que ya existe, por ejemplo, donde iba VES
    // argentina: { x: 950, y: 1025, api_key: "ARS" },
};

// Paso 3: Extraer solo las coordenadas y los valores de la API para el payload

let coordenadas_sharp = {}; // Solo X e Y
let tasas_sharp = {};       // Clave de Plantilla: Valor de Tasa

for (const [clave_plantilla, config] of Object.entries(MAPPING_CONFIG)) {
    const { x, y, api_key } = config;

    // 1. Añade la coordenada (X, Y) para el motor Sharp
    coordenadas_sharp[clave_plantilla] = { x, y };
    
    // 2. Añade el valor de la tasa de la API, usando la api_key definida
    tasas_sharp[clave_plantilla] = tasasObj[api_key] || "N/A";
}


// Paso 4: Definir la configuración de diseño
const config_diseno = {
    FONT_SIZE: 48,
    FONT_COLOR: '#FFFFFF'
};

// Paso 5: Obtener la imagen Base64 (del nodo 2: "Get Image")
const imageBinary = $node["Get Image"].binary.data; 
const imageBase64 = imageBinary.toString('base64'); 

// Paso 6: Crear el payload final
return [{
    json: {
        tasas: tasas_sharp, // {colombia: "14.86", brasil: "48.73", ...}
        coordenadas: coordenadas_sharp, // {colombia: {x: 950, y: 110}, ...}
        config: config_diseno,
        imagen_base_b64: imageBase64 
    }
}];
