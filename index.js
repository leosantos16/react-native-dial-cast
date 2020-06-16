import { Client } from 'react-native-ssdp';

const SSDPClient = new Client();

var devices = [];

var additionalDataUrl = "";

SSDPClient.on('response', (headers, statusCode, rinfo) => {
    fetch(headers.location)
    .then((response) => response.json())
    .then((application) => {
        console.log(application);
        devices.push(application);
    });
});

export default {
    startSearch() {
        SSDPClient.search('urn:dial-multiscreen-org:service:dial:1');
        console.log("search");
    },
    stopSearch() {
        SSDPClient.stop();
    },
    listDevices() {
        return devices;
    },
    filterDevice(device) {
        devices = devices.filter((val) => val === device);
    },
    discoverApplication(packageName) {
        fetch(devices["Application-URL"]+'/'+packageName+'?clientDialVer=2.2')
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
        if(Object.keys(payload).length === 0) {
            const header = {
                "Content-length": "0"
            };
        } else {
            const header = {
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
                        additionalDataUrl = json.additionalDataUrl;
                    }
                });
            }
        });
    },
    sendMessage(payload) {
        fetch(additionalDataUrl, {
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
};
