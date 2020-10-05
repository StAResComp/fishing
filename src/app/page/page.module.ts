import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PageRoutingModule } from './page-routing.module';

import { Page } from './page.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PageRoutingModule
  ],
  declarations: [Page]
})
export class PageModule {}
