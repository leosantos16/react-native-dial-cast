import { Client, Server } from 'react-native-ssdp';

const SSDPClient = new Client();

const SSDPServer = new Server();

SSDPServer.addUSN('upnp:rootdevice');
SSDPServer.addUSN('urn:schemas-upnp-org:device:MediaServer:1');
SSDPServer.addUSN('urn:schemas-upnp-org:service:ContentDirectory:1');
SSDPServer.addUSN('urn:schemas-upnp-org:service:ConnectionManager:1');
SSDPServer.addUSN('urn:dial-multiscreen-org:service:dial:1');

var devices = [], selectedDevice = {}, dataUrl = "";

SSDPClient.on('response', (headers, statusCode, rinfo) => {
    fetch(headers.LOCATION)
    .then((response) => {
        dataUrl = response.map['application-url'];
        return response.text()
    })
    .then((application) => {
        if(!devices.includes(application)) {
            devices.push(application);
        }
    });
});

export default {
    startServer() {
        SSDPServer.start();
    },

    stopServer() {
        SSDPServer.stop();
    },

    startSearch() {
        SSDPClient.search('urn:dial-multiscreen-org:service:dial:1');
        return true;
    },

    stopSearch() {
        SSDPClient.stop();
        return true;
    },

    listDevices() {
        return devices;
    },

    filterDevice(device) {
        selectedDevice = devices.filter((val) => identifyDevice(val) === identify(device));
        return selectedDevice;
    },

    identifyDevice(device) {
        const firstpiece = device.split("<friendlyName");
        const secondpiece = firstpiece[1].split("</friendlyName>");
        return secondpiece[0];
    },

    discoverApplication(packageName) {
        fetch(dataUrl+'/'+packageName+'?clientDialVer=2.2')
        .then((response) => {
            if(response.status != 404) {
                response.text().then((xml) => {
                    return xml.split("<state>")[1].split("</state>")[0];
                });
            } else {
                return;
            }
        });
    },

    installApplication(url) {
        fetch(url)
        .then((response) => {
            return response;
        });
    },

    launchApplication(application, payload) {
        let header = {
            "Content-length": "0"
        };
        if(Object.keys(payload).length) {
            header = {
                "Content-type": "text/plain",
                "Charset": "UTF-8"
            };
        }
        fetch(application+"?friendlyName=react-native-dial-cast", {
            method: "POST",
            body: payload,
            headers: header
        })
        .then((response) => {
            if(response.ok) {
                response.json().then((json) => {
                    if(json.additionalDataUrl) {
                        dataUrl = json.additionalDataUrl;
                    }
                });
            }
        });
    },

    sendMessage(payload) {
        fetch(dataUrl, {
            method: "POST",
            body: payload
        })
        .then((response) => {
            return response;
        });
    },

    hideApplication(application) {
        fetch(application+'/hide', {
            method: "POST"
        });
    },

    stopApplication(application) {
        fetch(application, {
            method: "DELETE"
        });
    }
}