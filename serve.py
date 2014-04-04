#!/usr/bin/python

import logging
import cgi
import os
import socket
from BaseHTTPServer import HTTPServer
import SimpleHTTPServer
import urlparse


class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
  def do_GET(self):
    if self.path == '/ip':
      self.send_response(200)
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      self.wfile.write('Your IP address is %s' % self.client_address[0])
      return
    elif self.path == '/huh':
      self.send_response(200)
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      self.wfile.write('huh')
      return
    else:
      return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

  def do_POST(self):

    if self.path == 'send'

      length = int(self.headers['Content-Length'])
      post_data = urlparse.parse_qs(self.rfile.read(length).decode('utf-8'))
      self.writeMessage( post_data["time"][0], post_data["message"][0])

      self.send_response(200)
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      self.wfile.write('message created')

  def writeMessage(self, time, message):

    f = os.path.join( "msg", time)
    if os.path.isfile( f ):
      return
    with open( f, 'a') as the_file:
      the_file.write(message)


class HTTPServerV6(HTTPServer):
  address_family = socket.AF_INET6

def main():
  server = HTTPServerV6(('::', 13338), MyHandler)
  server.serve_forever()

if __name__ == '__main__':
  main()
