import os
from flask import Flask, jsonify request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Health check route
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "TrafficWiz API"})

    # Temporary demo endpoint (no DB yet)
    @app.get("/api/demo")
    def demo():
        return jsonify({"message": "This is a demo endpoint"})

    # New GET endpoint
    @app.get("/api/hello")
    def hello():
        return jsonify({"message": "Hello from TrafficWiz API!"})

    # New POST endpoint
    @app.post("/api/echo")
    def echo():
        data = request.get_json()  # get JSON body from the request
        return jsonify({"you_sent": data})

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5001))  # use .env PORT or default to 5001
    app.run(host="0.0.0.0", port=port, debug=True)