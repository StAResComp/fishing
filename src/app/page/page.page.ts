import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, ToastController, Platform, IonInput } from '@ionic/angular';
import { Location } from '@angular/common';
import { Dialogs } from '@ionic-native/dialogs/ngx';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  Marker,
  MyLocation
} from '@ionic-native/google-maps';
import { DbService } from '../db.service';
import { SettingsService } from '../settings.service';
import { SheetService } from '../sheet.service';
import { AuthService } from '../auth.service';
import { PostService } from '../post.service';
import { ConsentPage } from '../consent/consent.page';
import {
  F1Form,
  F1FormEntry,
  F1FormEntrySummary,
  FisheryOffice,
  Catch
} from '../models/F1Form.model';
import { WildlifeObservation } from '../models/WildlifeObservation.model';
import { Creel } from '../models/Creel.model';
import { Consent } from '../models/Consent.model';

@Component({
  selector: 'app-page',
  templateUrl: './page.page.html'
})
export class Page implements OnInit {
  public page: string;
  public settings = new Map<string, string>();
  private keys: Array<string>;

  public accessToken = '';
  public accessTokenExpiry = 0;
  public refreshToken = '';

  public caught = new Catch();
  public catches: Array<Catch>;
  public catchFormIncomplete = false;
  public catchFormDataError = '';

  public entry = new F1FormEntry();
  public entries: Array<F1FormEntrySummary>;
  public entryFormIncomplete = false;
  public entryFormDataError = false;
  public displayMap = false;

  public f1Form = new F1Form();
  public sundays = [];

  public today = new Date();

  public observation = new WildlifeObservation();
  public observations: Array<WildlifeObservation>;

  public creel = new Creel();
  public creels: Array<Creel>;

  private gotConsent = false;

  public fieldsVisited: Array<string> = [];

  public latitude = 57.76958852557177;
  public longitude = -7.019251515775875;

  map: GoogleMap;

  constructor(
    private platform: Platform,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dialogs: Dialogs,
    private cdr: ChangeDetectorRef,
    private db: DbService,
    private settingsService: SettingsService,
    private sheetService: SheetService,
    private authService: AuthService,
    private postService: PostService,
    public modalController: ModalController,
    public toastController: ToastController
  ) {
    this.keys = this.settingsService.getKeys();
    this.loadSettings();
  }

  ngOnInit() {
    this.page = this.activatedRoute.snapshot.paramMap.get('id');
    // this.doConsent();
  }

  ionViewDidEnter() {
    this.postService.postData();
    this.fieldsVisited = [];
    if (this.page.toLowerCase() === 'settings') {
      this.settingsService.setSettingsVisited();
    }
    if (this.page.toLowerCase() === 'home') {
      this.forceFirstVisitToSettings();
      this.homeInit();
    }
    if (this.page.toLowerCase() === 'f1entrieslist') {
      this.forceFirstVisitToSettings();
      this.entriesInit();
    }
    else if (this.page.toLowerCase() === 'f1entrydetails') {
      this.forceFirstVisitToSettings();
      this.entryInit();
    }
    else if (this.page.toLowerCase() === 'f1formgen') {
      this.forceFirstVisitToSettings();
      this.formInit();
    }
    else if (this.page.toLowerCase() === 'wildlife') {
      this.forceFirstVisitToSettings();
      this.wildlifeInit();
    }
    else if (this.page.toLowerCase() === 'creels') {
      this.forceFirstVisitToSettings();
      this.creelsInit();
    }
  }

////////////////////////////// Cross-page Helpers //////////////////////////////

  private forceFirstVisitToSettings() {
    this.settingsService.getSettingsVisited().then(settingsVisited => {
      if (settingsVisited == null || !settingsVisited) {
        this.router.navigate(['page/Settings']);
      }
    });
  }

  public getSpeciesList() {
    return F1FormEntry.getSpeciesList();
  }

  public dateFromISO(isoDate: string) {
    return new Date(isoDate);
  }

  public disableInputs(): boolean {
    // return !this.gotConsent;
    return false;
  }

