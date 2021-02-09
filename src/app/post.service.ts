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

  private postUrl = "https://hookb.in/oXRp1QBg78F1mmLaRDrO";

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private db: DbService
  ) {}

  private isLoggedIn() {
    return this.authService.loggedIn;
  }

  public async postCatches() {
    let response = null;
    this.db.selectUnsubmittedCatches().then(catches => {
      if (catches && catches.length > 0) {
        response = this.sendPostRequest(catches);
      }
    });
    return response;
  }

  public async postEntries() {
    let response = null;
    this.db.selectUnsubmittedEntries().then(entries => {
      if (entries && entries.length > 0) {
        response = this.sendPostRequest(entries);
      }
    });
    return response;
  }

  private sendPostRequest(data: Array<any>) {
    if (this.isLoggedIn()) {
      return this.authService.getAuthHeader().then(header => {
        const options = {
          headers: new HttpHeaders({
            'Authorization': header[1]
          })
        };
        return this.http.post(this.postUrl, data, options).subscribe(
          response => { return response; }
        );
      });
    }
  }

}
