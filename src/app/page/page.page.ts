import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import {
  DbService,
  CompleteCatch,
  CompleteEntry,
  EntrySummary
} from '../db.service';
import { SettingsService } from '../settings.service';
import { AuthService } from '../auth.service';
import { MapModalPage } from '../map-modal/map-modal.page';

type Catch = {
  id?: number
  date?: Date
  species?: string
  caught?: number
  retained?: number
};

type Entry = {
  id?: number
  activityDate?: Date
  latitude?: number
  longitude?: number
  gear?: string
  meshSize?: string
  species?: string
  state?: string
  presentation?: string
  DIS?: boolean
  BMS?: boolean
  numPotsHauled?: number
  landingDiscardDate?: Date
  buyerTransporterRegLandedToKeeps?: string
};

@Component({
  selector: 'app-page',
  templateUrl: './page.page.html'
})
export class Page implements OnInit {
  public page: string;
  public settings = new Map<string, string>();
  private keys: Array<string>;

  public accessToken: string = "";
  public accessTokenExpiry: Number = 0;
  public refreshToken: string = "";

  public caught: Catch = {};
  public catches: Array<Catch>;
  public catchFormIncomplete = false;
  public catchFormDataError = false;

  public entry: Entry = {
    DIS: false,
    BMS: false
  };
  public entries: Array<EntrySummary>;
  public entryFormIncomplete = false;
  public entryFormDataError = false;
  public entryLocationString = '';

  public today = (new Date()).toISOString();

  public speciesList = [
    { id: 'CRE', name: 'Brown Crab' },
    { id: 'LBE', name: 'Lobster' },
    { id: 'NEP', name: 'Nephrops' },
    { id: 'CRS', name: 'Velvet Crab' },
    { id: 'SQC', name: 'Squid' }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private db: DbService,
    private settingsService: SettingsService,
    private authService: AuthService,
    public modalController: ModalController
  ) {
    this.keys = this.settingsService.getKeys();
    this.loadSettings();
  }

  ngOnInit() {
    this.page = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ionViewDidEnter() {
    this.db.selectCatches().then(catches => this.catches = catches);
    if (this.page.toLowerCase() == 'f1entrieslist') {
      this.db.selectEntrySummaries().then(
        entries => this.entries = entries
      );
    }
    else if (this.page.toLowerCase() == 'f1entrydetails') {
      this.activatedRoute.queryParams.subscribe(params => {
        if (params.entry_id) {
          this.db.selectEntry(parseInt(params.entry_id)).then(
            entry => {
              this.entry = entry;
            }
          );
        }
        else {
          this.entry = { DIS: false, BMS: false };
        }
      });
    }
  }

  private loadSettings() {
    this.settings.clear()
    this.keys.forEach(async(key) => {
      const val = await this.settingsService.get(key);
      this.settings.set(key, val);
    });
  }

  private saveSettings() {
    this.settings.forEach(
      (value, key) => {
        this.settingsService.set(key, value);
      }
    );
  }

  private getDisplayKey(key :string) {
    if (key.toUpperCase() == 'PLN') {
      return key.toUpperCase();
    }
    else {
      return key.replace(/_/g, ' ').replace(
        /\w\S*/g,
        function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
      );
    }
  }

  public login() {
    this.authService.authenticate();
  }

  public refresh() {
    this.authService.refreshToken();
  }

  public checkTokens() {
    this.authService.get(AuthService.access_token_key).then(
      value => this.accessToken = value
    );
    this.authService.get(AuthService.access_token_expiry_key).then(
      value => this.accessTokenExpiry = +value - (new Date().getTime() / 1000)
    );
    this.authService.get(AuthService.refresh_token_key).then(
      value => this.refreshToken = value
    );
  }

  private recordCatch() {

    if (this.caught.species == null ||
      this.caught.caught == null ||
      this.caught.caught == 0 ||
      this.caught.retained == null) {
      //form incomplete...
      this.catchFormIncomplete = true;
    }
    else {
      this.catchFormIncomplete = false;
    }

    if (this.caught.caught < this.caught.retained) {
      //data error
      this.catchFormDataError = true;
    }
    else {
      this.catchFormDataError = false;
    }

    if (!this.catchFormIncomplete && !this.catchFormDataError) {
      this.caught.date = new Date();
      this.db.insertOrUpdateCatch(this.caught as CompleteCatch).then(
        _ => this.db.selectCatches().then(catches => this.catches = catches)
      );
    }
  }

  private getEntryLocationString() {
    if (this.entry.latitude && this.entry.longitude) {
      return `${this.entry.latitude.toFixed(2)},${this.entry.longitude.toFixed(2)}`;
    }
    return '';
  }

  public recordEntry() {

    if (this.entry.activityDate == null ||
        this.entry.latitude == null ||
        this.entry.longitude == null ||
        this.entry.gear == null ||
        this.entry.species == null ||
        this.entry.state == null ||
        this.entry.presentation == null ||
        this.entry.landingDiscardDate == null) {
      this.entryFormIncomplete = true;
    }
    else {
      this.entryFormIncomplete = false;
    }

    if (this.entry.landingDiscardDate < this.entry.activityDate) {
      this.entryFormDataError = true;
    }
    else {
      this.entryFormDataError = false;
    }

    if (!this.entryFormIncomplete && !this.entryFormDataError) {
      this.db.insertOrUpdateEntry(this.entry as CompleteEntry).then(
        _ => this.router.navigate([`../F1EntriesList`], { relativeTo: this.activatedRoute })
      );
    }

  }

  private checkIfEntryIsComplete(entry: Entry): entry is CompleteEntry {
    for (const [k, v] of Object.entries(entry)) {
      if (k != 'id' && v == null) {
        return false;
      }
    }
    return true
  }

  public getDate(offset: number = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
  }

  public setLandingDateFromActivityDate(offset: number = 0) {
    const date = new Date();
    if (this.entry.activityDate != null) {
      date.setDate(this.entry.activityDate.getDate() + offset);
      this.entry.landingDiscardDate = date;
    }
  }

  public dateFromISO(isoDate: string) {
    return new Date(isoDate);
  }

  public generateForm() {}

  public getFisheriesOffices() {
    return this.settingsService.getFisheriesOffices();
  }

  public recordWildlife() {}

  public async presentMapModal() {
    const modal = await this.modalController.create({
      component: MapModalPage,
      cssClass: 'map-modal-class'
    });
    modal.onWillDismiss().then((data) => {
      if (data.data['submitted']) {
        this.entry.latitude = data.data['latitude'];
        this.entry.longitude = data.data['longitude'];
        this.entryLocationString = `${this.entry.latitude.toFixed(2)},${this.entry.longitude.toFixed(2)}`;
      }
    });
    return await modal.present();
  }

  public getGear() {
    return [
      { id: "1", name: 'Pots/traps FPO' },
      { id: "2", name: 'Handlines FPO' },
      { id: "3", name: 'Single trawl' },
      { id: "4", name: 'Deredge' }
    ];
  }

  public getMeshSizes() {
    return [
      { id: "1", name: '80mm' },
      { id: "2", name: '120mm' }
    ];
  }

  public getStates() {
    return [
      { id: "1", name: 'Live' },
      { id: "2", name: 'Fresh' },
      { id: "3", name: 'Ungraded' }
    ];
  }

  public getPresentations() {
    return [
      { id: "1", name: 'Whole' },
      { id: "2", name: 'Head on, gutted' }
    ];
  }
}
