FROM node

# Set working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm i

# Copy Chat package files and install dependencies
COPY ./services/chat/package*.json ./services/chat/
RUN cd ./services/chat && npm i

# Copy Chat service source code
COPY services/chat ./services/chat

# Copy shared libraries required by Chat
COPY services/lib ./services/lib
COPY shared ./shared

# Set working directory to Chat
WORKDIR /app/services/chat

# Expose Chat port
EXPOSE 8002

# Start Chat application
CMD ["npm", "start"]
