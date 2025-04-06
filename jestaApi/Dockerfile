# # Development

# # Use an official Python image as the base image
# FROM python:3.10-slim

# # Set environment variables
# ENV PYTHONDONTWRITEBYTECODE 1  # Prevent Python from writing .pyc files
# ENV PYTHONUNBUFFERED 1         # Ensure Python output is logged in real-time

# # Set the working directory inside the container
# WORKDIR /app

# # Install system dependencies for PostgreSQL and Python
# RUN apt-get update && apt-get install -y \
#     libpq-dev \
#     gcc \
#     && rm -rf /var/lib/apt/lists/*

# # Install Python dependencies
# COPY requirements.txt /app/
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy project files into the container
# COPY . /app/

# # Expose the Django application port
# EXPOSE 8000

#Production
# Example: If your current Dockerfile has something like:
FROM python:3.10-slim

# 1) Install system dependencies for GeoDjango
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libproj-dev \
    binutils \
    && rm -rf /var/lib/apt/lists/*

# 2) Create a working directory
WORKDIR /app

# 3) Copy requirements and install Python packages
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 4) Copy your Django (or other) project files
COPY . .

# 🔥 Collect static files here
RUN python manage.py collectstatic --noinput

# 5) Expose port 8000 and define the default command
# EXPOSE 8000


#Google cloud
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "jestaApi.wsgi:application"]

