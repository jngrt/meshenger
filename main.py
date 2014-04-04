#!/usr/bin/python

import socket, os, time, select, urllib, sys, threading 

class Meshenger:
  devices = [] #the list of all the nodes this this node has seen
  serve_port = 13338
  announce_port = 13337
  #own_ip = "0.0.0.0"
  msg_dir = os.path.relpath('msg/')
  exitapp = False #to kill all threads on


  def __init__(self):

    os.system("echo 1 >> /proc/sys/net/ipv6/conf/br-lan/disable_ipv6")
    self.own_ip = self.get_ip_adress()
    #self.own_ip = "192.168.2.196"


    try:
      #print 'discovering devices'
      d = threading.Thread(target=self.discover)
      d.daemon = True
      d.start()

      a = threading.Thread(target=self.announce)
      a.daemon = True
      a.start()

    except (KeyboardInterrupt, SystemExit):
      print 'exiting discovery thread'
      d.join()
      a.join()
      sys.exit()

    while True:

      if len(self.devices) > 0:
        print 'found', len(self.devices),'device(s) retreiving indices'
        for device in self.devices:
          nodepath = self.ip_to_hash(device)

          self.get_index(device, nodepath)

          self.get_messages(device, nodepath)
          print 'updating own index'
          self.build_index()
          
      time.sleep(5) #free process or ctrl+c
 

  def announce(self):
    """
    Announce the node's existance to other nodes
    """
    while not self.exitapp:
      print 'announcing'
      sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
      sock.sendto('bericht', ("ff02::1", self.announce_port))
      sock.close()
      time.sleep(5)

  def discover(self):
    """
    Discover other devices by listening to the Meshenger announce port
    """

    bufferSize = 1024 # whatever you need

    s = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.bind(('::', self.announce_port))
    s.setblocking(0)

    #global devices

    while not self.exitapp:
      print 'discovering'
      result = select.select([s],[],[])[0][0].recvfrom(bufferSize)
      if result[1][0] not in self.devices and result[1][0] != self.own_ip:
        self.devices.append(result[1][0])
        return
      time.sleep(1)

  def serve(self):

    # try:
    #   t = threading.Thread(target=BorderCheckWebserver, args=(self, ))
    #   t.daemon = True
    #   t.start()
    #   time.sleep(2)
    # except (KeyboardInterrupt, SystemExit):
    #   t.join()
    #   sys.exit()

    a = ''
    # serves both the index and the messages on the node over http
    # plus manages the client-side web interface

  def build_index(self):
    """
    Make an index file of all the messages present on the node.
    Save the time of the last update.
    """
    previous_index = []

    current_index = os.listdir(self.msg_dir)

    if current_index != previous_index:
      with open('index', 'wb') as index:
        for message in os.listdir(self.msg_dir):
          index.write(message)
          index.write('\n')
      with open('index_last_update', 'wb') as indexupdate:
        indexupdate.write(str(int(time.time())))
      current_index = previous_index

  def get_index(self,ip, path):
    """
    Download the indices from other nodes.
    """

    os.system('wget http://['+ip+'%adhoc0]:13338/index -O '+os.path.join(path,'index'))


  def get_messages(self, ip, path):
    """
    Get new messages from other node based on it's index file
    """

    with open(os.path.join(path,'index')) as index:
      index = index.read().split('\n')
      for message in index:
        messagepath = os.path.join(os.path.abspath(self.msg_dir), message)
        if not os.path.exists(messagepath):
          print 'downloading', message, 'to', messagepath
          os.system('wget http://['+ip+'%adhoc0]:13338/msg/'+message+' -O '+messagepath)


  def ip_to_hash(self, ip):
    """
    Convert a node's ip into a hash and make a directory to store it's files
    """
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
    """
    Hack to adhoc0's inet6 adress
    """
    if not os.path.isfile('interfaceip6adress'):
      os.system('ifconfig -a adhoc0 | grep inet6 > interfaceip6adress')

    with open('interfaceip6adress', 'r') as a:
      return a.read().split()[2].split('/')[0]



if __name__ == "__main__":
  print "test"  
  try:
    meshenger = Meshenger()
  except (KeyboardInterrupt, SystemExit):
    exitapp = True
    raise
