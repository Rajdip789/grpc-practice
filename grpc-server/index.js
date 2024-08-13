const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const customers = require('./customers');
const { v4: uuidv4 } = require('uuid');

const PROTO_PATH = './customers.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

const customersProto = grpc.loadPackageDefinition(packageDefinition);
const server = new grpc.Server();

server.addService(customersProto.CustomerService.service, {
    getAll: (call, callback) => {
        callback(null, {customers});
    },
    get: (call, callback) => {
        let customer = customers.find(n => n.id == call.request.id);

        if(customer) {
            callback(null, customer);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            })
        }
    },
    insert: (call, callback) => {
        let customer = call.request;
        
        customer.id = uuidv4();
        customers.push(customer);
        callback(null, customer);
    },
    update: (call, callback) => {
        let existingCustomer = customers.find(n => n.id == call.request.id);

        if (existingCustomer) {
            existingCustomer.name = call.request.name;
            existingCustomer.age = call.request.age;
            existingCustomer.address = call.request.address;
            callback(null, existingCustomer);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },
    remove: (call, callback) => {
        let existingCustomerIndex = customers.findIndex(
            n => n.id == call.request.id
        );

        if (existingCustomerIndex != -1) {
            customers.splice(existingCustomerIndex, 1);
            callback(null, {});
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    }
})

server.bindAsync('127.0.0.1:30043', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        console.error(`Error starting gRPC server: ${err}`);
      } else {
        console.log(`gRPC server is listening on ${port}`);
    }
})