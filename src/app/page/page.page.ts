import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../db.service';
import { SettingsService } from '../settings.service';
import { AuthService } from '../auth.service';

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private db: DbService,
    private settingsService: SettingsService,
    private authService: AuthService
  ) {
    this.keys = this.settingsService.getKeys();
    this.loadSettings();
  }

  ngOnInit() {
    this.page = this.activatedRoute.snapshot.paramMap.get('id');
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

  public recordCatch() {}

  public recordEntry() {}

  public generateForm() {}

  public recordWildlife() {}

  public getSpecies() {
    return [
      { id: 'CRE', name: 'Brown Crab' },
      { id: 'LBE', name: 'Lobster' },
      { id: 'NEP', name: 'Nephrops' },
      { id: 'CRS', name: 'Velvet Crab' },
      { id: 'SQC', name: 'Squid' }
    ];
  }

  public getCatches() {
    return [
      { date: '11 Dec 2020', time: '14:42', species: 'Brown Crab', caught: 12, retained: 8 },
      { date: '11 Dec 2020', time: '14:41', species: 'Velvet Crab', caught: 6, retained: 6 },
      { date: '11 Dec 2020', time: '14:41', species: 'Lobster', caught: 2, retained: 0 },
      { date: '10 Dec 2020', time: '14:42', species: 'Brown Crab', caught: 12, retained: 8 },
      { date: '10 Dec 2020', time: '14:41', species: 'Velvet Crab', caught: 6, retained: 6 },
      { date: '10 Dec 2020', time: '14:41', species: 'Lobster', caught: 2, retained: 0 }
    ];
  }
}
