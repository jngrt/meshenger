meshenger
=========

Meshenger is a Forban-inspired messaging software used for a speculative broadcast communication project. The starting point is an electronic messaging system running on a wireless mesh network. The messages propagate through the network when devices that come in contact with each other synchronize their content. It is non-hierarchical, every node receives, relays and broadcasts messages.

Using Meshenger, devices detect each other by continously broadcasting an identifier packet while listening to those of other nodes. As soon as two (or more) nodes detect each other they will try to synchronize the messages on each node.

The users of the network can interface with the nodes to send or receive messages by using the webbrowser of their smartphone or computer. The messages can be received and sent at any time, but they are only synchronized in the network when other nodes are encountered. 

Meshenger is supposed to run on an Open-WRT router that has been configured to work in mesh networks (for a configuration how-to see below).




## Configuring a router for Open-WRT and Meshenger

### Flashing and preparing
Meshenger requires routers that both support Open-WRT and *have at least one USB port* [(List of Open-WRT routers here)](http://wiki.openwrt.org/toh/start).
We have used  the following models: TP-Link MR-3020, TP-Link TP-WR703n and TP-WR842nd.

Open-WRT have a guide for each supported device that tells how to best flash your specific device with Open-WRT. [(Article on flashing)](http://wiki.openwrt.org/doc/howto/generic.flashing)

After flashing proceed through the first login as described [here.](http://wiki.openwrt.org/doc/howto/firstlogin)

You are going to need to have an internet connection to your router, the easiest thing is to hook it up to the router. 

Alternatively if you use OSX you can enable internet sharing (make sure to set your OSX machine as the gateway and DNS server for your router in /etc/config/network)

### System configuration

To use your router for Meshenger you're going to need to run the whole filesystem from a USB-Drive.

Make sure that said USB-Drive is formatted as such:

	- one ext4 partition

	- one linux-swap partition (32mb seems to be sufficient so far)

Next enable USB-Storage on the router:

`$ opkg update`

`$ opkg install 'block-mount kmod-usb-storage kmod-usb2 kmod-fs-ext4`

To check if it works try `$ ls /dev/`. You shoud see sda, sda1 and sda2 

Now mount the USB-Drive:

`$ mkdir /mnt/sda1`

`$ mount -t ext4 /dev/sda1 /mnt/sda1`

Copy the whole filesystem to the USB-Drive:

`$ mkdir -p /tmp/cproot`

`$ mount --bind / /tmp/cproot`

`$ tar -C /tmp/cproot -cvf - . | tar -C /mnt/sda1 -xf -`

`$ umount /tmp/cproot`

Edit fstab

`$ vi /etc/config/fstab`

Make config mount look like:
```
config mount 
    option target /
    option device /dev/sda1
    option fstype ext4
    option options rw,sync
    option enabled 1
    option enabled_fsck 0
```
Reboot the device (`$ reboot -f`) and use `$ df -h` to confirm device now runs off the USB-Drive

Next we configure the swap partition

`$ mkswap /dev/sda2`

`$ swapon /dev/sda2`

Edit fstab again now make the swap look like this:
```
config mount
	option device   /dev/sda2
	option enabled
```
### Wireless configuration

The next section is on how to set up the network interfaces to work with B.A.T.M.A.N the mesh networking protocol. It is more or less a summary of what's written [here.](http://www.open-mesh.org/projects/batman-adv/wiki/Batman-adv-openwrt-config)

`$ vi etc/config/wireless` and edit the wireless interface to look like this:

Dont forget to remove the line that disables wireless

```
config wifi-iface 'wmesh'

	option device  'radio0'

	option ifname  'adhoc0'

	option network 'mesh'  

	option mode		'adhoc'

	option ssid     'mesh'          

	option bssid '66:66:66:66:66:66'
```

Next up is `$ vi etc/config/network` where we add this interface:

```
config interface 'mesh'

	option ifname 'adhoc0'

	option mtu '1528'

	option proto 'none'
```

Install B.A.T.M.A.N and IP6 support.

`$ opkg install kmod-batman-adv kmod-ipv6`

Then edit `$ /etc/config/batman-adv ` to tell it which interface to use.

```
config mesh 'bat0'

	option interfaces 'adhoc0'

	option 'aggregated_ogms'

	option 'ap_isolation' 

	option [..]
```

`$ /etc/init.d/network restart` to make the changes take effect.

If you have set this up properly on more than one node, the nodes should be able to see each other. Test with `$ batctl -o` 

Make sure that you have the same version of batctl and openwrt on all nodes you plan to use.
`$ uname -a && batctl -v ` to see the version information.


### Configuring / Adding a client Hotspot

For the front-end, the client user interface, we must have a captive portal running. These are the first steps in enableing another wireless interface for the hotspot



Add the following lines in the following config files and restart the network:

`$ vi /etc/config/network`

```
config interface 'hotspot'    
        option 'iface' 'radio0' #use your excisting wifi device (look in config/wireless below)
        option 'proto' 'static'
        option 'ipaddr' '192.168.2.1'
        option 'netmask' '255.255.255.0'
        option 'type' 'bridge'           
                                    
```

`$ vi /etc/config/wireless`

```
config wifi-iface                       
        option 'device' 'radio0'  #use your excisting wifi device, look in the list above.    
        option 'ssid' 'meshtest1'  #use a unique name for your network?
        option 'network' 'hotspot'      
        option 'mode' 'ap'              
        option 'encryption' 'none'
        option 'isolate' '1'  
```

`$ vi /etc/config/dhcp`

```
config dhcp hotspot                           
        option 'interface' 'hotspot'          
        option 'start' '100'                  
        option 'limit' '150'        
        option 'dynamicdhcp' '1'  
```

`$ vi /etc/config/firewall` enable handing out dhcp addresses to wifi clients

```                                             
config 'zone'                                          
        option 'name' 'hotspot'                        
        option 'input' 'ACCEPT'                        
        option 'forward' 'ACCEPT' #was REJECT                      
        option  'output' 'ACCEPT'                      
                                                       
config 'rule'                                     
     
        option 'src' 'hotspot'                         
        option 'dest_port' '53'                        
        option 'proto' 'tcpudp'                        
        option 'target' 'ACCEPT'                       
                                                       
config 'rule'                                          
        option 'src' 'hotspot'                         
        option 'src_port' '67-68'                      
        option 'dest_port' '67-68'                     
        option 'proto' 'udp'                           
        option 'target' 'ACCEPT'                       
```                                 

`$ /etc/init.d/network restart`
`$ /etc/init.d/firewall restart`
`$ /etc/init.d/dnsmasq restart`

Or better, restart the router with `$ reboot -f`

The Meshenger webinterface is now available at http://192.168.2.1 when connected to its associated hotspot, in this case 'meshtest1'.


### Configuring the Hotspot as captive portal

We want connecting clients to be redirected to our webapp, no matter what url they request. To do so we need to add some firewall rules, configure dhcp and dnsmasq.

Add the following firewall rules:

`$ vi /etc/config/firewall`

```
config 'rule'
        option 'target' 'ACCEPT'
        option 'src' 'hotspot' # guest wifi interface
        option 'proto' 'tcp'
        option '_name' 'Website' # this can maybe go?
        option 'dest_port' '80'

config 'redirect'
        option 'proto' 'tcp'
        option '_name' 'Website' # this can maybe go?
        option 'src' 'hotspot' # guest wifi interface
        option 'src_dport' '80'
        option 'dest_port' '80'
        option 'dest_ip' '192.168.2.1' # ip of webserver
```


In the dnsmasq section of the dhcp config (first section) add the following line:

`$ vi /etc/config/dhcp`

```
list server '//192.168.2.1'
```


In the dnsmasq config (first section) add the following line(s):

`$ vi /etc/dnsmasq.conf`

```
# Redirect all dns requests to meshenger                     
address=/#/192.168.2.1   
```

Restart dnsmasq to apply the changes:

`$ /etc/init.d/dnsmasq restart`


Now all http requests will be directed to Meshenger! If it doesn't work, check your DNS settings of the client your're using (aka your computer, phone, fapfapfaplet). Make sure google's 8.8.8.8 is not there and set 192.168.2.1 as the dns server.

### Run meshenger on boot

Create a file in `$ /etc/init.d/` called meshenger and paste the script below:

```
#!/bin/sh /etc/rc.common
#meshenger startup script

START=101
#STOP=15

start() {
    echo 'starting Meshenger'
    /usr/bin/python /root/meshenger/main.py &
}

stop() {
    echo 'Killing Meshenger'
    killall python
}

```

Make the file executable

`$ chmod a+x /etc/init.d/meshenger`

Now you can start/stop meshenger as a service, to enable the meshenger as srevice on boot run

`$ /etc/init.d/meshenger enable` 

To start/stop/disable replace 'enable' with start, stop or disable.



### Installing meshenger

Get the dependencies and clone the git

`$ opkg install python git `

`$ git clone git://github.com/jngrt/meshenger.git `
