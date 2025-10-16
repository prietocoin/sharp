# Usa una imagen base de Node.js (con herramientas de compilación)
FROM node:20-alpine

# Instala las dependencias de libvips necesarias para Sharp
RUN apk add --no-cache vips-dev build-base

# Crea el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de configuración
COPY package*.json ./
COPY plantilla-tasas1.jpeg .

# Instala las dependencias (¡incluyendo Sharp!)
RUN npm install

# Copia el resto del código
COPY . .

# Comando de inicio
CMD [ "node", "index.js" ]
