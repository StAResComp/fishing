import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../environments/environment';

import { AuthService } from './auth.service';
import { DbService } from './db.service';
import { SettingsService } from './settings.service';

@Injectable()
export class PostService {

  private static readonly postUrl = environment.dataUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private db: DbService,
    private settingsService: SettingsService
  ) {}

  private isLoggedIn() {
    return this.authService.loggedIn;
  }

  public async postData() {
    this.postObservations();
    this.postCatches();
    this.postEntries();
    this.postGear();
    this.postConsent();
  }

  public async postCatches() {
    return this.db.selectUnsubmittedCatches().then(catches => {
      if (catches && catches.length > 0) {
        const catchesObject = { catches };
        return this.sendPostRequest(catchesObject).then(response => {
          if (response) {
            const ids: number[] = [];
            for (const caught of catches){
              ids.push(caught.getId());
            }
            this.db.markAsSubmitted('catches', ids);
          }
          return response;
        });
      }
      return false;
    });
  }

  public async postEntries() {
    return this.db.selectUnsubmittedEntries().then(entries => {
      if (entries && entries.length > 0) {
        const entriesObject = { entries };
        return this.sendPostRequest(entriesObject).then(response => {
          if (response) {
            const ids: number[] = [];
            for (const entry of entries){
              ids.push(entry.getId());
            }
            this.db.markAsSubmitted('entries', ids);
          }
          return response;
        });
      }
      return false;
    });
  }

  public async postObservations() {
    return this.db.selectUnsubmittedObservations().then(observations => {
      if (observations && observations.length > 0) {
        const observationsObject = { observations };
        return this.sendPostRequest(observationsObject).then(response => {
          if (response) {
            const ids: number[] = [];
            for (const observation of observations){
              ids.push(observation.getId());
            }
            this.db.markAsSubmitted('observations', ids);
          }
          return response;
        });
      }
      return false;
    });
  }

  public async postGear() {
    return this.db.selectUnsubmittedGear().then(gear => {
      if (gear && gear.length > 0) {
        const gearObject = { gear };
        return this.sendPostRequest(gearObject).then(response => {
          if (response) {
            const ids: number[] = [];
            for (const g of gear){
              ids.push(g.getId());
            }
            this.db.markAsSubmitted('gear', ids);
          }
          return response;
        });
      }
      return false;
    });
  }

  public async postConsent() {
    return this.settingsService.getConsentSubmitted().then(alreadySubmitted => {
      if (!alreadySubmitted) {
        return this.settingsService.getConsentDetails().then(consent => {
          return this.sendPostRequest(JSON.parse(consent)).then(response => {
            if (response) {
              this.settingsService.setConsentSubmitted();
            }
            return response;
          });
        });
      }
      else {
        return false;
      }
    });
  }

  private async sendPostRequest(data: any) {
    if (this.isLoggedIn()) {
      return this.authService.getAuthHeader().then(header => {
        const options = {
          headers: new HttpHeaders({
            Authorization: header[1],
            'Content-Type': 'application/json'
          })
        };
        return this.http.post(PostService.postUrl, data, options).toPromise().then(
          response => {
            return response['success'];
          }
        ).catch(e => {
          return false;
        });
      }).catch(e => {
        return false;
      });
    }
  }

}
