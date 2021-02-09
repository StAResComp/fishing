import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Location } from "@angular/common";
import {
  DbService,
  CompleteCatch,
  CompleteEntry,
  EntrySummary
} from '../db.service';
import { SettingsService } from '../settings.service';
import { SheetService, Fish1Form } from '../sheet.service';
import { AuthService } from '../auth.service';
import { PostService } from '../post.service';
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
  weight?: number
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
  public entryICESRectangle = '';

  public f1Form = {};
  public sundays = [];

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
    private location: Location,
    private db: DbService,
    private settingsService: SettingsService,
    private sheetService: SheetService,
    private authService: AuthService,
    private postService: PostService,
    public modalController: ModalController
  ) {
    this.keys = this.settingsService.getKeys();
    this.loadSettings();
  }

  ngOnInit() {
    this.page = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ionViewDidEnter() {
    this.postService.postCatches();
    this.postService.postEntries();
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
              this.entryLocationString = `${this.entry.latitude.toFixed(2)},${this.entry.longitude.toFixed(2)}`;
              this.entryICESRectangle = this.getIcesRectangle(this.entry.latitude, this.entry.longitude);
            }
          );
        }
        else {
          this.entry = { DIS: false, BMS: false };
        }
      });
    }
    else if (this.page.toLowerCase() == 'f1formgen') {
      this.db.selectEarliestEntryDate().then(
        date => this.sundays = this.getSundays(date)
      );
      this.loadDraft();
      if (!this.f1Form['fisheriesOffice']) {
        this.f1Form = {
          fisheriesOffice: this.settingsService.getFisheriesOffice(
            this.settings.get('fisheries_office')
          ),
          PLN: this.settings.get('pln'),
          vesselName: this.settings.get('vessel_name'),
          portOfDeparture: this.settings.get('port_of_departure'),
          portOfLanding: this.settings.get('port_of_landing'),
          ownerMaster: this.settings.get('owner_master'),
          address: this.settings.get('address'),
          totalPotsFishing: this.settings.get('total_pots_fishing')
        };
      }
    }
  }

  public getSundays(startDate: Date): Date[] {
    const sundays = []
    const today = new Date();
    let sunday = new Date(
      startDate.setDate(startDate.getDate() - startDate.getDay())
    );
    sunday.setHours(0,0,0,0);
    while (
      sunday.getFullYear() < today.getFullYear() || (
        sunday.getFullYear() == today.getFullYear() &&
        sunday.getMonth() < today.getMonth()
      ) || (
        sunday.getFullYear() == today.getFullYear() &&
        sunday.getMonth() == today.getMonth() &&
        sunday.getDate() <= today.getDate()
      )
    ){
      sundays.push(new Date(sunday));
      sunday = new Date(sunday.setDate(sunday.getDate() + 7));
    }
    return sundays.reverse();
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
      const coords = this.degreesMinutes(this.entry.latitude, this.entry.longitude);
      return `${coords[0][0]}° ${coords[0][1]}' ${coords[0][2]},
              ${coords[1][0]}° ${coords[1][1]}' ${coords[1][2]}`;
    }
    return '';
  }

  private getEntryICESRectangleString() {
    if (this.entry.latitude && this.entry.longitude) {
      return this.getIcesRectangle(this.entry.latitude, this.entry.longitude);
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
        _ => this.location.back()
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

  public setf1FormWeekStarting(dateString: string) {
    this.f1Form['weekStarting'] = new Date(dateString);
    const weekEnd = new Date(this.f1Form['weekStarting']);
    weekEnd.setDate(weekEnd.getDate() + 7);
    this.db.selectEntrySummariesBetweenDates(
      this.f1Form['weekStarting'], weekEnd
    ).then(
      entries => this.entries = entries
    );
  }

  private serializeF1Form(): string {
    return JSON.stringify(this.f1Form);
  }

  private deserializeF1Form(serializedForm: string) {
    const f1Form = JSON.parse(serializedForm);
    if (f1Form['weekStarting']) {
      f1Form['weekStarting'] = new Date(f1Form['weekStarting']);
    }
    return f1Form;
  }

  public async saveDraft() {
    this.settingsService.setCurrentF1Form(this.serializeF1Form());
  }

  private loadDraft() {
    this.settingsService.getCurrentF1Form().then(
      serializedForm => this.f1Form = this.deserializeF1Form(serializedForm)
    );
  }

  public async generateXLSX() {
    await this.saveDraft();
    const draftForm = {};
    draftForm['fisheryOffice'] = this.f1Form['fisheriesOffice'];
    draftForm['pln'] = this.f1Form['PLN'];
    draftForm['vesselName'] = this.f1Form['vesselName'];
    draftForm['ownerMaster'] = this.f1Form['ownerMaster'];
    draftForm['address'] = this.f1Form['address'];
    draftForm['portOfDeparture'] = this.f1Form['portOfDeparture'];
    draftForm['portOfLanding'] = this.f1Form['portOfLanding'];
    draftForm['totalPotsFishing'] = this.f1Form['totalPotsFishing'];
    draftForm['comments'] = this.f1Form['comments'];
    draftForm['entries'] = [];
    const weekEnd = new Date(this.f1Form['weekStarting']);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const entries = this.db.selectFullEntriesBetweenDates(
      this.f1Form['weekStarting'], weekEnd
    ).then( entries => {
      entries.forEach((entry, index) => {
        draftForm['entries'][index] = {};
        const coords = this.degreesMinutes(entry.latitude, entry.longitude);
        draftForm['entries'][index]['fishingActivityDate'] = entry.activityDate;
        draftForm['entries'][index]['latitudeDegrees'] = coords[0][0];
        draftForm['entries'][index]['latitudeMinutes'] = coords[0][1];
        draftForm['entries'][index]['longitudeDegrees'] = coords[1][0];
        draftForm['entries'][index]['longitudeMinutes'] = coords[1][1];
        draftForm['entries'][index]['longitudeDirection'] = coords[1][2];
        draftForm['entries'][index]['statRect'] = this.getIcesRectangle(entry.latitude, entry.longitude);
        draftForm['entries'][index]['gear'] = entry.gear;
        draftForm['entries'][index]['meshSize'] = entry.meshSize;
        draftForm['entries'][index]['species'] = entry.species;
        draftForm['entries'][index]['state'] = entry.state;
        draftForm['entries'][index]['presentation'] = entry.presentation;
        draftForm['entries'][index]['weight'] = entry.weight;
        draftForm['entries'][index]['DIS'] = entry.DIS;
        draftForm['entries'][index]['BMS'] = entry.BMS;
        draftForm['entries'][index]['numberOfPotsHauled'] = entry.numPotsHauled;
        draftForm['entries'][index]['landingOrDiscardDate'] = entry.landingDiscardDate;;
        draftForm['entries'][index]['buyerTransporterRegOrLandedToKeeps'] = entry.buyerTransporterRegLandedToKeeps;
      });
      this.sheetService.form = draftForm as Fish1Form;
    });
    return this.sheetService.createWorkbook();
  }

  private degreesMinutes(lat: number, lng: number) {

    const absLat = Math.abs(lat);
    const latDeg = Math.floor(absLat);
    const latMin = Math.floor((absLat - latDeg) * 60);
    const latDir = ((lat > 0) ? "N" : "S");

    const absLng = Math.abs(lng);
    const lngDeg = Math.floor(absLng);
    const lngMin = Math.floor((absLng - lngDeg) * 60);
    const lngDir = ((lng > 0) ? "E" : "W");

    return [
      [latDeg, latMin, latDir],
      [lngDeg, lngMin, lngDir]
    ];
  }


  /* As per http://www.ices.dk/marine-data/maps/Pages/ICES-statistical-rectangles.aspx

       ICES rectangle should be a 4-character string of the form "digit, digit, letter, digit"

       ICES statistical rectangles provide a grid covering the area between 36°N and 85°30'N and
       44°W and 68°30'E.

       Latitudinal rows, with intervals of 30', are numbered (two-digits) from 01 at the southern
       boundary (latitude 36°00'N) and increasing northwards to 99. The northern boundary of the
       statistical rectangle system is, thus, latitude 85°30'N.

       Longitudinal columns, with intervals of 1°, are coded according to an alphanumeric system,
       beginning with A0 at the western boundary (longitude 44°00'W), continuing A1, A2, A3 to
       longitude 40°W (due to historical reasons, codes A4, A5, A6, A7, A8, and A9 are omitted from
       the alphanumeric codes for longitude referencing). East of 40°W, the coding continues B0, B1,
       B2, ..., B9, C0, C1, C2, ..., C9, etc., using a different letter for each 10° block, to the
       eastern boundary of the area covered. Note that the letter I is omitted.

       When designating an ICES rectangle, the northern coordinate is stated first. Thus, the
       rectangle of which the south-west corner is 54°00'N 03°00'E is designated 37F3.
    */
  private getIcesRectangle(lat: number, lng: number): string {
    let icesRect = "";
    if (lat < 36.0 || lat >= 85.5 || lng < -44.0 || lng >= 68.5) {
      return icesRect;
    }

    //Latitudinal row
    const latval = Math.floor((lat - 36.0) * 2) +1;
    icesRect += (latval <= 9 ? `0${latval}` : latval);

    //Longitudinal Column
    const letterString = "ABCDEFGHJKLM";
    const letters = Array.from(letterString);
    icesRect += letters[(Math.floor(lng / 10)) + 5];
    if (lng < -40.0) {
      icesRect += Math.floor(Math.abs(-44.0 - lng));
    }
    else if (lng < 0.0) {
      icesRect += (9 + Math.ceil(lng % 10));
    }
    else {
      icesRect += Math.floor(lng % 10);
    }
    return icesRect;
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
        this.entryICESRectangle = this.getIcesRectangle(this.entry.latitude, this.entry.longitude);
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
