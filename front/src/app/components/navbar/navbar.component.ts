import { Component, OnInit, ElementRef } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import {RestProvider} from '../../../providers/rest/rest'

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public focus;
  public listTitles: any[];
  public location: Location;
  public username;

  constructor(
    location: Location,  
    private element: ElementRef, 
    private router: Router,
    private rest: RestProvider
    ) {
    this.location = location;
  }

  ngOnInit() {
    this.listTitles = ROUTES.filter(listTitle => listTitle);
    this.listTitles.push({"path":"/faq", "title":"F . A . Q"})
    console.log(this.listTitles)
  }

  getTitle(){
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if(titlee.charAt(0) === '#'){
        titlee = titlee.slice( 1 );
    }

    for(var item = 0; item < this.listTitles.length; item++){
        if(this.listTitles[item].path === titlee){
            return this.listTitles[item].title;
        }
    }
    return 'Dashboard';
  }

  ngAfterContentChecked(){
    if(this.rest.cookieService.hasKey('username')){
      this.username = this.rest.cookieService.get('username')
    }
  }

  Logout(){
    this.rest.Logout().subscribe(
      f => {
        if(f.sucess){
          this.rest.cookieService.remove('username');
          this.rest.cookieService.remove('permission');
          console.log("success")
          this.username = undefined
          location.reload();
        }else{
          console.log(f.msg)
        }
      },
        error => {
          console.log(error)
        }
    )
  }

}
