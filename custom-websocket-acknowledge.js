module.exports = function (RED) {
  function websocketAcknowledgeNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    node.on('input', function (msg) {
      const message = msg.streaming_msg;
      msg.websocket(JSON.stringify(['message-ack', message[1], message[2]]));
      node.log('message acknowledged: ' + message[1] + ', ' + message[2]);
    });
  }
  RED.nodes.registerType(
    'custom-websocket-acknowledge',
    websocketAcknowledgeNode
  );
}
