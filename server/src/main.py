
import threading, time
from datetime import datetime, timedelta
from dateutil import parser
from flask import Flask, request, jsonify, render_template
from flask_sse import sse
from flask_cors import CORS
import redis

PERIOD_IN_SECONDS_TO_NOTIFY_CLIENT_PRODUCT_NOT_BEING_SOLD: int = 10
current_user: str = None

app = Flask(__name__)
app.config["REDIS_URL"] = "redis://localhost"
app.register_blueprint(sse, url_prefix='/stream')
CORS(app)

class Server:
    products = []
    stock_flow = []
    users = {}


server = Server()

@app.route('/store_new_product', methods=['POST'])
def store_new_product():
    data = request.get_json()
    product_code = int(data.get('code'))
    quantity_to_store = int(data.get('quantity'))

    for product in server.products:
        if product['code'] == product_code:
            product['quantity'] += quantity_to_store
            data['quantity'] = product['quantity']
            print(f"Added {quantity_to_store} units to the product with code: {product_code}.")
            print(server.products)
            break
    else:
        data["last_time_sold"] = datetime.now()
        server.products.append(data)
        print(f"Added a new product with code {product_code}.")

    server.stock_flow.append({"operation": "product stored", "quantity": quantity_to_store, "time": datetime.now()})
    return jsonify({"status": "success", "message": "Product stored successfully"})



@app.route('/get_products_in_stock', methods=['GET'])
def get_products_in_stock():
    products_in_stock = []
    for product in server.products:
        if int(product['quantity']) > 0:
            products_in_stock.append({
                'product': product["name"],
                'quantity': product["quantity"]
            })

    return jsonify({"products_in_stock": products_in_stock})


@app.route('/get_stock_flow', methods=['POST'])
def get_stock_flow():
    data = request.get_json()
    period_in_seconds = int(data['period_in_seconds'])
    current_datetime = datetime.now()
    stock_flow_within_period = []

    for stock_event in reversed(Server.stock_flow):
        event_time = stock_event.get('time')

        if not isinstance(event_time, datetime): #checa se ta no formato certo (datetime)
            event_time = parser.isoparse(event_time)

        time_period = timedelta(seconds=period_in_seconds)
        result_datetime = current_datetime - time_period

        if event_time >= result_datetime:
            stock_flow_within_period.append({
                "operation": stock_event["operation"],
                "quantity": stock_event["quantity"],
                "time": stock_event["time"]
            })
        else:
            break

    return jsonify({"stock_flow_within_period": stock_flow_within_period})


@app.route('/get_products_without_movement', methods=['POST'])
def get_products_without_movement():
    data = request.get_json()
    period_in_seconds = int(data['period_in_seconds'])
    products_with_no_movement = get_products_without_movement_by_period(period_in_seconds)
    return jsonify({"products_with_no_movement": products_with_no_movement})


def get_products_without_movement_by_period(period_in_seconds):
    products_with_no_movement = []
    current_datetime = datetime.now()
    for product in server.products:
        if product.get('last_time_sold') is not None:
            last_time_sold = product.get('last_time_sold')
            time_period = timedelta(seconds=period_in_seconds)
            result_datetime = current_datetime - time_period

            if last_time_sold <= result_datetime:
                products_with_no_movement.append({
                    "product_name": product["name"],
                    "code": product["code"],
                    "last_movement": str(product["last_time_sold"])
                })
    return products_with_no_movement


@app.route('/subtract_product', methods=['POST'])
def subtract_product():
    data = request.get_json()
    product_code = data.get('code')
    quantity_to_subtract = int(data.get('quantity'))

    for product in server.products:
        if str(product['code']) == product_code:
            current_quantity = int(product.get('quantity', 0))

            if current_quantity >= quantity_to_subtract:
                new_quantity = current_quantity - quantity_to_subtract
                product['quantity'] = new_quantity

                server.stock_flow.append(
                    {"operation": "product subtracted", "quantity": quantity_to_subtract, "time": datetime.now()})
                product["last_time_sold"] = datetime.now()

                if new_quantity <= int(product.get('minimum_stock', 0)):
                    notify_client_product_minimum_stock(product)

                return jsonify({"status": "success", "message": "Product subtracted successfully"})
            else:
                return jsonify({"status": "error", "message": "Not enough products to subtract"})

    return jsonify({"status": "error", "message": "Product not found"})


@app.route('/register_user', methods=['POST'])
def register_user():
    data = request.get_json()
    name = data.get('name')

    if name in server.users:
        return jsonify({"status": "error", "message": "User already registered"})

    server.users[name] = data
    return jsonify({"status": "success", "message": "User registered"})

# Notify methods...
def start_monitoring_products_not_being_sold() -> [str]:
    print("Começando a monitorar produtos...")
    while True:
        time.sleep(PERIOD_IN_SECONDS_TO_NOTIFY_CLIENT_PRODUCT_NOT_BEING_SOLD)
        products_not_being_sold = get_products_without_movement_by_period(PERIOD_IN_SECONDS_TO_NOTIFY_CLIENT_PRODUCT_NOT_BEING_SOLD)

        if products_not_being_sold:
            with app.app_context():
                notify_client_product_not_being_sold(products_not_being_sold)

def notify_client_product_minimum_stock(product):
    print("Produto atingiu estoque mínimo! Notificar cliente.")
    sse.publish({ "code": product["code"], "product_name": product["name"],
                 "quantity_left": product['quantity'], "minimum_quantity": product['minimum_stock'] },
                type='product-emptying')

def notify_client_product_not_being_sold(products):
    print("Há produtos não sendo vendidos! Notificar clientes.")
    sse.publish({ "products": products }, type='product-not-being-sold')



@app.route('/test-publish-event', methods=['POST'])
def publish_event():
    sse.publish({"message": "example_message"}, type='example')
    return "Event published"

if __name__ == '__main__':
    #thread to monitor products
    thread = threading.Thread(target=start_monitoring_products_not_being_sold) 
    thread.start()
    app.run(debug=False, host='0.0.0.0', port=5000)