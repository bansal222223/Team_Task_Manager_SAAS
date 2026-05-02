# Use Node 22 for Vite 6+ support
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
# Copy frontend build to a directory named 'static'
COPY --from=frontend-build /frontend/dist ./static
EXPOSE 8080
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
