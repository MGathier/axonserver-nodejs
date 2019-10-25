const Platform = require('./services/platform');
const CommandService = require('./services/commandbus');
const EventService = require('./services/eventbus');
const uuid = require('uuid/v1');
const grpc = require('grpc');
const serializer = require('./util/xml-serializer');
const settings = require("./settings");

const myArgs = process.argv.slice(2);
const platformEndpoint = myArgs.length > 0 ? myArgs[0] : "localhost:8124";

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const meta = new grpc.Metadata();
if(myArgs.length > 1) {
    meta.set('AxonIQ-Context', myArgs[1]);
}

if(myArgs.length > 2) {
    meta.set('AxonIQ-Access-Token', myArgs[2]);
}

let commandBus;
let eventBus;

function echoCommand(requestPayload) {
    return { "type": "string",
            "data": "Hello," + requestPayload.text
    };
}

function dispatchEcho(req,resp) {
    commandBus
            .dispatch("io.axoniq.sample.EchoCommand",
                      "io.axoniq.sample.EchoCommand", {
                            "text": req.params.text,
                        "id": uuid()
                      }, meta)
            .then(response => {
                resp.send(response);
            })
            .catch(err => resp.send(err));

}

function appendEvents(req, resp) {
    let events = [];
    let aggregateId = req.params.aggregate;
    let count = req.query.count ? req.query.count : 1;
    for( let i = 0 ; i < count; i++) {
        events.push( {
                         "message_identifier": uuid(),
                         "aggregate_identifier": aggregateId,
                         "aggregate_sequence_number": i,
                         "aggregate_type": "Demo",
                         "timestamp": Date.now(),
                         "payload": serializer.serialize( "io.axoniq.sample.EchoEvent",
                                            { "id": aggregateId,
                                                "text": "sampleText"}),
                     });
    }
    console.log(events);
    eventBus.appendEvents(events)
            .then(() => resp.send({"count": count, "aggregate": aggregateId}))
            .catch(err => {
                console.error(err);
                resp.send(err)
            });
}

let platformService = new Platform(platformEndpoint, meta, settings);


platformService.getPlatformServer()
        .then( endpoint  =>  {
    commandBus = new CommandService(endpoint, meta, serializer, settings);
    commandBus.subscribe("io.axoniq.sample.EchoCommand", echoCommand);

    eventBus = new EventService(endpoint, meta, serializer, settings);
    eventBus.openEventStream(0).subscribe( e => console.log(e));
});

app.route("/echo/:text").get(dispatchEcho);
app.route("/event/:aggregate").get(appendEvents);
app.listen(port);
console.log('RESTful API server started on: ' + port);


