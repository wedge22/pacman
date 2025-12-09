# Kubernetes Deployment Guide

This directory contains Kubernetes manifests to deploy the Pacman application.

## Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured to access your cluster
- Docker image built and available to your cluster

## Quick Start

### 1. Build and Load Docker Image

If using minikube or kind, you need to load the image into the cluster:

```bash
# Build the image (from project root)
docker build -t pacman-nodejs-app:latest -f docker/Dockerfile .

# For minikube:
minikube image load pacman-nodejs-app:latest

# For kind:
kind load docker-image pacman-nodejs-app:latest
```

### 2. Configure Splunk RUM (Optional)

Edit `k8s/pacman-deployment.yaml` and uncomment/set these environment variables in the ConfigMap:

```yaml
SPLUNK_RUM_REALM: "us1"
SPLUNK_RUM_TOKEN: "your-rum-token"
SPLUNK_RUM_APP_NAME: "pacman"
DEPLOYMENT_ENV: "kubernetes"
```

### 3. Deploy to Kubernetes

```bash
# Create namespace (optional)
kubectl create namespace pacman

# Deploy MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l component=database --timeout=60s

# Deploy Pacman application
kubectl apply -f k8s/pacman-deployment.yaml

# Wait for Pacman to be ready
kubectl wait --for=condition=ready pod -l component=frontend --timeout=60s
```

### 4. Access the Application

```bash
# Get the service URL (minikube)
minikube service pacman --url

# Or use port-forward
kubectl port-forward service/pacman 8080:80

# Then open: http://localhost:8080
```

### 5. Verify Instrumentation

Check the logs to verify OpenTelemetry instrumentation is working:

```bash
# Get pod name
kubectl get pods -l component=frontend

# Check logs
kubectl logs -f <pacman-pod-name>

# You should see OpenTelemetry initialization messages
```

## Monitoring

### View Application Logs

```bash
kubectl logs -f deployment/pacman
```

### View MongoDB Logs

```bash
kubectl logs -f deployment/mongo
```

### Check Service Status

```bash
kubectl get all -l app=pacman
```

### Debug Pod Issues

```bash
# Describe pacman pod
kubectl describe pod -l component=frontend

# Describe mongodb pod
kubectl describe pod -l component=database

# Get events
kubectl get events --sort-by='.lastTimestamp'
```

## Testing Security Features

### Test Input Validation

```bash
# Get the service endpoint
SERVICE_URL=$(minikube service pacman --url)
# or use http://localhost:8080 if using port-forward

# Test invalid ObjectId
curl -X POST $SERVICE_URL/user/stats \
  -H "Content-Type: application/json" \
  -d '{"userId":"invalid","score":"abc"}'

# Expected: 400 error with "Invalid userId format"

# Test score validation
curl -X POST $SERVICE_URL/user/stats \
  -H "Content-Type: application/json" \
  -d '{"userId":"675464a1b2c3d4e5f6789012","score":999999999}'

# Expected: 400 error with score range message
```

### Test Security Headers

```bash
curl -I $SERVICE_URL/

# Look for:
# - Content-Security-Policy
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
```

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..25}; do
  curl -X POST $SERVICE_URL/highscores \
    -H "Content-Type: application/json" \
    -d '{"name":"test","score":100,"level":1}' &
done

# You should hit rate limit (20 requests per 15 min for POST)
```

## Verify Splunk RUM Integration

1. Open the application in a browser: http://localhost:8080
2. Play the game for a few minutes
3. Check your Splunk Observability Cloud RUM dashboard
4. You should see:
   - Page loads
   - User interactions
   - API calls to /highscores, /user/stats, etc.
   - Performance metrics

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/pacman-deployment.yaml
kubectl delete -f k8s/mongodb-deployment.yaml

# Or delete namespace if you created one
kubectl delete namespace pacman
```

## Troubleshooting

### Pod Not Starting

```bash
kubectl describe pod -l component=frontend
kubectl logs -l component=frontend
```

### Cannot Connect to MongoDB

```bash
# Check if MongoDB service is running
kubectl get svc mongo

# Test DNS resolution from pacman pod
kubectl exec -it <pacman-pod> -- nslookup mongo

# Check MongoDB logs
kubectl logs -l component=database
```

### Image Pull Errors

If using a local image with minikube/kind:
- Make sure you loaded the image: `minikube image load pacman-nodejs-app:latest`
- Set `imagePullPolicy: IfNotPresent` in deployment

### Security Headers Not Working

- Check that helmet.js is installed: `kubectl exec -it <pod> -- npm list helmet`
- Verify app.js has helmet configured
- Check application logs for errors

## Production Considerations

Before deploying to production:

1. **Use a proper database solution**
   - MongoDB ReplicaSet or managed service (MongoDB Atlas)
   - Persistent volumes instead of emptyDir

2. **Configure secrets properly**
   - Store RUM tokens in Kubernetes Secrets, not ConfigMaps
   - Use external secret management (Vault, AWS Secrets Manager)

3. **Set resource limits**
   - Already configured in the manifest
   - Adjust based on your load testing

4. **Enable autoscaling**
   ```bash
   kubectl autoscale deployment pacman --cpu-percent=50 --min=2 --max=10
   ```

5. **Configure ingress**
   - Use an Ingress controller instead of LoadBalancer
   - Enable TLS/SSL certificates

6. **Monitor and alert**
   - Set up Splunk Observability Cloud dashboards
   - Configure alerts for errors, high latency, etc.

7. **Backup strategy**
   - Regular MongoDB backups
   - Test restore procedures
