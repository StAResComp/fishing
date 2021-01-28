import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PageRoutingModule } from './page-routing.module';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { HttpClientModule } from '@angular/common/http';

import { Page } from './page.page';
import { DbService } from '../db.service';
import { SettingsService } from '../settings.service';
import { SheetService } from '../sheet.service';
import { AuthService } from '../auth.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PageRoutingModule,
    HttpClientModule
  ],
  providers: [
    DbService,
    SettingsService,
    SheetService,
    AuthService,
    InAppBrowser
  ],
  declarations: [Page]
})
export class PageModule {}
