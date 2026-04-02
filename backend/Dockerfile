FROM node:20-alpine

WORKDIR /app

# Copiar dependencias e instalarlas (las definiremos luego en package.json)
COPY package*.json ./
RUN npm install

# Copiar resto del backend
COPY . .

# Exponer puerto del framework
EXPOSE 3000

# Lanzar servicio
CMD ["npm", "start"]
