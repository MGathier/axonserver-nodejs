function serialize( type, object) {
    return {
        "type": type,
        "data": Buffer.from(JSON.stringify(object))
    };
}

function deserialize( serializedType) {
    return JSON.parse( serializedType.data.toString());
}

exports.deserialize = (serializedType) => deserialize(serializedType);
exports.serialize = (type,object) => serialize(type, object);