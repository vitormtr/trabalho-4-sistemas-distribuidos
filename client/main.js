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
    return new Promise((resolve, reject) => {
      rl.question("Seu nome: ", (name) => {
        const postData = {
          'name': name
        };
  
        axios.post(API_URL + '/register_user', postData)
          .then(response => {
            console.log(response.data['message']);
            resolve(); 
          })
          .catch(error => {
            console.error('Erro:', error);
            reject(error); 
          });
      });
    });
  }

function readProductFromInput() {
    return new Promise((resolve) => {
      rl.question("Código do produto: ", (code) => {
        rl.question("Nome do produto: ", (name) => {
          rl.question("Descrição do produto: ", (description) => {
            rl.question("Quantidade: ", (quantity) => {
              rl.question("Preço da unidade: ", (unitPrice) => {
                rl.question("Estoque mínimo: ", (minimumStock) => {
                  const product = {
                    code,
                    name,
                    description,
                    quantity,
                    unit_price: unitPrice,
                    minimum_stock: minimumStock,
                    date: getCurrentDateTime(),
                  };
                  resolve(product);
                });
              });
            });
          });
        });
      });
    });
  }


function readProductToSubtractFromInput() {
    return new Promise((resolve, reject) => {
      rl.question("Código do produto: ", (code) => {
        rl.question("Quantidade a subtrair: ", (quantityToSubtract) => {
          if (isNaN(quantityToSubtract) || quantityToSubtract <= 0) {
            reject(new Error('Quantidade invalida.'));
          } else {
            const postData = {
              code,
              quantity: quantityToSubtract,
              date: getCurrentDateTime(),
            };
  
            axios.post(API_URL + '/subtract_product', postData)
              .then(response => {
                console.log(response.data['message']);
                resolve(); 
              })
              .catch(error => {
                console.error('Error:', error);
                reject(error); 
              });
          }
          rl.close();
        });
      });
    });
  }

//function checkIfThereIsAUserRegistered() {
//    if (current_user === null) {
//        console.log("Erro: deve existir um usuário previamente registrado para fazer requisições.");
//        return false;
//    } else {
//       return true;
//    }
//}

function listProductsInStock() {
    return new Promise((resolve, reject) => {
      axios.get(API_URL + '/get_products_in_stock')
        .then(response => {
          console.log(response.data);
          resolve(response.data);
        })
        .catch(error => {
          console.error('Erro:', error);
          reject(error);
        });
    });
  }

  function getStockFlowByPeriod() {
    return new Promise((resolve, reject) => {
      rl.question("Periodo em segundos: ", (periodInSeconds) => {
        if (isNaN(periodInSeconds) || periodInSeconds <= 0) {
          reject(new Error('Periodo invalido.'));
        } else {
          const postData = {
            'period_in_seconds': periodInSeconds
          };
    
          axios.post(API_URL + '/get_stock_flow', postData)
            .then(response => {
              console.log(response.data);
              resolve(response.data);
            })
            .catch(error => {
              console.error('Erro:', error);
              reject(error);
            });
        }
      });
    });
  }
  

  function getProductsWithoutMovimentationByPeriod() {
    return new Promise((resolve, reject) => {
      rl.question("Periodo em segundos: ", (periodInSeconds) => {
        if (isNaN(periodInSeconds) || periodInSeconds <= 0) {
          reject(new Error('Periodo invalido.'));
        } else {
          const postData = {
            'period_in_seconds': periodInSeconds
          };
  
          axios.post(API_URL + '/get_products_without_movement', postData)
            .then(response => {
              console.log(response.data);
              resolve(response.data);
            })
            .catch(error => {
              console.error('Error:', error);
              reject(error);
            });
        }
      });
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

    rl.question("Entre com a sua opção: ", async (choice) => {
        if (choice === '1') {
            try {
                await readUserFromInput(); //espera chamada da api terminar
            } catch (error) {
                console.error('Erro:', error);                
            }
            menu();
        } else if (choice === '2') {
            try {
              const product = await readProductFromInput(); 
              console.log("Informações do produto recebidas:", product);
            } catch (error) {
              console.error('Erro:', error);
            }
            menu();
          } else if (choice === '3') {
            try {
              const productToSubtract = await readProductToSubtractFromInput();
              console.log("Informações recebidas:", productToSubtract);
            } catch (error) {
              console.error('Erro:', error);
            }
            menu();
          } else if (choice === '4') {
            try {
              await listProductsInStock();
            } catch (error) {
              console.error('Erro:', error);
            }
            menu();
          } else if (choice === '5') {
            try {
              await getStockFlowByPeriod();
            } catch (error) {
              console.error('Erro:', error);
            }
            menu();
          } else if (choice === '6') {
            try {
              await getProductsWithoutMovimentationByPeriod();
            } catch (error) {
              console.error('Erro:', error);
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
