const converter = require('xml-js');
const xml2js = require('xml2js');

function serialize( type, object) {
    let wrapped = {};
    wrapped[type] = object;
    let xml = converter.js2xml(wrapped, {compact: true, ignoreComment: true, spaces: 4});

    return {
        "type": type,
        "data": Buffer.from(xml)
    };
}

function deserialize( serializedType) {
    let xml = serializedType.data.toString();
    let result = null;
    xml2js.parseString(xml, { explicitArray : false }, (err,data) => {
        if( err) throw err;
        result = data[serializedType.type];
    });
    return result;
}

exports.deserialize = (serializedType) => deserialize(serializedType);
exports.serialize = (type,object) => serialize(type, object);