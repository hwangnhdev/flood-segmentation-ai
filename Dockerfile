# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for OpenCV and other tools
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# We use the CPU-only version of torch to save space and avoid CUDA issues
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port Hugging Face Spaces expects (7860)
EXPOSE 7860

# Run the application
# We map 7860 to the host as required by HF
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]
