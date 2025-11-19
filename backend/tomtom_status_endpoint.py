"""
TomTom API Status Endpoint for TrafficWiz
This endpoint can be added to app.py to check TomTom API configuration
"""

@app.route("/api/tomtom/status", methods=["GET"])
def get_tomtom_api_status():
    """Check TomTom API service availability and configuration"""
    status = {
        "service_available": tomtom_service is not None,
        "api_key_configured": TOMTOM_API_KEY != "YOUR_TOMTOM_API_KEY_HERE",
        "base_url": TOMTOM_BASE_URL
    }
    
    if tomtom_service and status["api_key_configured"]:
        status["status"] = "ready"
        status["message"] = "TomTom API is configured and ready"
    elif not tomtom_service:
        status["status"] = "service_unavailable"
        status["message"] = "TomTom service module not available"
    elif not status["api_key_configured"]:
        status["status"] = "not_configured"
        status["message"] = "TomTom API key not configured. Please add your API key to backend/.env"
    else:
        status["status"] = "unknown"
        status["message"] = "Unknown status"
    
    return jsonify(status)