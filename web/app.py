import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Health check route
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "TrafficWiz API"})

    # Demo endpoints (for testing or local UI)
    @app.get("/api/demo")
    def demo():
        return jsonify({"message": "This is a demo endpoint"})

    @app.get("/api/hello")
    def hello():
        return jsonify({"message": "Hello from TrafficWiz API!"})

    @app.post("/api/echo")
    def echo():
        data = request.get_json(force=True)
        return jsonify({"you_sent": data})

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5001))  # defaults to 5001
    app.run(host="0.0.0.0", port=port, debug=True)
