#!/usr/bin/python

import socket, os, time, select, urllib, sys, threading 

class Meshenger:
  devices = {} #the dictionary of all the nodes this this node has seen
  serve_port = 13338
  announce_port = 13337
  #own_ip = "0.0.0.0"
  msg_dir = os.path.relpath('msg/')
  exitapp = False #to kill all threads on
  index_last_update = ''


  def __init__(self):

    os.system("echo 1 >> /proc/sys/net/ipv6/conf/br-lan/disable_ipv6")
    self.own_ip = self.get_ip_adress()

    if not os.path.exists(self.msg_dir):
      os.mkdir(self.msg_dir)
      print 'Making message directory'

    print 'Building own index for the first time\n'
    self.build_index()

    try:
      d = threading.Thread(target=self.discover)
      d.daemon = True
      d.start()

      a = threading.Thread(target=self.announce)
      a.daemon = True
      a.start()

      s = threading.Thread(target=self.serve)
      s.daemon = True
      s.start()

    except (KeyboardInterrupt, SystemExit):
      print 'exiting discovery thread'
      d.join()
      a.join()
      sys.exit()

    while True:

      if len(self.devices) > 0:
        print 'found', len(self.devices),'device(s) retreiving indices'

        for device in self.devices:
          nodepath = self.ip_to_hash(device)  #make a folder for the node (nodes/'hash'/)
          nodeupdatepath = self.node_timestamp(device, nodepath) #contains the path to the update timestamp of the node (nodes/'hash'/lastupdate)

          print 'Checking age of foreign node index'
          if self.devices[device] > nodeupdatepath:
            print 'Foreign node"s index is newer, proceed to download index' 
            self.get_index(device, nodepath)
            print 'downloading messages'
            self.get_messages(device, nodepath)
            print 'updating own index'
            self.build_index()
          
      time.sleep(5) #free process or ctrl+c
 
  def node_timestamp(self, ip, path):

      updatepath = os.path.join(path, 'lastupdate')
      with open(updatepath, 'wb') as lastupdate:
        lastupdate.write(self.devices[ip])
      return updatepath



  def announce(self):
    """
    Announce the node's existance to other nodes
    """
    print 'Announcing'
    while not self.exitapp:
      sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
      sock.sendto(self.index_last_update, ("ff02::1", self.announce_port))
      sock.close()
      time.sleep(5)

  def discover(self):
    """
    Discover other devices by listening to the Meshenger announce port
    """

    print 'Discovering'
    bufferSize = 1024 # whatever you need

    s = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.bind(('::', self.announce_port))
    s.setblocking(0)

    while not self.exitapp:
      result = select.select([s],[],[])[0][0].recvfrom(bufferSize)
      if result[1][0] not in self.devices and result[1][0] != self.own_ip:
        self.devices[result[1][0]] = result[0][0]
        #self.devices.append(result[1][0])

      time.sleep(1)

  def serve(self):
    """
    Initialize the server 
    """
    print 'Serving'
    import meshenger_serve
    meshenger_serve.main()

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
      self.index_last_update = str(int(time.time()))

      with open('index_last_update', 'wb') as indexupdate: ### misschien is dit overbodig
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
    try:
      with open(os.path.join(path,'index')) as index:
        index = index.read().split('\n')
        for message in index:
          messagepath = os.path.join(os.path.abspath(self.msg_dir), message)
          if not os.path.exists(messagepath):
            print 'downloading', message, 'to', messagepath
            os.system('wget http://['+ip+'%adhoc0]:13338/msg/'+message+' -O '+messagepath)
    except:
      pass

  def ip_to_hash(self, ip):
    """
    Convert a node's ip into a hash and make a directory to store it's files
    """
    import hashlib
    hasj = hashlib.md5(ip).hexdigest()
    nodepath = os.path.join(os.path.abspath('nodes/'), hasj)
    if not os.path.exists(nodepath):
      os.mkdir('nodes')
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
      os.system('ifconfig -a adhoc0 | grep inet6 > /root/meshenger/interfaceip6adress')
    with open('interfaceip6adress', 'r') as a:
      return a.read().split()[2].split('/')[0]



if __name__ == "__main__":
  print "test"  
  try:
    meshenger = Meshenger()
  except (KeyboardInterrupt, SystemExit):
    exitapp = True
    raise
