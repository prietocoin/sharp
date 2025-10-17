# Usa la imagen base Node.js-slim (más soporte que Alpine)
FROM node:20-slim

# Instala las dependencias necesarias de libvips y las fuentes básicas (fonts-dejavu-core)
# para que el texto 'sans-serif' funcione y reconozca los números.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libvips \
    pkg-config \
    libexpat1 \
    libjpeg-dev \
    libpng-dev \
    fonts-dejavu-core \  <-- ¡INSTALACIÓN DE FUENTES CLAVE!
    git \
    && rm -rf /var/lib/apt/lists/*

# Crea el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de configuración
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código (index.js, etc.)
COPY . .

# Comando de inicio
CMD [ "node", "index.js" ]
