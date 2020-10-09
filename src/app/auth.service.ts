import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import { Platform } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

declare let cordova: any;

@Injectable()
export class AuthService {

  private access_token_key = 'access_token';
  private refresh_token_key = 'refresh_token';
  private allowedKeys: Array<string> = [
    this.access_token_key,
    this.refresh_token_key
  ];

  private grant_type_authorize = 'authorization_code';
  private grant_type_refresh = 'refresh_token';

  private authUrl = environment.authUrl;
  private tokenUrl = environment.tokenUrl;
  private client_id = environment.client_id;
  private client_secret = environment.client_secret;
  private redirect_uri = environment.redirect_uri;

  constructor(
    private storage: Storage,
    private platform: Platform,
    private browser: InAppBrowser,
    private http: HttpClient
  ) {}

  public getKeys() {
    return this.allowedKeys;
  }

  public async get(key: string) : Promise<string> {
    return this.storage.get(this.fullKey(key));
  }

  public set(key: string, value: string) {
    return this.storage.set(this.fullKey(key), value);
  }

  private fullKey(key: string) : string{
    const keyPrefix = "auth";
    if (this.allowedKeys.includes(key)) {
      return `${keyPrefix}:${key}`;
    }
    else {
      throw new Error('Invalid settings key');
    }
  }

  private getAuthRequest() {
    return `${this.authUrl}?response_type=code&client_id=${this.client_id}&redirect_uri=${this.redirect_uri}`;
  }

  private getTokenPostBody(
    grantType: string = this.grant_type_refresh,
    authCode?: string
  ) {
    if (grantType == this.grant_type_authorize && authCode == null) {
      throw new Error('Code needed for authorization_code request');
    }
    const postBody = {
      client_id: this.client_id,
      client_secret: this.client_secret,
      redirect_uri: this.redirect_uri,
      grant_type: "authorization_code"
    }
    if (authCode != null) {
      postBody['code'] = authCode;
    }
    return postBody;
  }

  private getToken(
    grantType: string = this.grant_type_refresh,
    authCode?: string
  ) {
    const headers = new HttpHeaders();
    headers.append("Cache-Control", "no-cache");
    type TokenResponse = {
      access_token: string
      expires_in: number
      token_type: string
      scope?: string
      refresh_token: string
    }
    this.http.post<TokenResponse>(
      this.tokenUrl,
      this.getTokenPostBody(grantType, authCode),
      { headers: headers }
    ).subscribe(data => {
        this.set(this.access_token_key, data.access_token);
        this.set(this.refresh_token_key, data.refresh_token);
      }, error => {
        console.log('Token request error');
        console.log(error);
        alert("Authentication error");
      }
    );
  }

  public authenticate() {
    const self = this;
    this.platform.ready().then(() => {
      const loginPromise = new Promise(function(resolve, reject) {
        const browserRef = cordova.InAppBrowser.open(
          self.getAuthRequest(),
          "_blank",
          "location=no,clearsessioncache=yes,clearcache=yes"
        );
        browserRef.addEventListener("loadstart", (event) => {
          if ((event.url).indexOf(self.redirect_uri) === 0) {
            const code = event.url.substring(event.url.lastIndexOf('=') + 1);
            self.getToken(self.grant_type_authorize, code);
            browserRef.removeEventListener("exit", (event) => {});
            browserRef.close();
          }
        });
        browserRef.addEventListener("exit", function(event) {
          reject("Sign in process was cancelled");
        });
      });
    });
  }

  public refreshToken() {
    this.getToken(this.grant_type_refresh);
  }
}
