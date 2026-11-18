FROM node

WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm install

# Copy Auth package files and install dependencies
COPY services/auth/package*.json ./services/auth/
RUN cd ./services/auth && npm install

# Copy Auth service source code
COPY services/auth ./services/auth

# Copy shared libraries required by Auth
COPY services/lib ./services/lib
COPY shared ./shared

# Set working directory
WORKDIR /app/services/auth

EXPOSE 8001

CMD ["npm", "start"]