  private doMap() {
    const page = this.page.toLowerCase();
    let mapDiv = 'entry_map_canvas';
    if (page === 'wildlife') {
      mapDiv = 'observation_map_canvas';
    }
    else if (page === 'creels') {
      mapDiv = 'creel_map_canvas';
    }
    this.map = GoogleMaps.create(mapDiv, {
      camera: {
        target: {
          lat: 57.76958852557177,
          lng: -7.019251515775875
        },
        zoom: 14,
        tilt: 0
      }
    });
    this.map.on('map_click').subscribe(data => {
      const latLng = data[0];
      this.map.clear();
      this.map.addMarker({
        position: latLng
      });
      this.map.animateCamera({ target: latLng, duration: 500 });
      if (page === 'wildlife') {
        this.observation.setLatitude(latLng.lat);
        this.observation.setLongitude(latLng.lng);
      }
      else if (page === 'creels') {
        this.creel.setLatitude(latLng.lat);
        this.creel.setLongitude(latLng.lng);
      }
      else {
        this.entry.setLatitude(latLng.lat);
        this.entry.setLongitude(latLng.lng);
      }
      this.cdr.detectChanges();
    });
    if (this.entry?.getLatitude() == null ||
      this.entry?.getLongitude() == null) {
      this.map.getMyLocation().then((location: MyLocation) => {
        this.map.animateCamera({ target: location.latLng, duration: 1000 });
        this.map.addMarker({
          title: 'Your current location',
          position: location.latLng
        });
        if (page === 'wildlife') {
          this.observation.setLatitude(location.latLng.lat);
          this.observation.setLongitude(location.latLng.lng);
        }
        else if (page === 'creels') {
          this.creel.setLatitude(location.latLng.lat);
          this.creel.setLongitude(location.latLng.lng);
        }
        else {
          this.entry.setLatitude(location.latLng.lat);
          this.entry.setLongitude(location.latLng.lng);
        }
        this.cdr.detectChanges();
      });
    }
    else {
      const latLng = {
        lat: this.entry.getLatitude(),
        lng: this.entry.getLongitude()
      };
      this.map.animateCamera({ target: latLng, duration: 1000 });
      this.map.addMarker({
        position: latLng
      });
    }
    this.displayMap = true;
  }

  public recordFieldVisited(fieldName: string) {
    if (!this.fieldsVisited.includes(fieldName)) {
      this.fieldsVisited.push(fieldName);
    }
  }

  public hasFieldBeenVisited(fieldName: string) {
    return this.fieldsVisited.includes(fieldName);
  }

  public moveFocus(nextElement: IonInput) {
    nextElement.setFocus();
  }

  public darkModeOn() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

/////////////////////////////////// Consent ////////////////////////////////////

  private async doConsent() {
    this.settingsService.getConsentStatus().then(consentGiven => {
      if (consentGiven) {
        this.gotConsent = true;
      }
      if (!consentGiven) {
        return this.modalController.create({
          component: ConsentPage,
          cssClass: 'consent-class'
        }).then(modal => {
          modal.onWillDismiss().then((data) => {
            const consent = data.data.consent as Consent;
            if (data.data.submitted && consent != null && consent.isComplete()) {
              this.settingsService.recordConsent(consent.serialize());
              this.gotConsent = true;
            }
            else {
              console.log('Consent not given!');
              this.doConsent();
            }
          });
          return modal.present();
        });
      }
    });
  }

/////////////////////////////////// Settings ///////////////////////////////////

