import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Location } from "@angular/common";
import {
  DbService,
  CompleteCatch,
  Observation
} from '../db.service';
import { SettingsService } from '../settings.service';
import { SheetService } from '../sheet.service';
import { AuthService } from '../auth.service';
import { PostService } from '../post.service';
import { MapModalPage } from '../map-modal/map-modal.page';
import {
  F1Form,
  F1FormEntry,
  F1FormEntrySummary,
  FisheryOffice,
  LatLng
} from '../models/F1Form.model';

type Catch = {
  id?: number
  date?: Date
  species?: string
  caught?: number
  retained?: number
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
  public catchFormDataError = "";

  public entry = new F1FormEntry();
  public entries: Array<F1FormEntrySummary>;
  public entryFormIncomplete = false;
  public entryFormDataError = false;

  public f1Form = new F1Form;
  public sundays = [];

  public today = new Date();

  public observation = {
    animal: "",
    species: "",
    description: "",
    num: 0,
    date: this.today,
    location: {
      lat: null,
      lng: null
    },
    behaviour: [],
    notes: ""
  };
  public observations: Array<Observation>;

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
    this.postService.postData();
    if (this.page.toLowerCase() == 'home') {
      this.homeInit();
    }
    if (this.page.toLowerCase() == 'f1entrieslist') {
      this.entriesInit();
    }
    else if (this.page.toLowerCase() == 'f1entrydetails') {
      this.entryInit();
    }
    else if (this.page.toLowerCase() == 'f1formgen') {
      this.formInit();
    }
    else if (this.page.toLowerCase() == 'wildlife') {
      this.wildlifeInit();
    }
  }

////////////////////////////// Cross-page Helpers //////////////////////////////

  public getSpeciesList() {
    return F1FormEntry.getSpeciesList();
  }

  public dateFromISO(isoDate: string) {
    return new Date(isoDate);
  }

  public async presentMapModal(wildlife = false) {
    const modal = await this.modalController.create({
      component: MapModalPage,
      cssClass: 'map-modal-class'
    });
    modal.onWillDismiss().then((data) => {
      if (data.data['submitted']) {
        if (wildlife) {
          this.observation.location['lat'] = data.data['latitude'];
          this.observation.location['lng'] = data.data['longitude'];
        }
        else {
          this.entry.setLatitude(data.data['latitude']);
          this.entry.setLongitude(data.data['longitude']);
        }
      }
    });
    return await modal.present();
  }

/////////////////////////////////// Settings ///////////////////////////////////

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

///////////////////////////////////// Home /////////////////////////////////////

  private homeInit() {
    this.db.selectCatches().then(catches => this.catches = catches);
    this.caught['date'] = this.today;
  }

  private recordCatch() {

    if (this.caught.species == null || this.caught.caught == null ||
      this.caught.caught == 0 || this.caught.retained == null) {
      //form incomplete...
      this.catchFormIncomplete = true;
    }
    else {
      this.catchFormIncomplete = false;
    }

    this.catchFormDataError = "";
    if (this.caught.caught < this.caught.retained) {
      //data error
      this.catchFormDataError += 'No. retained cannot be greater than no. caught.';
    }
    if (this.caught.date > new Date()) {
      if (this.catchFormDataError.length > 0) {
        this.catchFormDataError += '\n';
      }
      this.catchFormDataError += 'Time cannot be in the future.';
    }

    if (!this.catchFormIncomplete && !this.catchFormDataError) {
      this.db.insertOrUpdateCatch(this.caught as CompleteCatch).then(
        _ => this.db.selectCatches().then(catches => this.catches = catches)
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
        this.db.selectEntry(parseInt(params.entry_id)).then(
          entry => {
            this.entry = entry;
          }
        );
      }
      else {
        this.entry = new F1FormEntry();
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
    this.loadDraft();
    if (!this.f1Form['fisheriesOffice']) {
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

  public async saveDraft() {
    this.settingsService.setCurrentF1Form(this.f1Form.serializeWithouEntries());
  }

  private loadDraft() {
    this.settingsService.getCurrentF1Form().then(
      serializedForm => this.f1Form = F1Form.deserialize(serializedForm)
    );
  }

  public async generateXLSX() {
    await this.saveDraft();
    const weekEnd = new Date(this.f1Form['weekStarting']);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.db.selectFullEntriesBetweenDates(
      this.f1Form['weekStarting'], weekEnd
    ).then( entries => {
      const draftForm = new F1Form();
      draftForm.fisheryOffice = this.f1Form.fisheryOffice;
      draftForm.pln = this.f1Form.pln;
      draftForm.vesselName = this.f1Form.vesselName;
      draftForm.ownerMaster = this.f1Form.ownerMaster;
      draftForm.address = this.f1Form.address;
      draftForm.portOfDeparture = this.f1Form.portOfDeparture;
      draftForm.portOfLanding = this.f1Form.portOfLanding;
      draftForm.totalPotsFishing = this.f1Form.totalPotsFishing;
      draftForm.comments = this.f1Form.comments;
      draftForm.entries = entries;
      this.sheetService.form = draftForm as F1Form;
      return this.sheetService.createWorkbook();
    });
  }

/////////////////////////////////// Wildlife ///////////////////////////////////

  private wildlifeInit() {
    this.db.selectObservations().then(
      observations => this.observations = observations
    );
  }

  public recordWildlife() {
    this.db.insertObservation(this.observation).then(
      _ => this.db.selectObservations().then(observations => {
        this.observations = observations
        this.observation = {
          animal: "",
          species: "",
          description: "",
          num: 0,
          date: this.today,
          location: {
            lat: null,
            lng: null
          },
          behaviour: [],
          notes: ""
        };
      })
    );
  }

  public getWildlifeAnimals() {
    return [
      { name: "Seal", subspecies: ["Harbour (Common) Seal", "Grey Seal"]},
      { name: "Porpoise", subspecies: ["Harbour Porpoise"]},
      { name: "Dolphin", subspecies: [
        "Bottlenose Dolphin",
        "Common Dolphin",
        "Risso's Dolphin",
        "White-beaked Dolphin",
        "Atlantic White-sided Dolphin",
        "Killer Whale (Orca)",
        "Pilot Whale"
      ]},
      { name: "Whale", subspecies: [
        "Minke Whale",
        "Humpback Whale",
        "Sperm Whale",
        "Fin Whale",
        "Sei Whale"
      ]},
      { name: "Shark", subspecies: ["Basking Shark", "Porbeagle Shark"]}
    ];
  }

  public getWildlifeSpecies(species: string) {
    const allSpecies = this.getWildlifeAnimals();
    for (let i = 0; i < allSpecies.length; i++) {
      if (species?.toLowerCase().trim() ==
          allSpecies[i].name.toLowerCase().trim()) {
        return allSpecies[i].subspecies;
      }
    }
    return [];
  }

  public getWildlifeBehaviours() {
    return [
      "Approaching the vessel",
      "Feeding",
      "Interacting with fishing gear",
      "Bow-riding",
      "Breaching",
      "Travelling"
    ];
  }
}
