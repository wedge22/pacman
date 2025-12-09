#!/bin/bash
# Quick deployment script for Pacman on Kubernetes

set -e

echo "🎮 Deploying Pacman to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Build Docker image
echo "📦 Building Docker image..."
cd "$(dirname "$0")/.."
docker build -t pacman-nodejs-app:latest -f docker/Dockerfile .

# Load image to cluster (if using minikube or kind)
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo "📥 Loading image to minikube..."
    minikube image load pacman-nodejs-app:latest
elif command -v kind &> /dev/null && kind get clusters &> /dev/null 2>&1; then
    echo "📥 Loading image to kind..."
    kind load docker-image pacman-nodejs-app:latest
fi

# Deploy MongoDB
echo "🗄️  Deploying MongoDB..."
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l component=database --timeout=120s || true

# Deploy Pacman
echo "🎮 Deploying Pacman application..."
kubectl apply -f k8s/pacman-deployment.yaml

# Wait for Pacman to be ready
echo "⏳ Waiting for Pacman to be ready..."
kubectl wait --for=condition=ready pod -l component=frontend --timeout=120s || true

# Show deployment status
echo ""
echo "✅ Deployment complete!"
echo ""
kubectl get all -l app=pacman

# Get access information
echo ""
echo "🌐 Access the application:"
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo "   minikube service pacman --url"
else
    echo "   kubectl port-forward service/pacman 8080:80"
    echo "   Then open: http://localhost:8080"
fi

echo ""
echo "📊 View logs:"
echo "   kubectl logs -f deployment/pacman"
echo ""
echo "🧹 Cleanup:"
echo "   kubectl delete -f k8s/"
