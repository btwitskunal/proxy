#!/bin/bash

# BTL Project Services Stop Script
# This script stops all services and the Redbird proxy

echo "🛑 Stopping BTL Project Services..."

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file="${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo "🛑 Stopping $service_name (PID: $pid)..."
        
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "✅ Sent SIGTERM to $service_name"
            
            # Wait for graceful shutdown
            local wait_count=0
            while kill -0 "$pid" 2>/dev/null && [ $wait_count -lt 10 ]; do
                echo "   Waiting for $service_name to shutdown... ($((wait_count + 1))/10)"
                sleep 1
                wait_count=$((wait_count + 1))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  Force killing $service_name..."
                kill -9 "$pid"
            fi
        else
            echo "⚠️  $service_name process not running"
        fi
        
        # Remove PID file
        rm -f "$pid_file"
        echo "✅ $service_name stopped"
    else
        echo "⚠️  PID file for $service_name not found"
    fi
}

# Function to stop service by port
stop_service_by_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Looking for service on port $port..."
    
    local pids=$(lsof -ti :$port)
    if [ -n "$pids" ]; then
        echo "🛑 Found processes on port $port: $pids"
        for pid in $pids; do
            echo "   Stopping process $pid..."
            kill "$pid"
        done
        
        # Wait a bit for processes to stop
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti :$port)
        if [ -n "$remaining_pids" ]; then
            echo "⚠️  Force killing remaining processes on port $port..."
            for pid in $remaining_pids; do
                kill -9 "$pid"
            done
        fi
        
        echo "✅ Port $port cleared"
    else
        echo "✅ No services running on port $port"
    fi
}

# Main execution
echo "🛑 Stopping services..."

# Stop services by PID files (if available)
stop_service "proxy"
stop_service "fetch_data"
stop_service "Backend"
stop_service "Frontend"

# Also stop by port to ensure cleanup
echo ""
echo "🔍 Cleaning up ports..."
stop_service_by_port 80 "Proxy"
stop_service_by_port 2000 "fetch_data"
stop_service_by_port 3000 "Frontend"
stop_service_by_port 4000 "Backend"

# Remove log files
echo ""
echo "🧹 Cleaning up log files..."
rm -f *.log

echo ""
echo "✅ All services stopped and cleaned up!"
echo ""
echo "📋 Port Status:"
echo "   Port 80:   $(lsof -ti :80 >/dev/null 2>&1 && echo "❌ In use" || echo "✅ Available")"
echo "   Port 2000: $(lsof -ti :2000 >/dev/null 2>&1 && echo "❌ In use" || echo "✅ Available")"
echo "   Port 3000: $(lsof -ti :3000 >/dev/null 2>&1 && echo "❌ In use" || echo "✅ Available")"
echo "   Port 4000: $(lsof -ti :4000 >/dev/null 2>&1 && echo "❌ In use" || echo "✅ Available")" 