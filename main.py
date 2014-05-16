#!/usr/bin/python

import socket, os, time, select, urllib, sys, threading

class Meshenger:
  devices = {} #the dictionary of all the nodes this this node has seen
  serve_port = "13338"
  announce_port = 13337
  #own_ip = "0.0.0.0"
  msg_dir = os.path.relpath('msg/')
  exitapp = False #to kill all threads on
  index_last_update = str(int(time.time()))

  def __init__(self):

    os.system("echo 1 >> /proc/sys/net/ipv6/conf/br-lan/disable_ipv6")
    os.system("echo 1 >> /proc/sys/net/ipv6/conf/br-hotspot/disable_ipv6")
    self.own_ip = self.get_ip_adress()

    if not os.path.exists(self.msg_dir):
      os.mkdir(self.msg_dir)
      print 'Making message directory'

    try:
      d = threading.Thread(target=self.discover)
      d.daemon = True
      d.start()

      a = threading.Thread(target=self.announce)
      a.daemon = True
      a.start()

      n = threading.Thread(target=self.nodeserve)
      n.daemon = True
      n.start()

      c = threading.Thread(target=self.clientserve)
      c.daemon = True
      c.start()

      b = threading.Thread(target=self.build_index)
      b.daemon = True
      b.start()

      #os.system("python meshenger_clientserve.py")

    except (KeyboardInterrupt, SystemExit):
      print 'exiting discovery thread'
      d.join()
      a.join()
      b.join()
      n.join()
      c.join()
      sys.exit()

    while True:
      print 'Entering main loop'
      #
      if len(self.devices) > 0:
        print 'found', len(self.devices),'device(s)'

        for device in self.devices:
          nodepath = self.ip_to_hash_path(device) #make a folder for the node (nodes/'hash'/)
          nodeupdatepath = os.path.join(self.ip_to_hash_path(device), 'lastupdate')


          print 'Checking age of foreign node index'
          print self.devices[device], 'Foreign announce timestamp'
          try:
            foreign_node_update = open(nodeupdatepath).read()
          except:
            foreign_node_update = 0 #means it was never seen before

          print foreign_node_update, 'Locally stored timestamp for device'


          if self.devices[device] > foreign_node_update:
            print 'Foreign node"s index is newer, proceed to download index'
            self.get_index(device, nodepath)
            print 'downloading messages'
            self.get_messages(device, nodepath)
            self.node_timestamp(device)

      time.sleep(5) #free process or ctrl+c

  def node_timestamp(self, ip):
      nodepath = os.path.abspath(os.path.join('nodes', self.hasj(ip)))
      updatepath = os.path.join(nodepath, 'lastupdate')
      with open(updatepath, 'wb') as lastupdate:
        lastupdate.write(self.devices[ip])
      #return updatepath



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
    bufferSize = 1024 # whatever you need?

    s = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    s.bind(('::', self.announce_port))
    s.setblocking(0)
    while not self.exitapp:
      result = select.select([s],[],[])[0][0].recvfrom(bufferSize)
      ip = result[1][0]
      print ip, "*"*45
      node_path = os.path.join(os.path.abspath('nodes'), self.hasj(ip))

      if not os.path.exists(node_path) and ip != self.own_ip: 
        #loop for first time
        self.ip_to_hash_path(ip) #make a folder /nodes/hash
        self.devices[ip] = result[0]
        #self.node_timestamp(ip) #make a local copy of the timestamp in /nodes/hash/updatetimestamp
        print 'New node', ip

      elif os.path.exists(node_path) and ip != self.own_ip:
        print 'Known node', ip
        self.devices[ip] = result[0]


      time.sleep(1)

  def nodeserve(self):
    """
Initialize the nodeserver
"""
    print 'Serving to nodes'
    import meshenger_nodeserve
    meshenger_nodeserve.main()

  def clientserve(self):
    """
Initialize the clientserver
"""
    print 'Serving to client'
    import meshenger_clientserve
    meshenger_clientserve.main()


  def build_index(self):
    """
Make an index file of all the messages present on the node.
Save the time of the last update.
"""

    print 'Building own index for the first time\n'

    if not os.path.exists('index'):
      with open('index','wb') as index:
        index.write('')
      previous_index = []
    else:
      previous_index = open('index').readlines()

    while not self.exitapp:
      current_index = os.listdir(self.msg_dir)
      if current_index != previous_index:
        with open('index', 'wb') as index:
          for message in os.listdir(self.msg_dir):
            index.write(message)
            index.write('\n')
        self.index_last_update = str(int(time.time()))

        print 'Index updated:', current_index

        with open('index_last_update', 'wb') as indexupdate: 
          indexupdate.write(self.index_last_update) ### misschien moet dit index_last_update zijn

      previous_index = current_index
      time.sleep(5)

  def get_index(self,ip, path):
    """
Download the indices from other nodes.
"""

    os.system('wget http://['+ip+'%adhoc0]:'+self.serve_port+'/index -O '+os.path.join(path,'index'))


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
            os.system('wget http://['+ip+'%adhoc0]:'+self.serve_port+'/msg/'+message+' -O '+messagepath)
    except:
      print 'Failed to download messages'
      pass

  def ip_to_hash_path(self, ip):
    """
Convert a node's ip into a hash and make a directory to store it's files
"""
    if not os.path.exists('nodes'):
      os.mkdir('nodes')

    nodepath = os.path.join(os.path.abspath('nodes'), self.hasj(ip))
    if not os.path.exists(nodepath):
      os.mkdir(nodepath)

    return nodepath

  def hasj(self, ip):
        """
        Convert a node's ip into a hash
        """
        import hashlib
        hasj = hashlib.md5(ip).hexdigest()
        return hasj

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
