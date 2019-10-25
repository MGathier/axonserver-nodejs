const os = require('os');
const CLIENT_ID = process.pid + "@" + os.hostname();
const COMPONENT_NAME = "axonserver-nodejs";


exports.clientId = () => CLIENT_ID;
exports.componentName = () => COMPONENT_NAME;

