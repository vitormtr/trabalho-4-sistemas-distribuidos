const readline = require('readline');
const axios = require('axios');
const EventSource = require('eventsource')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_URL = 'http://127.0.0.1:5000';

const source = new EventSource(API_URL + '/stream');
source.onopen = e => console.log("Conexão com server aberta, escutando notificações");
source.onerror = e => console.log("Erro: Verifique a conexão com o server, pode ser que o redis não esteja rodando...");
source.onmessage = e => console.log('onmessage');

source.addEventListener("product-not-being-sold", (event) => {
    console.log("product-not-being-sold!", event);
});

source.addEventListener("product-emptying", (event) => {
    console.log("product-emptying!", event);
});

const current_user = null;

function getCurrentDateTime() {
    const currentDatetime = new Date();
    return currentDatetime.toISOString().slice(0, 19).replace('T', ' ');
}

function readUserFromInput() {
    rl.question("Entre com seu nome: ", (name) => {
        const current_user = { name };
        console.log(current_user);

        const postData = {
            'name': name
        };

        axios.post(API_URL + '/register_user', postData)
        .then(response => {
            console.log(response.data['message']);
        })
        .catch(error => {
            console.error('Error:', error);
        });
        rl.close();
    });
}

function readNewUserAndSendToServer() {
    rl.question("Registrar Usuário? (S/N) ", (answer) => {
        if (answer.toLowerCase() === 's') {
            readUserFromInput();
        } else {
            console.log("Operação cancelada.");
            rl.close();
        }
    });
}

function readProductFromInput() {
    rl.question("Entre com o codigo do produto: ", (code) => {
        rl.question("Entre com o nome do produto: ", (name) => {
            rl.question("Entre com a descrição do produto: ", (description) => {
                rl.question("Entre com a quantidade de produtos: ", (quantity) => {
                    rl.question("Entre com o preço da unidade: ", (unitPrice) => {
                        rl.question("Entre com o estoque minimo: ", (minimumStock) => {
                            const product = {
                                code,
                                name,
                                description,
                                quantity,
                                unit_price: unitPrice,
                                minimum_stock: minimumStock,
                                date: getCurrentDateTime(),
                            };
                            axios.post(API_URL + '/store_new_product', product)
                            .then(response => {
                                console.log(response.data['message']);
                            })
                            .catch(error => {
                                console.error('Error:', error);
                            });
                            rl.close();
                        });
                    });
                });
            });
        });
    });
}

function readNewProductAndSendToServer() {
    if (current_user === null) {
        console.log("Erro: deve existir um usuário previamente registrado para fazer requisições.");
        rl.close();
        return;
    }

    rl.question("Armazenar Produto? (S/N) ", (answer) => {
        if (answer.toLowerCase() === 's') {
            readProductFromInput();
        } else {
            console.log("Operação cancelada.");
            rl.close();
        }
    });
}

function readProductToSubtractFromInput() {
    rl.question("Entre com o codigo do produto a ser subtraido: ", (code) => {
        rl.question("Entre com a quantidade a ser subtraida: ", (quantityToSubtract) => {
            const postData = {
                code,
                quantity: quantityToSubtract,
                date: getCurrentDateTime(),
            };

            axios.post(API_URL + '/subtract_product', postData)
            .then(response => {
                console.log(response.data['message']);
            })
            .catch(error => {
                console.error('Error:', error);
            });
            rl.close();
        });
    });
}

function readProductToSubtractAndSendToServer() {
    if (current_user === null) {
        console.log("Erro: deve existir um usuário previamente registrado para fazer requisições.");
        rl.close();
        return;
    }

    rl.question("Lançamento de saída de produto? (S/N) ", (answer) => {
        if (answer.toLowerCase() === 's') {
            readProductToSubtractFromInput();
        } else {
            console.log("Operação cancelada.");
            rl.close();
        }
    });
}

function checkIfThereIsAUserRegistered() {
    if (current_user === null) {
        console.log("Erro: deve existir um usuário previamente registrado para fazer requisições.");
        return false;
    } else {
        return true;
    }
}

function listProductsInStock() {
    axios.get(API_URL + '/get_products_in_stock')
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function getStockFlowByPeriod(periodInSeconds) {
    const postData = {
        'period_in_seconds': periodInSeconds
    }
    axios.post(API_URL + '/get_stock_flow', postData)
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
        
}

function get_products_without_movimentation_by_period(periodInSeconds) {
    const postData = {
        'period_in_seconds': periodInSeconds
    }
    axios.post(API_URL + '/get_products_without_movement', postData)
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

async function menu() {
    console.log("\nMenu:");
    console.log("1. Registrar Usuario");
    console.log("2. Armazenar Produto");
    console.log("3. Lançamento de saida de produto");
    console.log("4. Listar produtos em estoque");
    console.log("5. Mostrar fluxo do estoque por periodo");
    console.log("6. Mostrar produtos sem movimentação por periodo");
    console.log("7. Sair");

    rl.question("Entre com a sua opção: ", (choice) => {
        if (choice === '1') {
            readNewUserAndSendToServer();
            menu();
        } else if (choice === '2') {
            readNewProductAndSendToServer();
            menu();
        } else if (choice === '3') {
            readProductToSubtractAndSendToServer();
            menu();
        } else if (choice === '4') {
            if (checkIfThereIsAUserRegistered()) {
                listProductsInStock();
            }
            menu();
        } else if (choice === '5') {
            if (checkIfThereIsAUserRegistered()) {
                periodInSeconds = int(input("Entre com o tempo em segundos: "))
                getStockFlowByPeriod(periodInSeconds);
            }
            menu();
        } else if (choice === '6') {
            if (checkIfThereIsAUserRegistered()) {
                periodInSeconds = int(input("Entre com o tempo em segundos: "))
                get_products_without_movimentation_by_period(periodInSeconds);
            }
            menu();
        } else if (choice === '7') {
            rl.close();
        } else {
            console.log("Opção Inválida.");
            menu();
        }
    });
}

menu();
