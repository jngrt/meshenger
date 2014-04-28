#!/usr/bin/python

import logging
import cgi
import os
import socket
from BaseHTTPServer import HTTPServer
import SimpleHTTPServer
import urlparse


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

class HTTPServerV6(HTTPServer):
  address_family = socket.AF_INET6

class NodeServe():
  def __init__(self, port):
    server = HTTPServerV6(('::', port), NodeServeHandler)
    server.serve_forever()


def main():
  nodeServe = NodeServe(13338)

if __name__ == '__main__':
  main()
