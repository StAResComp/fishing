import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";

@Injectable()
export class SettingsService {

  private allowedKeys: Array<string> = [
    "fisheries_office",
    "pln",
    "vessel_name",
    "owner_master",
    "address",
    "port_of_departure",
    "port_of_landing",
    "total_pots_fishing"
  ];

  constructor(private storage: Storage) {}

  public getKeys() {
    return this.allowedKeys;
  }

  public async get(key: string) : Promise<string> {
    return this.storage.get(this.fullKey(key));
  }

  public set(key: string, value: string) {
    console.log(`Setting ${key} to ${value}`);
    return this.storage.set(this.fullKey(key), value);
  }

  private fullKey(key: string) : string{
    const keyPrefix = "setting";
    if (this.allowedKeys.includes(key)) {
      return `${keyPrefix}:${key}`;
    }
    else {
      throw new Error('Invalid settings key');
    }
  }

  public async recordConsent(serializedConsent: string) {
    this.storage.set('consentGiven', true);
    this.storage.set('consentDetails', serializedConsent);
  }

  public async getConsentStatus() {
    return this.storage.get('consentGiven');
  }

  public async setCurrentF1Form(serializedForm: string) {
    return this.storage.set('currentF1Form', serializedForm);
  }

  public async getCurrentF1Form(): Promise<string>{
    return this.storage.get('currentF1Form');
  }

  public getFisheriesOffice(officeName: string) {
    for (const office of this.getFisheriesOffices()) {
      if (office.name.trim() == officeName.trim()) {
        return office;
      }
    }
    return null;
  }

  public getFisheriesOffices() {
    return [
      {
        name: "Aberdeen",
        address: "Room A30, 375 Victoria Road, ABERDEEN AB11 9DB",
        phone: "0300 244 9166",
        email: "fo.aberdeen@gov.scot"
      },
      {
        name: "Anstruther",
        address: "28 Cunzie Street, ANSTRUTHER KY10 3DF",
        phone: "0300 244 9100",
        email: "fo.anstruther@gov.scot"
      },
      {
        name: "Ayr",
        address: "Russell House, King Street, AYR KA8 0BE",
        phone: "0300 244 8220",
        email: "fo.ayr@gov.scot"
      },
      {
        name: "Buckie",
        address: "Suites 3 -5, Douglas Centre, March Road, BUCKIE AB56 4BT",
        phone: "0300 244 9266",
        email: "fo.buckie@gov.scot"
      },
      {
        name: "Campbeltown",
        address: "40 Hall Street, CAMPBELTOWN PA28 6BU",
        phone: "0300 244 8690",
        email: "fo.campbeltown@gov.scot"
      },
      {
        name: "Eyemouth",
        address: "Gunsgreen, Fish Market Buildings, EYEMOUTH TD14 5SD",
        phone: "",
        email: "fo.eyemouth@gov.scot"
      },
      {
        name: "Fraserburgh",
        address: "121 Shore Street, FRASERBURGH AB43 9BR",
        phone: "0300 244 9424",
        email: "fo.fraserburgh@gov.scot"
      },
      {
        name: "Kinlochbervie",
        address: "Bervie Pier, Kinlochbervie, LAIRG IV27 4RR",
        phone: "0300 244 7920",
        email: "fo.kinlochbervie.gov.scot"
      },
      {
        name: "Kirkwall",
        address: "Terminal Buildings, Kirkwall Passenger Terminal, East Pier, KIRKWALL KW15 1HU",
        phone: "0300 244 6699",
        email: "fo.kirkwall@gov.scot"
      },
      {
        name: "Lerwick",
        address: "Alexandra Buildings, Lerwick, SHETLAND ZE1 0LL",
        phone: "0300 244 2101",
        email: "fo.lerwick@gov.scot"
      },
      {
        name: "Lochinver",
        address: "Culag Pier, Lochinver, LAIRG IV27 4LE",
        phone: "0300 244 7910",
        email: "fo.lochinver@gov.scot"
      },
      {
        name: "Mallaig",
        address: "Marine Office, Harbour Offices, MALLAIG PH41 4QB",
        phone: "01687 462155",
        email: "fo.mallaig@gov.scot"
      },
      {
        name: "Oban",
        address: "Marine Office, Cameron House, Albany Street, OBAN PA34 4AE",
        phone: "0300 244 9400",
        email: "fo.oban@gov.scot"
      },
      {
        name: "Peterhead",
        address: "Caley Buildings, 28-32 Harbour Street, PETERHEAD AB42 1DN",
        phone: "0300 244 9200",
        email: "fo.peterhead@gov.scot"
      },
      {
        name: "Portree",
        address: "Marine Office, Estates Office, Scorrybreac, PORTREE, Isle of Skye, IV51 9DH",
        phone: "0300 244 8778",
        email: "fo.portree@gov.scot"
      },
      {
        name: "Scrabster",
        address: "Scrabster Fishery Office, St Ola House, SCRABSTER KW14 7UJ",
        phone: "0300 244 4058",
        email: "fo.scrabster@gov.scot"
      },
      {
        name: "Stornoway",
        address: "Marine Office, Quay Street, STORNOWAY, Isle of Lewis, HS1 2XX",
        phone: "0300 244 8702",
        email: "fo.stornoway@gov.scot"
      },
      {
        name: "Ullapool",
        address: "West Shore Street, ULLAPOOL IV26 2UR",
        phone: "0300 244 0286",
        email: "fo.ullapool@gov.scot"
      }
    ]
  }
}
