FROM python:3.10-slim
WORKDIR /app
COPY . .
# Copy the docs folder from parent directory (contains built frontend)
COPY ../docs ./docs
RUN apt-get update && apt-get install -y python3-venv build-essential && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
EXPOSE 8080
CMD gunicorn -b 0.0.0.0:$PORT server:app