  private loadSettings() {
    this.settings.clear();
    this.keys.forEach(async (key) => {
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
    this.toastController.create({
      message: 'Details Saved',
      duration: 2000
    }).then(
      toast => toast.present()
    );
  }

  private getDisplayKey(key: string) {
    if (key.toUpperCase() === 'PLN') {
      return key.toUpperCase();
    }
    else {
      return key.replace(/_/g, ' ').replace(
        /\w\S*/g,
        (txt) => {
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
    this.authService.get(AuthService.accessTokenKey).then(
      value => this.accessToken = value
    );
    this.authService.get(AuthService.accessTokenExpiryKey).then(
      value => this.accessTokenExpiry = +value - (new Date().getTime() / 1000)
    );
    this.authService.get(AuthService.refreshTokenKey).then(
      value => this.refreshToken = value
    );
  }

///////////////////////////////////// Home /////////////////////////////////////

  private homeInit() {
    this.db.selectCatches().then(catches => this.catches = catches);
    this.caught = new Catch();
  }

  private recordCatch() {

    this.catchFormIncomplete = !this.caught.isComplete();
    const validity = this.caught.isValid();
    if (!validity.valid) {
      this.catchFormDataError = validity.message;
    }
    else {
      this.catchFormDataError = '';
    }

    if (!this.catchFormIncomplete && !this.catchFormDataError) {
      this.db.insertOrUpdateCatch(this.caught).then(
        _ => {
          this.db.selectCatches().then(catches => this.catches = catches);
          this.caught = new Catch();
        }
      );
    }
  }


//////////////////////////////////// Entries ///////////////////////////////////

  private entriesInit() {
    this.db.selectEntrySummaries().then(
      entries => this.entries = entries
    );
  }

///////////////////////////////// Entry Details ////////////////////////////////

  private entryInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params.entry_id) {
        this.db.selectEntry(parseInt(params.entry_id, 10)).then(
          entry => {
            this.entry = entry;
          }
        );
      }
      else {
        this.entry = new F1FormEntry();
        this.latitude = this.entry.getLatitude();
        this.longitude = this.entry.getLongitude();
      }
    });
  }

  public recordEntry() {
    if (!this.entry.isComplete()) {
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
      this.db.insertOrUpdateEntry(this.entry).then(
        _ => this.location.back()
      );
    }
  }

  public deleteEntry() {
    if (this.entry.getId() != null) {
      this.dialogs.confirm(
        'Are you sure you want to delete this entry?',
        'Confirm Delete',
        ['Delete', 'Cancel']
      ).then(
        (selected) => {
          if (selected === 1) {
            this.db.deleteEntry(this.entry.getId()).then(
              _ => this.location.back()
            );
          }
        }
      );
    }
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

  public getGear() {
    return F1FormEntry.getGearList();
  }

  public getMeshSizes() {
    return F1FormEntry.getMeshSizes();
  }

  public getStates() {
    return F1FormEntry.getStates();
  }

  public getPresentations() {
    return F1FormEntry.getPresentations();
  }


//////////////////////////////// Form Generation ///////////////////////////////

  private formInit() {
    this.db.selectEarliestEntryDate().then(
      date => this.sundays = this.getSundays(date)
    );
    this.f1Form = new F1Form();
    if (!this.f1Form.fisheryOffice) {
      this.f1Form.fisheryOffice = this.settingsService.getFisheriesOffice(
        this.settings.get('fisheries_office')
      );
      this.f1Form.pln = this.settings.get('pln');
      this.f1Form.vesselName = this.settings.get('vessel_name');
      this.f1Form.portOfDeparture = this.settings.get('port_of_departure');
      this.f1Form.portOfLanding = this.settings.get('port_of_landing');
      this.f1Form.ownerMaster = this.settings.get('owner_master');
      this.f1Form.address = this.settings.get('address');
      this.f1Form.totalPotsFishing = +this.settings.get('total_pots_fishing');
    }
  }

  public getSundays(startDate: Date): Date[] {
    const sundays = [];
    const today = new Date();
    let sunday = new Date(
      startDate.setDate(startDate.getDate() - startDate.getDay())
    );
    sunday.setHours(0, 0, 0, 0);
    while (
      sunday.getFullYear() < today.getFullYear() || (
        sunday.getFullYear() === today.getFullYear() &&
        sunday.getMonth() < today.getMonth()
      ) || (
        sunday.getFullYear() === today.getFullYear() &&
        sunday.getMonth() === today.getMonth() &&
        sunday.getDate() <= today.getDate()
      )
    ){
      sundays.push(new Date(sunday));
      sunday = new Date(sunday.setDate(sunday.getDate() + 7));
    }
    return sundays.reverse();
  }

  public setf1FormWeekStarting(dateString: string) {
    this.f1Form.weekStart = new Date(dateString);
    const weekEnd = new Date(this.f1Form.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    this.db.selectEntrySummariesBetweenDates(
      this.f1Form.weekStart, weekEnd
    ).then(
      entries => this.entries = entries
    );
  }

  public formHeadersComplete() {
    return (
      this.f1Form.fisheryOffice != null &&
      this.f1Form.weekStart != null
    );
  }

  public async generateXLSX() {
    const weekEnd = new Date(this.f1Form.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.db.selectFullEntriesBetweenDates(
      this.f1Form.weekStart, weekEnd
    ).then( entries => {
      this.f1Form.entries = entries;
      this.sheetService.form = this.f1Form;
      return this.sheetService.createWorkbook();
    });
  }

/////////////////////////////////// Wildlife ///////////////////////////////////

  private wildlifeInit() {
    this.db.selectObservations().then(
      observations => this.observations = observations
    );
    this.observation = new WildlifeObservation();
  }

  public recordWildlife() {
    if (this.observation.isComplete()) {
      this.db.insertObservation(this.observation).then(
        _ => this.db.selectObservations().then(observations => {
          this.observations = observations;
          this.observation = new WildlifeObservation();
          this.map.remove();
          this.displayMap = false;
        })
      );
    }
  }

  public getWildlifeAnimals() {
    return WildlifeObservation.getWildlifeAnimals();
  }

  public getWildlifeSpecies(animal: string) {
    return WildlifeObservation.getWildlifeSpecies(animal);
  }

  public getWildlifeBehaviours() {
    return WildlifeObservation.getWildlifeBehaviours();
  }

//////////////////////////////////// Creels ////////////////////////////////////

  private creelsInit() {
    this.db.selectCreels().then(
      creels => this.creels = creels
    );
    this.creel = new Creel();
  }

  public recordCreel() {
    if (this.creel.isComplete()) {
      this.db.insertCreel(this.creel).then(
        _ => this.db.selectCreels().then(creels => {
          this.creels = creels;
          this.creel = new Creel();
          this.map.remove();
          this.displayMap = false;
        })
      );
    }
  }

}


