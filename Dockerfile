FROM node:20-slim

# Instala las dependencias necesarias de libvips y las fuentes básicas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libvips \
    pkg-config \
    libexpat1 \
    libjpeg-dev \
    libpng-dev \
    fonts-dejavu-core \
    git \
    && rm -rf /var/lib/apt/lists/*

# === INSTALACIÓN DE FUENTE PERSONALIZADA: OSWALD ===
# CLAVE: Copia el archivo Bold desde el repositorio y lo instala
COPY Oswald-Bold.ttf /usr/local/share/fonts/
RUN fc-cache -f -v
# ====================================================

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "index.js" ]
