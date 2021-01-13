import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'page/Home',
    pathMatch: 'full'
  },
  {
    path: 'page/:id',
    loadChildren: () => import('./page/page.module').then( m => m.PageModule)
  },
  {
    path: 'map-modal',
    loadChildren: () => import('./map-modal/map-modal.module').then( m => m.MapModalPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
