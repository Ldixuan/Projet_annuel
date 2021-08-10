import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClipboardModule } from 'ngx-clipboard';

import { AdminLayoutRoutes } from './admin-layout.routing';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { SymptomsCheckerComponent } from '../../pages/symptoms-checker/symptoms-checker.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {RestProvider} from '../../../providers/rest/rest';
import {UpdateDataComponent} from '../../pages/update-data/update-data.component'
import {FaqComponent} from '../../pages/faq/faq.component'
import {HttpModule} from '@angular/http';
// import { ToastrModule } from 'ngx-toastr';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HttpModule,
    NgbModule,
    ClipboardModule
  ],
  declarations: [
    DashboardComponent,
    SymptomsCheckerComponent,
    FaqComponent,
    UpdateDataComponent
  ],
  providers:[
    RestProvider
  ]
})

export class AdminLayoutModule {}
