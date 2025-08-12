#!/bin/bash

# BTL Project Services Startup Script
# This script starts all services and the Redbird proxy

echo "🚀 Starting BTL Project Services..."

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    local start_cmd=$4
    
    echo "📦 Starting $service_name..."
    
    if [ ! -d "$service_dir" ]; then
        echo "❌ Directory $service_dir not found"
        return 1
    fi
    
    if ! check_port $port; then
        echo "⚠️  Skipping $service_name (port $port in use)"
        return 1
    fi
    
    cd "$service_dir"
    
    # Check if node_modules exists, install if not
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing dependencies for $service_name..."
        npm install
    fi
    
    # Start the service in background
    echo "▶️  Starting $service_name on port $port..."
    if [ "$start_cmd" = "dev" ]; then
        npm run dev > "../${service_name}.log" 2>&1 &
    else
        npm start > "../${service_name}.log" 2>&1 &
    fi
    
    local pid=$!
    echo "✅ $service_name started with PID $pid"
    echo $pid > "../${service_name}.pid"
    
    cd ..
    return 0
}

# Function to start proxy
start_proxy() {
    echo "🌐 Starting Redbird Proxy..."
    
    if ! check_port 80; then
        echo "⚠️  Skipping proxy (port 80 in use - you may need sudo)"
        return 1
    fi
    
    # Check if node_modules exists, install if not
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing proxy dependencies..."
        npm install
    fi
    
    # Start proxy in background
    echo "▶️  Starting proxy on port 80..."
    npm start > "proxy.log" 2>&1 &
    local pid=$!
    echo "✅ Proxy started with PID $pid"
    echo $pid > "proxy.pid"
    
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo "✅ $service_name is ready on port $port"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within timeout"
    return 1
}

# Main execution
echo "🔍 Checking ports..."
check_port 2000  # fetch_data
check_port 3000  # Frontend
check_port 4000  # Backend
check_port 80    # Proxy

echo ""
echo "🚀 Starting services..."

# Start services in order
start_service "fetch_data" "fetch_data" 2000 "start"
start_service "Backend" "backend" 4000 "start"
start_service "Frontend" "Frontend" 3000 "dev"

# Wait a bit for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Start proxy after services are ready
start_proxy

echo ""
echo "⏳ Waiting for all services to be ready..."

# Wait for services
wait_for_service "fetch_data" 2000
wait_for_service "Backend" 4000
wait_for_service "Frontend" 3000

echo ""
echo "🎉 All services started!"
echo ""
echo "📋 Service Status:"
echo "   fetch_data: http://localhost:2000"
echo "   Backend:    http://localhost:4000"
echo "   Frontend:   http://localhost:3000"
echo "   Proxy:      http://localhost:80"
echo ""
echo "🔍 Health Checks:"
echo "   Proxy Health:      http://localhost/proxy-health"
echo "   Services Health:   http://localhost/services-health"
echo "   Backend Health:    http://localhost/health"
echo ""
echo "📝 Logs:"
echo "   fetch_data.log"
echo "   Backend.log"
echo "   Frontend.log"
echo "   proxy.log"
echo ""
echo "🛑 To stop all services: ./stop-services.sh" 