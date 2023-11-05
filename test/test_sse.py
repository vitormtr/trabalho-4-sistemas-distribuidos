from flask import Flask, render_template, request
from flask_sse import sse
from flask_cors import CORS
import redis

app = Flask(__name__)
app.config["REDIS_URL"] = "redis://localhost"
app.register_blueprint(sse, url_prefix='/stream')
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/publish', methods=['POST'])
def publish_event():
    sse.publish({"message": "message"}, type='event_type')
    return "Event published"

if __name__ == '__main__':
    app.run(debug=True, port=5000)