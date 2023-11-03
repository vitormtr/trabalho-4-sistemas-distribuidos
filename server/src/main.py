
import json
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
app = Flask(__name__)



class Server:
    products = []
    stock_flow = []
    users = {}

server = Server()

@app.route('/store_new_product', methods=['POST'])
def store_new_product():
    data = request.get_json()
    product_code = data.get('code')
    quantity_to_store = data.get('quantity')

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

@app.route('/get_products', methods=['GET'])
def get_products():
    return jsonify({"products": Server.products})

@app.route('/subtract_product', methods=['POST'])
def subtract_product():
    data = request.get_json()
    product_code = data.get('code')
    quantity_to_subtract = data.get('quantity')

    print("Product codes:")
    for product in server.products:
        print(product['code'])
        if product['code'] == product_code:
            current_quantity = int(product.get('quantity', 0))
            quantity_to_subtract = int(quantity_to_subtract)
            if current_quantity >= quantity_to_subtract:
                product['quantity'] -= quantity_to_subtract
                server.stock_flow.append(
                    {"operation": "product subtracted", "quantity": quantity_to_subtract, "time": datetime.now()})
                print(f"Subtracted {quantity_to_subtract} units from the product with code: {product_code}.")

                product["last_time_sold"] = datetime.now()

                if current_quantity - quantity_to_subtract <= int(product.get('minimum_stock', 0)):
                    print("Notify client")
                    # Perform client notification here

                print(server.products)
                return jsonify({"status": "success", "message": "Product subtracted successfully"})
            else:
                return jsonify({"status": "error", "message": "Not enough products to subtract"})
    return jsonify({"status": "error", "message": "Product not found"})

@app.route('/register_user', methods=['POST'])
def register_user():
    data = request.get_json()
    public_key = data.get('public_key')
    name = data.get('name')

    if public_key in server.users:
        return jsonify({"status": "error", "message": "User already registered"})

    server.users[public_key] = {"public_key": public_key, "name": name}
    return jsonify({"status": "success", "message": "User registered"})

if __name__ == '__main__':
    app.run(debug=True)

