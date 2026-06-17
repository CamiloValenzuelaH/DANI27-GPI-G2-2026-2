<<<<<<< HEAD
FROM python:3.12.9

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Comando para ejecutar tu backend
=======
FROM python:3.12.9

WORKDIR /app
COPY requirements.txt .
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        wkhtmltopdf \
        libxrender1 \
        libxext6 \
        libfontconfig1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Comando para ejecutar tu backend
>>>>>>> Chat-bot
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]