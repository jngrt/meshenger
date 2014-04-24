#!/bin/ash


echo 'This is the meshenger lazy install!'
echo 'It presumes your OpenWRT router has a connection to the internet'
echo 'And that you have a properly formatted usb flash drive'
echo 'more info + manual instructions: https://github.com/jngrt/meshenger'

opkg update
opkg install block-mount kmod-usb-storage kmod-usb2 kmod-fs-ext4

sleep 4

echo 'Mounting USB drive'
mkdir /mnt/sda1
mount -t ext4 /dev/sda1 /mnt/sda1

echo 'Cleaning USB drive'

rm -r /mnt/sda1/

sleep 4

echo 'Copying filesystem to USB drive'
mkdir -p /tmp/cproot
mount --bind / /tmp/cproot
sleep 1
tar -C /tmp/cproot -cvf - . | tar -C /mnt/sda1 -xf -
sleep 1
umount /tmp/cproot

sleep 4
echo 'Configuring fstab'

mv fstab /etc/config/fstab

echo 'Done configuring you can now reboot using $reboot -f'

