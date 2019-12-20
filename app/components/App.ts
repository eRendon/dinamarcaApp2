import Vue from 'vue'
const firebase = require("nativescript-plugin-firebase");
import * as Permissions from "nativescript-permissions";
import { Telephony } from "nativescript-telephony";
import { request} from "tns-core-modules/http";
export default Vue.extend({
    data: () => ({
        ctrlInitFirebase: false as boolean,
       iMEI: null,
        optionalDataDevice: [],
        deviceDataApp1: [{
           qrScanned: null,
            locationScanned: {
               latitude: null,
                longitude: null
            }
        }]
    }),
    created(): void {
    },
    methods: {
        onChildEvent(result): void {
            // this.presentAlert('Datos recibidos', `Se han recibido datos ${JSON.stringify(result.value)}`)
            this.deviceDataApp1.push(result.value)
            this.optionalDataDevice.push(JSON.stringify(result.value))
            console.log('onChildEvent =====> ', this.deviceDataApp1)
            console.log("Values: " +
                JSON.stringify(result));
        },
        initFirebase(): void {
            firebase.init({
                persist: true,
                // Optionally pass in properties for database, authentication and cloud messaging,
                // see their respective docs.
            }).then(
                () => {
                    firebase.addChildEventListener(this.onChildEvent, "DataDevice").then((snapshot) => {
                        console.log("[*] Info : We've some data !", snapshot);
                    });
                    this.ctrlInitFirebase = true
                    console.log("firebase.init done");
                },
                error => {
                    if (error == 'initialized'){
                        firebase.getValue('/companies')
                            .then(result => {
                                console.log(JSON.stringify(result))
                            })
                            .catch(error => console.log("Error: " + error));
                    }
                    console.log(`firebase.init error: ${error}`);
                }
            );
        },
        getDeviceData(): void {
            let there = this
            Permissions.requestPermission(
                android.Manifest.permission.READ_PHONE_STATE,
                "Needed for connectivity status"
            )
                .then(() => {
                    console.log("Permission granted!");
                    Telephony()
                        .then(function(resolved) {
                            there.iMEI = resolved.deviceId
                            there.presentAlert('IMEI', `Su IMEI es ${there.iMEI}`)
                            console.log("resolved >", resolved);
                            console.dir(resolved);
                        })
                        .catch(function(error) {
                            console.error("error >", error);
                            console.dir(error);
                        });
                })
                .catch(() => {
                    console.log("Permission is not granted (sadface)");
                });
        },
        presentAlert(title: string, message: string): void {
            alert({
                title,
                message,
                okButtonText: "OK"
            });
        },
        verifyIMEI(): void {
            !this.iMEI ? this.presentAlert('Error', 'Por favor, obtenga el IMEI de su dispositivo') : this.sendDevicesData()
        },
        sendDevicesData(): void {
            // console.log(this.optionalDataDevice)
            console.log(this.optionalDataDevice[this.optionalDataDevice.length - 1])
            // console.log('====>',
            //     JSON.parse(this.optionalDataDevice))
            // this.optionalDataDevice = JSON.parse(this.optionalDataDevice)
            // console.log('--->', this.optionalDataDevice[0].qrScanned)
            // console.log('--->', this.optionalDataDevice[0].locationScanned)
            // console.log('=====>', this.optionalDataDevice.length)
            // console.log('=====>', this.deviceDataApp1[this.this.deviceDataApp1.length -1])
            request({
                url: "http://dinamarca-spring-boot.us-east-1.elasticbeanstalk.com:5000/application/newApplication",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                content:
                    JSON.stringify({
                        codigoQr: this.optionalDataDevice[this.optionalDataDevice.length - 1],
                        ubicacion: this.optionalDataDevice[this.optionalDataDevice.length - 1],
                        imei: this.iMEI
                    })
            }).then((response) => {
                console.log('---->', response.content)
                console.log('--->', response.statusCode)
                if (response.statusCode == 200){
                    this.presentAlert('Datos guardados', 'Sus datos han sido guardados correctamente')
                } else {
                    this.presentAlert('Error', 'Te')
                }
                // Argument (response) is HttpResponse
            }, (e) => {
                console.log('=====>', e)
            });
        }
    }
})
