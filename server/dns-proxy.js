const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const UPSTREAM = '10.0.0.4';

server.on('message', (msg, rinfo) => {
  const client = dgram.createSocket('udp4');
  client.send(msg, 53, UPSTREAM, (err) => {
    if (err) client.close();
  });
  client.on('message', (res) => {
    server.send(res, rinfo.port, rinfo.address);
    client.close();
  });
});
server.bind(53, '127.0.0.1');
console.log('DNS Proxy listening on 127.0.0.1:53 forwarding to ' + UPSTREAM);
