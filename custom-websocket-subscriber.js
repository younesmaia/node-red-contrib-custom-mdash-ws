module.exports = function (RED) {
  function websocketSubscriberNode(config) {
    const WebSocket = require('ws');
    RED.nodes.createNode(this, config);
    let node = this;
    let nodeInstance = null;
    let nodeIsClosing = false;
    let reconnectTimer = null;
    const connectToServer = () => {
      //Create WebSocket Connection
      node.log('Create websocket');
      const ws = new WebSocket(`${config.url}`, { origin: `${config.url}` });
      //Connection failed
      ws.onerror = function (err) {
        node.log(err);
        node.error('Could not connect to server', err);
      };
      //Connected
      ws.onopen = function () {
        setStatusGreen();
        node.log('connected');
      };
      //Connection closed
      ws.onclose = function () {
        setStatusRed();
        if (reconnectTimer !== null) {
          clearTimeout(reconnectTimer);
        }
        node.log('Connection closed');
      };
      //Message incoming
      ws.on('message', (msg) => handleMessage(msg));
      function handleMessage(msg) {
        const msgToSend = {
          streaming_msg: msg,
          websocket: ws.send.bind(ws)
        };
        node.send(msgToSend);
      }
      return ws;
    };
    //ReconnectHandler
    (function reconnectHandler() {
      nodeInstance = connectToServer();
      nodeInstance.on('close', () => {
        setStatusRed();
        if (reconnectTimer === null && nodeIsClosing === false) {
          node.log('close received. Explicit reconnect attempt in 60 seconds.');
          reconnectTimer = setTimeout(() => {
            reconnectHandler();
            reconnectTimer = null;
          }, 60000);
        } else {
          node.log('Node in flow is shutting down, not attempting to reconenct.');
        }

        nodeInstance = null;
      });
    })();
    node.on('close', function (done) {
      setStatusRed();
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      nodeIsClosing = true;
      done();
    });
    //Set status connected
    function setStatusGreen() {
      node.status({
        fill: 'green',
        shape: 'dot',
        text: 'connected'
      });
    }
    //Set status disconnected
    function setStatusRed() {
      node.status({
        fill: 'red',
        shape: 'ring',
        text: 'disconnected'
      });
    }
  }
  RED.nodes.registerType('custom-websocket-subscriber',websocketSubscriberNode);
}
