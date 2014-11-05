#!/bin/ash


echo 'This is the meshenger lazy install part two!'
echo 'It presumes you already ran part 1!'
echo 'You should review the settings of "wireless" and "network"'

mkswap /dev/sda2
swapon /dev/sda2

mv fstab_extroot /etc/config/fstab

echo 'Configuring wireless and hotspot'

head -n 10 /etc/config/wireless >> tmp_wireless
cat wireless >> tmp_wireless
mv tmp_wireless /etc/config/wireless

cat firewall >>ls /etc/config/firewall

mv dhcp /etc/config/dhcp

echo "address=/#/192.168.2.1 " >> /etc/dnsmasq.conf

sleep 1

mv network /etc/config/network
opkg update
opkg install kmod-batman-adv kmod-ipv6

sed -i -e "s/option 'interfaces' 'mesh'/option 'interfaces' 'adhoc0'/g" /etc/config/batman-adv

opkg install python git
sleep 1
git clone ://github.com/rscmbbng/meshenger /root/meshenger

mv uhttpd /etc/config/uhttpd

mv meshenger /etc/init.d/meshenger
/etc/init.d/meshenger enable

echo 'my ip address is:' #klopt nog niet
ifconfig  br-lan | grep 'inet addr'

echo 'Done configuring you can now reboot using $reboot -f'
