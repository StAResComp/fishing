import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import { Platform } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

declare let cordova: any;

@Injectable()
export class AuthService {

  private static readonly access_token_key = 'access_token';
  private static readonly refresh_token_key = 'refresh_token';
  private static readonly allowedKeys: Array<string> = [
    AuthService.access_token_key,
    AuthService.refresh_token_key
  ];

  private static readonly grant_type_authorize = 'authorization_code';
  private static readonly grant_type_refresh = 'refresh_token';

  private static readonly authUrl = environment.authUrl;
  private static readonly tokenUrl = environment.tokenUrl;
  private static readonly client_id = environment.client_id;
  private static readonly client_secret = environment.client_secret;
  private static readonly redirect_uri = environment.redirect_uri;

  constructor(
    private storage: Storage,
    private platform: Platform,
    private browser: InAppBrowser,
    private http: HttpClient
  ) {}

  public getKeys() {
    return AuthService.allowedKeys;
  }

  public async get(key: string) : Promise<string> {
    return this.storage.get(AuthService.fullKey(key));
  }

  public set(key: string, value: string) {
    return this.storage.set(AuthService.fullKey(key), value);
  }

  private static fullKey(key: string) : string{
    const keyPrefix = "auth";
    if (AuthService.allowedKeys.includes(key)) {
      return `${keyPrefix}:${key}`;
    }
    else {
      throw new Error('Invalid settings key');
    }
  }

  private static getAuthRequest() {
    return `${AuthService.authUrl}?response_type=code&client_id=${AuthService.client_id}&redirect_uri=${AuthService.redirect_uri}`;
  }

  private static getTokenPostBody(
    grantType: string = AuthService.grant_type_refresh,
    authCode?: string
  ) {
    if (grantType == AuthService.grant_type_authorize && authCode == null) {
      throw new Error('Code needed for authorization_code request');
    }
    const postBody = {
      client_id: AuthService.client_id,
      client_secret: AuthService.client_secret,
      redirect_uri: AuthService.redirect_uri,
      grant_type: "authorization_code"
    }
    if (authCode != null) {
      postBody['code'] = authCode;
    }
    return postBody;
  }

  private getToken(
    grantType: string = AuthService.grant_type_refresh,
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
      AuthService.tokenUrl,
      AuthService.getTokenPostBody(grantType, authCode),
      { headers: headers }
    ).subscribe(data => {
        this.set(AuthService.access_token_key, data.access_token);
        this.set(AuthService.refresh_token_key, data.refresh_token);
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
          AuthService.getAuthRequest(),
          "_blank",
          "location=no,clearsessioncache=yes,clearcache=yes"
        );
        browserRef.addEventListener("loadstart", (event) => {
          if ((event.url).indexOf(AuthService.redirect_uri) === 0) {
            const code = event.url.substring(event.url.lastIndexOf('=') + 1);
            self.getToken(AuthService.grant_type_authorize, code);
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
    this.getToken(AuthService.grant_type_refresh);
  }
}
