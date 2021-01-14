import { Component, OnInit, Input } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {
	GoogleMaps,
	GoogleMap,
	GoogleMapsEvent,
	GoogleMapOptions,
  Environment
} from '@ionic-native/google-maps';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.page.html',
  styleUrls: ['./map-modal.page.scss'],
})
export class MapModalPage implements OnInit{

  public latitude: number = 56.81692;
  public longitude: number = -4.18265;

  map: GoogleMap;

  constructor(
    public modalController: ModalController,
    private geolocation: Geolocation,
    private platform: Platform
  ) { }

  async ngOnInit() {
    await this.platform.ready();
    await this.loadMap();
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
      this.map.setCameraTarget({lat: this.latitude, lng: this.longitude});
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

	loadMap() {

    // This code is necessary for browser
    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': 'GOOGLE_MAPS_API_KEY',
      'API_KEY_FOR_BROWSER_DEBUG': 'GOOGLE_MAPS_API_KEY'
    });

    const mapOptions: GoogleMapOptions = {
      camera: {
         target: {
           lat: this.latitude,
           lng: this.longitude
         },
         zoom: 12,
       }
    };

    this.map = GoogleMaps.create('map_canvas', mapOptions);

  }

  dismiss() {
    // using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data
    this.modalController.dismiss({
      'submitted': false
    });
  }

  submitLocation() {
    // using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data
    this.modalController.dismiss({
      'submitted': true,
      'latitude': this.latitude,
      'longitude': this.longitude
    });
  }

}
