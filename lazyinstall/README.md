This is a very primitive script to automate the openwrt setup.
It's probably best not used at this point.

However if you choose to use it make sure you have the following things set up:

- The OpenWRT router has a connection to the internet (by attaching it to another router via ethernet)
- You have a properly formatted usb drive (one ext4 partition, one 32mb swap partiton)
- Make sure the usb flash drive is inserted in the router

The lazy install scripts works by moving config files from this folder to replace the ones on the target router's filesystem. 
Therefore you need to edit the following files to suit your own needs:

network file:
lines 11 and 13, the ip adress you want to use plus the ip adress of the gateway that provides this router with its internet connection.

wireless file:
line 11,the wireless SSID that the router will get 


