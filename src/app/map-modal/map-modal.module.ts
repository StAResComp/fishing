import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MapModalPageRoutingModule } from './map-modal-routing.module';

import { MapModalPage } from './map-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapModalPageRoutingModule
  ],
  declarations: [MapModalPage]
})
export class MapModalPageModule {}
