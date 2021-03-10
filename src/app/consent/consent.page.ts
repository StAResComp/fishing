import { Component, OnInit } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { Consent } from '../models/Consent.model';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.page.html',
  styleUrls: ['./consent.page.scss'],
})
export class ConsentPage implements OnInit {

  public consent = new Consent();

  constructor(
    public modalController: ModalController
  ) { }

  ngOnInit() {
  }

  giveConsent() {
    this.modalController.dismiss({
      submitted: true,
      consent: this.consent
    });
  }

}
