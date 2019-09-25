### Auto start node app
```
sudo cp exitpuzzles.tomb.service /etc/systemd/system/

# install service
sudo systemctl enable exitpuzzles.tomb.service

# start service
sudo systemctl start exitpuzzles.tomb.service

# to check status
sudo systemctl status exitpuzzles.tomb.service

```

Afterwards, should be able to 'shutdown -r now' and see it come online with ssh and node service

### Start/Stop to run by hand
```
sudo systemctl stop exitpuzzles.tomb.service
```
