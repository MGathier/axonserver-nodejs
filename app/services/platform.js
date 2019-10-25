const CONTROL_PATH = 'proto/control.proto';

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const common = require('./common');

const controlPackageDefinition = protoLoader.loadSync(
        CONTROL_PATH,
        common.grpcOptions());

const control = grpc.loadPackageDefinition(controlPackageDefinition).io.axoniq.axonserver.grpc.control;

class Platform {

    constructor(controlEndpoint, meta, settings) {
        this.client = new control.PlatformService(controlEndpoint,
                                                   grpc.credentials.createInsecure());

        this.meta = meta;
        this.controlEndpoint = controlEndpoint;
        this.settings = settings;
    }


    getPlatformServer() {
        return new Promise((resolve, reject) => {
            let request = {"client_id": this.settings.clientId(), "component_name": this.settings.componentName()}
            let me = this;
            this.client.getPlatformServer(request, this.meta, function (err, platformInfo) {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                } else {
                    var endpoint;
                    console.warn(platformInfo);
                    if (platformInfo.same_connection) {
                        endpoint = me.controlEndpoint;
                    } else {
                        endpoint = platformInfo.primary.host_name + ":" + platformInfo.primary.grpc_port;
                        me.client = new control.PlatformService(endpoint,
                                                                  grpc.credentials.createInsecure());
                    }
                    me.openStream();

                    resolve(endpoint)
                }
            });
        });
    }

    openStream() {
        this.controlStream = this.client.openStream(this.meta);
        let call = this.controlStream;
        call.on('data', function(d) {
            console.info(d);
        });

        call.on('error', function(d) {
            console.error(d);
        });

        call.on('end', function() {
            console.warn("Done");
        });

        call.write({"register": {
                "client_id": this.settings.clientId(),
                "component_name": this.settings.componentName()
            }});

    }
}

module.exports = Platform;

