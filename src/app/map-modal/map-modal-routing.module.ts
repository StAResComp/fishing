import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapModalPage } from './map-modal.page';

const routes: Routes = [
  {
    path: '',
    component: MapModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MapModalPageRoutingModule {}
