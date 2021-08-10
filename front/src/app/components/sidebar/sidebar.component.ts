import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {RestProvider} from '../../../providers/rest/rest'

declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}
export const ROUTES: RouteInfo[] = [
    { path: '/dashboard', title: 'Dashboard',  icon: 'ni-chart-bar-32 text-primary', class: '' },
    { path: '/symptoms_checker', title: 'Checker', icon: 'ni-check-bold text-primary', class: ''},
    { path: '/update_data', title: 'Update', icon: 'ni-cloud-upload-96 text-primary', class: ''}
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  public menuItems: any[];
  public isCollapsed = true;

  constructor(
    private router: Router,
    private rest : RestProvider) { }

  ngOnInit() {
    var permission = "is_custom"

    if(this.rest.cookieService.hasKey('permission')){
      permission = this.rest.cookieService.get('permission')
    }

    this.menuItems = ROUTES.filter(menuItem => {
      
      if(menuItem.title=="Update"){
        if(permission=="is_admin" ){
          return menuItem
        }else{
          return null
        }
      }else{
        return menuItem
      }
    });

    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
   });

   console.log(this.menuItems)
  }
}
