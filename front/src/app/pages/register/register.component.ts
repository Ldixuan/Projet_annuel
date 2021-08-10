import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {RestProvider} from '../../../providers/rest/rest'
import {Router} from "@angular/router";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  successAlertFade = true;
  errorAlertFade = true;
  MsgFade=true;

  constructor(
    private formBuilder: FormBuilder,
    private rest : RestProvider,
    private router : Router
    ) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      username : ['', [Validators.required, Validators.minLength(6)]],
      email : ['', [Validators.required, Validators.email]],
      password : ['', [Validators.required, Validators.minLength(6)]],
      customCheckRegister : [false, [Validators.requiredTrue]]
    });
  }

  onSubmit(): void{
    console.log(this.registerForm.value);

    if(this.registerForm.valid){
      this.rest.Register(this.registerForm.value).subscribe(
        f => {
          if(f.sucess){
            this.successAlertFade = false
            this.MsgFade = false

            setTimeout(() =>
            {
              this.router.navigate(['/login'])
            }, 2000)
            
          }else{
            this.errorAlertFade = false
            this.MsgFade = false
            this.registerForm.reset({username : "", email:"", password:"", customCheckRegister:false})
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
