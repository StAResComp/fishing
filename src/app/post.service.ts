import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { AuthService } from "./auth.service";
import { DbService } from "./db.service";

@Injectable()
export class PostService {

  private postUrl = "https://hookb.in/6Jw3MwzOqLFLbb031zyO";

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private db: DbService
  ) {}

  private isLoggedIn() {
    return this.authService.loggedIn;
  }

  public async postData() {
    this.postObservations();
    this.postCatches();
    this.postEntries();
  }

  public async postCatches() {
    return this.db.selectUnsubmittedCatches().then(catches => {
      if (catches && catches.length > 0) {
        return this.sendPostRequest(catches).then(response => {
          if (response) {
            const ids: number[] = [];
            for (let i = 0; i < catches.length; i++){
              ids.push(catches[i].id);
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
        return this.sendPostRequest(entries).then(response => {
          if (response) {
            const ids: number[] = [];
            for (let i = 0; i < entries.length; i++){
              ids.push(entries[i].getId());
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
        return this.sendPostRequest(observations).then(response => {
          if (response) {
            const ids: number[] = [];
            for (let i = 0; i < observations.length; i++){
              ids.push(observations[i].getId());
            }
            this.db.markAsSubmitted('observations', ids);
          }
          return response;
        });
      }
      return false;
    });
  }

  private async sendPostRequest(data: Array<any>) {
    if (this.isLoggedIn()) {
      return this.authService.getAuthHeader().then(header => {
        const options = {
          headers: new HttpHeaders({
            //'Authorization': header[1]
          })
        };
        return this.http.post(this.postUrl, data, options).toPromise().then(
          response => {
            return response['success'];
          }
        ).catch(e => {
          console.log(`Error posting data: ${JSON.stringify(e)}`);
          return false;
        });
      }).catch(e => {
        console.log(`Error posting data: ${JSON.stringify(e)}`);
        return false;
      });
    }
  }

}
