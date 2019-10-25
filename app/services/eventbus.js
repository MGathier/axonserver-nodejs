const Rx = require('rxjs/Rx');
const EVENT_PATH = 'proto/event.proto';


const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const common = require('./common');
const eventPackageDefinition = protoLoader.loadSync(
        EVENT_PATH,
        common.grpcOptions());


const eventBus = grpc.loadPackageDefinition(eventPackageDefinition).io.axoniq.axonserver.grpc.event;

class EventBus {
    constructor(endpoint, meta, serializer, settings) {
        this.eventClient = new eventBus.EventStore(endpoint,
                                                         grpc.credentials.createInsecure());
        this.meta = meta;
        this.serializer = serializer;
        this.settings = settings;
    }

    openEventStream( position) {
        return new Rx.Observable( observer => {
            const call = this.eventClient.listEvents(this.meta);
            let requests_before_new_permits = 5;
            call.on('data', d => {
                let payload = this.serializer.deserialize(d.event.payload);
                observer.next(payload);
                requests_before_new_permits--;
                if (requests_before_new_permits === 0) {
                    call.write({"number_of_permits": 10});
                    requests_before_new_permits += 10;
                }
            });
            call.on('error', error => {
                console.error(error);
                observer.error(error);
            });
            call.on('end', () => {
                console.warn("Done");
                observer.complete();
            });
            call.write({"tracking_token": position, "number_of_permits": 10});
        });
    }

    appendEvents( events) {
        return new Promise((resolve,reject) => {
            const call = this.eventClient.appendEvent(this.meta, (err, response) => {
                if( err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });

            if( ! events.length) {
                call.write(events);
            } else {
                for (let i = 0; i < events.length; i++) {
                    call.write(events[i]);
                }
            }

            call.end();
        })
    }
}

module.exports = EventBus;
