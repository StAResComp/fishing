import { Component, OnInit } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.page.html',
  styleUrls: ['./consent.page.scss'],
})
export class ConsentPage implements OnInit {

  constructor(
    public modalController: ModalController
  ) { }

  ngOnInit() {
  }

  giveConsent() {
    this.modalController.dismiss({
      'submitted': true
    });
  }

}
