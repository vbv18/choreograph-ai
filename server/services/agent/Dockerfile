FROM node

# Set working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm i

# Copy Agent package files and install dependencies
COPY ./services/agent/package*.json ./services/agent/
RUN cd ./services/agent && npm i

# Copy Agent service source code
COPY services/agent ./services/agent

# Copy shared libraries required by Agent
COPY services/lib ./services/lib
COPY shared ./shared

# Set working directory to Agent
WORKDIR /app/services/agent

# Expose Agent port
EXPOSE 8003

# Start Agent application
CMD ["npm", "start"]
