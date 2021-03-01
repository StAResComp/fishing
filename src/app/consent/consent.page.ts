import { Component, OnInit } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.page.html',
  styleUrls: ['./consent.page.scss'],
})
export class ConsentPage implements OnInit {

  public consent = {
    understoodSheet: false,
    questionsOpportunity: false,
    questionsAnswered: false,
    understandWithdrawal: false,
    understandCoding: false,
    secondary: {
      agreeArchiving: false,
      awareRisks: false,
      agreeTakePart: false,
    },
    photography: {
      agreePhotoTaken: false,
      agreePhotoPublished: false,
      agreePhotoFutureUse: false,
    },
    name: null,
    date: new Date()
  }

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

  public consentDateString() {
    return this.consent.date.toLocaleDateString(
      'en-gb',
      {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  }

  private static localeDateFormat = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
}
