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

Once you've set all of this up copy the lazyinstall directory to your open-wrt router:

	scp -r /path/to/meshenger/lazyinstall/ root@target.router.ip.adress:~/

ssh into the target router:

	ssh root@target.router.ip.address

navigate to where you copied the lazyinstall directory:
	cd ~/lazyinstall

first execute lazyinstall1, it will set up the ext_root on ths usb drive

	./lazyinstall1.sh

once that's done reboot the router:

	reboot -f

once it is up again, ssh back in. the router has now booted from the external usb drive. you can verify that by doing:

	df -h

which should show you that rootfs is the size of your external usb drive

run lazyinstall2. this will copy all the config files, download python and git and clone the meshenger project. This can take a while.

After this is done you can reboot and you will have a fully functioning meshenger node!
