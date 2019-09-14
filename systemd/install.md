### Auto start node app
```
copy exitpuzzles.zoltar.service into /etc/systemd/system/

systemctl enable exitpuzzles.zoltar.service
systemctl start exitpuzzles.zoltar.service
```

Afterwards, should be able to 'shutdown -r now' and see it come online with ssh and node service

### Start/Stop to run by hand
```
sudo systemctl stop exitpuzzles.zoltar.service
```