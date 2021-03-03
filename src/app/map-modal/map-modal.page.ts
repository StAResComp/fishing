import { Component, OnInit, Input } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import * as Leaflet from 'leaflet';
import "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/images/marker-icon-2x.png";

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.page.html',
  styleUrls: ['./map-modal.page.scss'],
})
export class MapModalPage implements OnInit{

  public latitude: number = 56.81692;
  public longitude: number = -4.18265;
  private marker: Leaflet.Marker;

  map: Leaflet.Map;

  constructor(
    public modalController: ModalController,
    private geolocation: Geolocation,
    private platform: Platform
  ) { }

  async ngOnInit() {
    await this.platform.ready().then( _ => {
      this.geolocation.getCurrentPosition({timeout:2000}).then((resp) => {
        this.latitude = resp.coords.latitude;
        this.longitude = resp.coords.longitude;
        this.doMap();
      }).catch((error) => {
        console.log('Error getting location', error);
        this.doMap();
      });
    });
  }

  private doMap() {
    this.map = Leaflet.map('map_canvas').setView([this.latitude, this.longitude], 13);
    this.map.on('click', e => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }
      this.marker = Leaflet.marker([e.latlng.lat, e.latlng.lng]).addTo(this.map);
    });
    Leaflet.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(this.map);
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
