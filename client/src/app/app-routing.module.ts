import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//Import components
import { SonguploadComponent } from './components/songupload.component';

const routes: Routes = [
  { path: '', component: SonguploadComponent },
  //{ path: 'login', component: UserComponent },
  //{ path: 'login/:name', component: SuccessfulComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
