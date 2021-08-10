import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {RestProvider} from '../../../providers/rest/rest'
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm : FormGroup;
  successAlertFade = true;
  errorAlertFade = true
  MsgFade = true
  
  constructor(
    private formBuilder: FormBuilder,
    private rest : RestProvider,
    private router : Router
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username : ['', [Validators.required]],
      password : ['', [Validators.required]],
      remeberMe : [false]
    })
  }
  ngOnDestroy() {
  }

  onSubmit(): void{
    if(this.loginForm.valid){
      this.rest.Login(this.loginForm.value).subscribe(
        f => {
          if(f.sucess){
            this.rest.cookieService.put("username", f.data.username)
            this.rest.cookieService.put("permission", f.data.permission)
            this.successAlertFade = false
            this.MsgFade = false
            
            setTimeout(() =>
            {
              this.router.navigate(['/'])
            }, 2000)
            
          }else{
            this.errorAlertFade = false
            this.MsgFade = false
            this.loginForm.get("password").setValue("")
          }
        },
        error => {
          console.log(error);
        }
        
      )
    }else{
      alert("info incorret")
    }
  }

}
