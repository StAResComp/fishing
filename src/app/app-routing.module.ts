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
    path: 'consent',
    loadChildren: () => import('./consent/consent.module').then( m => m.ConsentPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, relativeLinkResolution: 'legacy' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
