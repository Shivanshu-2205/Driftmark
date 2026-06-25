# Use python 3.10 slim as the base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure start script is executable
RUN chmod +x start.sh

# Expose backend port
EXPOSE 8000

# Start the application via the startup script
CMD ["./start.sh"]
