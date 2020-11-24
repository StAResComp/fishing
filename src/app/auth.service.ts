import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import { Platform } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

// Need this to give access to cordova global for in-app browser
declare let cordova: any;

/**
 * Defines the shape of an OAuth2 POST request body
 */
type PostBody = {
  client_id: string
  client_secret: string
  redirect_uri: string
  grant_type: string
  code?: string
};

/**
 * Service to handle authorisation to server using OAuth2. Makes OAuth requests
 * and stores tokens using basic Ionic key-value storage API.
 */
@Injectable()
export class AuthService {

  // Keys of values to be stored
  private static readonly access_token_key = 'access_token';
  private static readonly access_token_expiry_key = 'access_token_expiry';
  private static readonly refresh_token_key = 'refresh_token';
  private static readonly allowedKeys: Array<string> = [
    AuthService.access_token_key,
    AuthService.access_token_expiry_key,
    AuthService.refresh_token_key
  ];

  // Grant type values for the two kinds o OAuth requests needed
  private static readonly grant_type_authorize = 'authorization_code';
  private static readonly grant_type_refresh = 'refresh_token';

  // Environment details needed to build and make OAuth requests
  private static readonly authUrl = environment.authUrl;
  private static readonly tokenUrl = environment.tokenUrl;
  private static readonly client_id = environment.client_id;
  private static readonly client_secret = environment.client_secret;
  private static readonly redirect_uri = environment.redirect_uri;


  /**
   * @param storage The Ionic Storage instance to be used
   * @param platform The Ionic Platform instance, to be checked for readiness
   * @param browser The InAppBrowser instance users will use to log in
   * @param http HttpClient for making OAuth requests
   */
  constructor(
    private storage: Storage,
    private platform: Platform,
    private browser: InAppBrowser,
    private http: HttpClient
  ) {}

  /**
   * @return Array<string> The set of keys handled by this service
   */
  public getKeys() : Array<string> {
    return AuthService.allowedKeys;
  }

  /**
   * @param key The key of the value sought
   * @return Promise<string> A Promise of the retrieved value
   */
  public async get(key: string) : Promise<string> {
    return this.storage.get(AuthService.fullKey(key));
  }

  /**
   * @param key The key of the value to be set
   * @param value The value to be set
   * @return boolean Whether the value has been stored successfully
   */
  public set(key: string, value: string) {
    return this.storage.set(AuthService.fullKey(key), value);
  }

  /**
   * Helper method that checks supplied key is in the group handled by this
   * service and prefixes it with 'auth:' to protect against clashes
   * @param key The unprefixed key
   * @return string The prefixed key
   * @throws Error If the key is not in the allowed group
   */
  private static fullKey(key: string) : string{
    const keyPrefix = "auth";
    if (AuthService.allowedKeys.includes(key)) {
      return `${keyPrefix}:${key}`;
    }
    else {
      throw new Error('Invalid settings key');
    }
  }

  /**
   * Generates an authorisation request
   * @return string The generated request
   */
  private static getAuthRequest() {
    return `${AuthService.authUrl}?response_type=code&client_id=${AuthService.client_id}&redirect_uri=${AuthService.redirect_uri}`;
  }

  /**
   * Returns the current time in seconds since 1970
   * @return number Time in seconds since 1970
   */
  private static timeInSecs() : number {
    return new Date().getTime() / 1000;
  }

  /**
   * Generates the body of a POST request for an OAuth token
   * @param grantType The kind of request being made
   * @param authCode The authorisation code for an authorisation request
   * @return PostBody The post body
   * @throws Error If grant type is authorization_code but no code supplied
   */
  private static getTokenPostBody(
    grantType: string = AuthService.grant_type_refresh,
    authCode?: string
  ) : PostBody {
    if (grantType == AuthService.grant_type_authorize && authCode == null) {
      throw new Error('Code needed for authorization_code request');
    }
    const postBody = {
      client_id: AuthService.client_id,
      client_secret: AuthService.client_secret,
      redirect_uri: AuthService.redirect_uri,
      grant_type: grantType
    }
    if (authCode != null) {
      postBody['code'] = authCode;
    }
    return postBody;
  }

  private static getPostHeaders

  /**
   * Makes a request for a token and stores the returned details
   * @param grantType The kind of request being made
   * @param authCode The authorisation code for an authorisation request
   */
  private authorise(
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
        this.set(
          AuthService.access_token_expiry_key,
          (AuthService.timeInSecs() + data.expires_in).toString()
        );
        this.set(AuthService.refresh_token_key, data.refresh_token);
      }, error => {
        console.log('Token request error');
        console.log(error);
        alert("Authentication error");
      }
    );
  }

  /**
   * Carries out authentication by launching in-app browser for user to log on.
   * Then starts OAuth2 authorization process.
   */
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
            // Do the OAuth authorization
            const code = event.url.substring(event.url.lastIndexOf('=') + 1);
            self.authorise(AuthService.grant_type_authorize, code);
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

  /**
   * Checks if the token needs refreshed, starts refresh process if needed.
   */
  public async refreshTokenIfNecessary() {
    const expiryStr = await this.get(AuthService.access_token_expiry_key);
    if ((Number(expiryStr) - AuthService.timeInSecs()) < 60) {
      this.refreshToken();
    }
  }

  /**
   * Refreshes token
   */
  public refreshToken() {
    this.authorise(AuthService.grant_type_refresh);
  }

  /**
   * Returns a Promise of an authorization HTTP header to be included in
   * requests requiring authentication.
   * @return Promise<string> A Promise of the authorization header
   */
  public async getAuthHeader() : Promise<string>{
    await this.refreshTokenIfNecessary();
    const authCode = await this.get(AuthService.access_token_key);
    return `Authorization: Bearer ${authCode}`;
  }
}
