#!/usr/bin/python

import logging
import cgi
import os
import socket
import BaseHTTPServer
import SimpleHTTPServer
import urlparse
import logging
import logging.config

logging.config.fileConfig('pylog.conf')
logger = logging.getLogger('meshenger'+'.nodeserve')

#GOTTMITTUNS

def _bare_address_string(self):
    host, port = self.client_address[:2]
    return '%s' % host

BaseHTTPServer.BaseHTTPRequestHandler.address_string = \
        _bare_address_string

#END

class NodeServeHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

  messageDir = "/msg"

  """
  Serve index and messages
  """
  def do_GET(self):
    if self.path == '/':
      self.path = "/index"

    if self.path == '/index' or self.path.startswith( self.messageDir ):
      return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    else:
      self.send_response(404)
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      self.wfile.write('404 - Not Found')

class HTTPServerV6(BaseHTTPServer.HTTPServer):
  address_family = socket.AF_INET6

class NodeServe():
  def __init__(self, port):
    server = HTTPServerV6(('::', port), NodeServeHandler)
    server.serve_forever()


def main():
  nodeServe = NodeServe(13338)

if __name__ == '__main__':
  main()
