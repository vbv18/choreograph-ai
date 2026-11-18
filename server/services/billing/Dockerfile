FROM node

# Set working directory
WORKDIR /app

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm i

# Copy Billing package files and install dependencies
COPY ./services/billing/package*.json ./services/billing/
RUN cd ./services/billing && npm i

# Copy Billing service source code
COPY services/billing ./services/billing

# Copy shared libraries required by Billing
COPY services/lib ./services/lib
COPY shared ./shared

# Set working directory to Billing
WORKDIR /app/services/billing

# Expose Billing port
EXPOSE 8004

# Start Billing application
CMD ["npm", "start"]
