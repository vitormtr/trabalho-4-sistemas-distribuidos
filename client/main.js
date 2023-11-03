const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const current_user = null; 
const private_key = null; 

function getCurrentDateTime() {
    const currentDatetime = new Date();
    return currentDatetime.toISOString().slice(0, 19).replace('T', ' ');
}

function readUserFromInput() {
    rl.question("Entre com seu nome: ", (name) => {
        rl.question("Entre com sua chave publica: ", (publicKey) => {
            rl.question("Entre com o URI remoto: ", (remoteUri) => {
                const current_user = { name, public_key: publicKey, remote_uri: remoteUri };
                console.log(current_user);
                rl.close();
            });
        });
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
                            console.log(product);
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
            const subtractRequest = {
                code,
                quantity: quantityToSubtract,
                date: getCurrentDateTime(),
            };
            console.log(subtractRequest);
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

function menu() {
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
            console.log("asd")
            readNewUserAndSendToServer();
        } else if (choice === '2') {
            readNewProductAndSendToServer();
        } else if (choice === '3') {
            readProductToSubtractAndSendToServer();
        } else if (choice === '4') {
            if (checkIfThereIsAUserRegistered()) {
                console.log("Listar produtos em estoque.");
            }
            menu();
        } else if (choice === '5') {
            if (checkIfThereIsAUserRegistered()) {
                console.log("Mostrar fluxo do estoque por periodo.");
            }
            menu();
        } else if (choice === '6') {
            if (checkIfThereIsAUserRegistered()) {
                console.log("Mostrar produtos sem movimentação por periodo.");
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
