#!/usr/bin/python

import socket, os, time, select, urllib, sys

class Meshenger:
  devices = [] #the list of all the nodes this this node has seen
  serve_port = 13338
  announce_port = 13337
  #own_ip = "0.0.0.0"
  msg_dir = os.path.relpath('msg/')


  def __init__(self):

    os.system("echo 1 >> /proc/sys/net/ipv6/conf/br-lan/disable_ipv6")
    self.own_ip = self.get_ip_adress()
    #self.own_ip = "192.168.2.196"

    while True:

      print 'discovering devices'
      time.sleep(1)
      self.discover()

      if len(self.devices) > 0:
      print 'found', len(self.devices),'device(s) retreiving indices'
      for device in self.devices:
        nodepath = ip_to_hash(device)

        self.get_index(device, nodepath)

        self.get_messages(device, nodepath)
        print 'updating own index'
        self.build_index()
        
      time.sleep(5)


  def announce(self):

    #announces it's existance to other nodes
    sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.sendto(bericht, ("ff02::1", self.announce_port))
    sock.close()

  def index(self):

    a = ''
    # builds the latest index of all the messages that are on this node

  def discover(self):

    # discovers other nodes by listening to the Meshenger announce port
    bufferSize = 1024 # whatever you need

    s = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.bind(('::', self.announce_port))
    s.setblocking(0)

    #global devices

    while True:
      result = select.select([s],[],[])[0][0].recvfrom(bufferSize)
      if result not in self.devices and result[1][0] != self.own_ip:
        self.devices.append(result[1][0])
        return
      time.sleep(1)

  def serve(self):

    a = ''
    # serves both the index and the messages on the node over http
    # plus manages the client-side web interface

  def build_index(self):
    previous_index = []

    current_index = os.listdir(msg_dir)

    if current_index != previous_index:
      with open('index', 'wb') as index:
        for message in os.listdir(msg_dir):
          index.write(message)
          index.write('\n')
      with open('index_last_update', 'wb') as indexupdate:
        indexupdate.write(str(int(time.time())))
      current_index = previous_index

  def get_index(self,ip, path):

    os.system('wget http://['+ip+'%adhoc0]:13338/index -O '+os.path.join(path,'index'))

    # downloads the index from other nodes and then proceeds to downloads messages it doesn't have already

  def get_messages(self, ip, path):

    with open(os.path.join(path,'index')) as index:
      index = index.read().split('\n')
      for message in index:
        messagepath = os.path.join(os.path.abspath(msg_dir), message)
        if not os.path.exists(messagepath):
          print 'downloading', message, 'to', messagepath
          os.system('wget http://['+ip+'%adhoc0]:13338/msg/'+message+' -O '+messagepath)


    # s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)

    # s.connect(('http://[fe80::6666:b3ff:feeb:68c2%adhoc0]/lijst', 13338))

    # s.send("GET / HTTP/1.0\r\n\r\n")

    # while 1:
    #   buf = s.recv(1000)
    #   if not buf:
    #       break
    #   sys.stdout.write(buf)

    # s.close()

  def ip_to_hash(self, ip):
    import hashlib
    hasj = hashlib.md5(ip).hexdigest()
    nodepath = os.path.join(os.path.abspath('nodes/'), hasj)
    if not os.path.exists(nodepath):
      os.mkdir(nodepath)

    return nodepath


  def clientsite(self):
    a = ''

    #tools

  def get_ip_adress(self):
    if not os.path.isfile('interfaceip6adress'):
      os.system('ifconfig -a adhoc0 | grep inet6 > interfaceip6adress')

    with open('interfaceip6adress', 'r') as a:
      return a.read().split()[2].split('/')[0]



  if __name__ == "__main__":
    print "test"
    meshenger = Meshenger()
