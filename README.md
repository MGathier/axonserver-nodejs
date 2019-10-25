# AxonServer and NodeJS

Although AxonServer is primarily created for connecting Axon Framework applications, it is possible to use it from other 
environments. In this sample project I demonstrate the use of Axon Server from a NodeJS client. 
The client is capable of:
* sending commands and queries to other applications, which may be Java Axon Framework applications, or other NodeJS clients
connected to Axon Server.
* receiving commands and queries from other applications, both Java Axon Framework based and others.
* storing and reading events from the event store.

It is by no mean an attempt to fully implement the full Axon Framework functionality in Javascript.

## Getting started with gRPC

As the communication with Axon Server is done using gRPC, a few notes on how this is implemented in this sample.
The sample uses the dynamic code generation for protocol bufffers at runtime. Using statically generated code would 
produce very similar code.

The basic code for creating a protobuf client is:
```javascript
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
        PROTO_FILE,
        OPTIONS);

const packageObject = grpc.loadPackageDefinition(packageDefinition).<package>;
```   

From the package object the service is created using the packageObject. 
```javascript
service = new packageObject.<ServiceName>(<endpoint>, grpc.credentials.createInsecure())
``` 

The credentials object passed in the constructor of the schema is either the createInsecure() as used above or createSsl() 
when Axon Server is set up for communicating using TLS. Axon Server does not use the client certificates or google authentication.

## Connecting to Axon Server

## Submitting Commands

## Submitting Queries

## Handling Commands

## Handling Queries

## Submitting Events

## Reading Events


