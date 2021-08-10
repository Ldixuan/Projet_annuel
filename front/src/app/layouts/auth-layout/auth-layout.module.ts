import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth-layout.routing';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {HttpModule} from '@angular/http';
import { CookieModule } from 'ngx-cookie';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';
import {RestProvider} from '../../../providers/rest/rest'

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HttpModule
    // NgbModule
  ],
  declarations: [
    LoginComponent,
    RegisterComponent
  ],
  providers: [
    RestProvider,
    
  ]

})
export class AuthLayoutModule { }
