import { IncomingMessage, Server, ServerResponse } from 'http';

function attachRootListener(server: Server) {
  // This code is based on the way an existing server is modified in socket.io.
  // https://github.com/socketio/socket.io/blob/2a1aa1c59c39e9a2b6a0e1996b6ff0cceb1ec61d/lib/index.js#L329
  var evs = server.listeners('request').slice(0);
  server.removeAllListeners('request');
  server.on('request', function(req: IncomingMessage, res: ServerResponse) {
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.write('dothemath-app-backend is alive and kicking!');
      res.end();
    } else {
      for (var i = 0; i < evs.length; i++) {
        evs[i].call(server, req, res);
      }
    }
  });
}

export default attachRootListener;
