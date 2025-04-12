FROM node:18

WORKDIR /app

# Copiar solo package.json y package-lock.json primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm install
RUN npm install react-router-dom axios

# Copiar el resto de los archivos
COPY . .

# Puerto para desarrollo
EXPOSE 5173

# Comando para desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]