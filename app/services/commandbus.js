const COMMAND_PATH = 'proto/command.proto';

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const uuid = require('uuid/v1');
const common = require('./common');

const commandPackageDefinition = protoLoader.loadSync(
        COMMAND_PATH,
        common.grpcOptions());

const commandPackageObject = grpc.loadPackageDefinition(commandPackageDefinition).io.axoniq.axonserver.grpc.command;

class CommandBus {
    constructor(endpoint, meta, serializer, settings) {
        this.commandClient = new commandPackageObject.CommandService(endpoint,
                                                           grpc.credentials.createInsecure());
        this.subscriptions = [];
        this.meta = meta;
        this.serializer = serializer;
        this.settings = settings;
    }

    openCommandStream() {
        let call = this.commandClient.openStream(this.meta);
        let me = this;
        call.on('data', function(d) {
            if (d.command) {
                let operation = me.subscriptions[d.command.name];
                if( operation) {
                    let payload = me.serializer.deserialize(d.command.payload);
                    let reply = operation(payload);
                    console.debug(JSON.stringify(reply));
                    let response = {
                        "command_response":
                                {
                                    "request_identifier": d.command.message_identifier,
                                    "payload": me.serializer.serialize(reply.type, reply.data)
                                }
                    };
                    call.write(response);
                }
            }
        });

        call.on('error', function(d) {
            console.error(d);
        });

        call.on('end', function() {
            console.warn("Done");
        });

        call.write( {
                        "flow_control": {
                            "client_id": this.settings.clientId(),
                            "permits": 100
                        }
                    });
        this.call = call;
    }

    subscribe(command, action) {
        if( ! this.call ) this.openCommandStream();
        this.subscriptions[command] = action;
        this.call.write({"subscribe": {
                "command": command,
                "client_id": this.settings.clientId(),
                "component_name": this.settings.componentName(),
            }})
    }

    dispatch(name, payloadType, payload) {
        const command = {
            "message_identifier": uuid(),
            "name": name,
            "payload": this.serializer.serialize(payloadType, payload),
            "client_id": this.settings.clientId(),
            "component_name": this.settings.componentName()
        };

        return new Promise((resolve, reject) => {
            this.commandClient.dispatch(command, this.meta,  (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    if (response.error_message) {
                        reject(response.error_message);
                        return;
                    }
                    let data = this.serializer.deserialize(response.payload);
                    resolve(data);
                }
            });
        });
    }

}

module.exports = CommandBus;
