import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {RestProvider} from '../../providers/rest/rest'
import {HttpModule} from '@angular/http';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    HttpModule
  ],
  declarations: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent
  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent
  ],
  providers:[
    RestProvider
  ]
})
export class ComponentsModule { }
