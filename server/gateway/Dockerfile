FROM node

# Set working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Gateway package files and install dependencies
COPY ./gateway/package*.json ./gateway/
RUN cd ./gateway && npm install

# Copy Gateway source code
COPY gateway ./gateway

# Copy shared libraries required by Gateway
COPY shared ./shared

# Set working directory to Gateway
WORKDIR /app/gateway

# Expose Gateway port
EXPOSE 8000

# Start Gateway application
CMD ["npm", "start"]
