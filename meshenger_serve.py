#!/usr/bin/python

import logging
import cgi
import os
import socket
from BaseHTTPServer import HTTPServer
import SimpleHTTPServer
import urlparse


class MeshengerHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

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


  """
  Allow clients to post messages
  """
  def do_POST(self):
    if self.path == '/send':

      length = int(self.headers['Content-Length'])
      post_data = urlparse.parse_qs(self.rfile.read(length).decode('utf-8'))
      self.writeMessage( post_data["time"][0], post_data["message"][0])

      self.send_response(200)
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      self.wfile.write('message created')

  def writeMessage(self, time, message):

    f = os.path.join( self.message, time)
    if os.path.isfile( f ):
      return
    with open( f, 'a') as the_file:
      the_file.write(message)


class HTTPServerV6(HTTPServer):
  address_family = socket.AF_INET6

class MeshengerServe():
  def __init__(self, port):
    server = HTTPServerV6(('::', port), MeshengerHandler)
    server.serve_forever()


def main():
  clientServe = MeshengerServe(80)
  nodeServe = MeshengerServe(13338)

if __name__ == '__main__':
  main()
