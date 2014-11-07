#!/usr/bin/python

import logging
import cgi
import os
import socket
from BaseHTTPServer import HTTPServer
import SimpleHTTPServer
import urlparse
import unicodedata
import logging, logging.config

logging.config.fileConfig('pylog.conf')
logger = logging.getLogger('meshenger'+'.clientserve')

class ClientServeHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

  messageDir = "msg"

  def do_GET(self):
    """
Serve index and messages
"""

    if self.path == '/index' or self.path.startswith( "/"+self.messageDir ):
      return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)
    elif self.path == '/log':
      self.send_response(200)
      self.send_header('Content-type', 'text-html')
      self.end_headers()
      f = os.path.relpath('log/meshenger.log')
      with open( f, 'r') as the_file:
        self.wfile.write(the_file.read())
    elif self.path.startswith('/web'):

      f = os.path.relpath(self.path[1:])
      if not os.path.exists( f ) or os.path.isdir( f ):
        f = os.path.join('web', 'index.html')

      self.path = '/'+f
      return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    else:
      self.send_response(200) #serve the webapp on every url requested
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      f = os.path.relpath( 'webapp.html')
      with open( f, 'r') as the_file:
        self.wfile.write(the_file.read())


  def do_POST(self):
    """
Allow clients to post messages
"""
    if self.path == '/send':
      logger.info('incoming message from client!')
      length = int(self.headers['Content-Length'])
      post_data = urlparse.parse_qs(self.rfile.read(length).decode('utf-8'))

      self.writeMessage( post_data["time"][0].encode('ascii','ignore'), post_data["message"][0])

      self.send_response(200)
      self.send_header('Content-type', 'text/html')
      self.end_headers()
      self.wfile.write('message created')

      #let main rebuild message index
      try:
        logger.debug('try to call meshenger.build_index: %s', repr(meshenger))
        meshenger.build_index()
      except:
        logger.error('failed to call meshenger.build_index')
        pass

  def writeMessage(self, time, message):
    """
Write message to disk
"""
    f = os.path.join( self.messageDir, time)
    if os.path.isfile( f ):
      return
    with open( f, 'a') as the_file:
      the_file.write(message)


class ClientServe():
  def __init__(self, port):
    logger.info('ClientServe.__init__')
    server = HTTPServer( ('', port), ClientServeHandler)
    server.serve_forever()


def main():
  clientServe = ClientServe(80)

if __name__ == '__main__':
  main()
