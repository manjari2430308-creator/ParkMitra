"""
ParkMitra Python Microservice
- Nearest parking using Haversine formula
- Parking recommendation scoring
- Analytics helpers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)


def haversine(lat1, lng1, lat2, lng2):
    """Calculate distance between two GPS coordinates in km."""
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def score_parking(space, user_lat, user_lng, max_distance_km=10):
    """
    Score a parking space based on:
    - Distance (closer = better)
    - Price (cheaper = better)
    - Availability (more slots = better)
    """
    dist = haversine(user_lat, user_lng, space['lat'], space['lng'])
    if dist > max_distance_km:
        return -1  # Too far

    # Normalize each factor 0-1
    dist_score = max(0, 1 - (dist / max_distance_km))          # closer is better
    price_score = max(0, 1 - (space.get('price', 50) / 500))   # cheaper is better
    avail_score = min(1, space.get('slots', 0) / 20)            # more slots is better

    # Weighted composite score
    final_score = (0.5 * dist_score) + (0.3 * price_score) + (0.2 * avail_score)
    return round(final_score, 4)


@app.route('/nearest', methods=['POST'])
def nearest():
    """Rank parking spaces by composite score."""
    data = request.get_json()
    user_lat = data.get('user_lat')
    user_lng = data.get('user_lng')
    spaces = data.get('spaces', [])

    if not user_lat or not user_lng:
        return jsonify({'error': 'user_lat and user_lng required'}), 400

    scored = []
    for space in spaces:
        sc = score_parking(space, user_lat, user_lng)
        dist = haversine(user_lat, user_lng, space['lat'], space['lng'])
        scored.append({
            'id': space['id'],
            'score': sc,
            'distance_km': round(dist, 2)
        })

    scored = [s for s in scored if s['score'] >= 0]
    scored.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({
        'ranked': [s['id'] for s in scored],
        'details': scored
    })


@app.route('/distance', methods=['POST'])
def distance():
    """Calculate distance between two points."""
    data = request.get_json()
    dist = haversine(data['lat1'], data['lng1'], data['lat2'], data['lng2'])
    return jsonify({'distance_km': round(dist, 3), 'distance_m': round(dist * 1000)})


@app.route('/analytics/heatmap', methods=['POST'])
def heatmap():
    """Generate booking density heatmap data."""
    bookings = request.get_json().get('bookings', [])
    clusters = {}
    for b in bookings:
        key = f"{round(b['lat'], 2)},{round(b['lng'], 2)}"
        clusters[key] = clusters.get(key, 0) + 1
    result = [{'lat': float(k.split(',')[0]), 'lng': float(k.split(',')[1]), 'count': v} for k, v in clusters.items()]
    return jsonify({'heatmap': result})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'ParkMitra Python Service'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=True)
