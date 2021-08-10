import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { threadId } from 'worker_threads';
import {RestProvider} from '../../../providers/rest/rest'

@Component({
  selector: 'app-symptoms-checker',
  templateUrl: './symptoms-checker.component.html',
  styleUrls: ['./symptoms-checker.component.css']
})
export class SymptomsCheckerComponent implements OnInit {
  symptomsForm: FormGroup;

  public age : number = 0
  public prob : number = null
  public symptomsCol : any;
  public userInfoCol : any;
  private loading : boolean = false

  private cols_receive = {
    "symptoms" : [],
    "userInfo" : []
  }

  private s3FileNamePerType = {
    "symptoms" : "col_symptoms.json",
    "userInfo" : "col_with_options.json"
  }

  constructor(
    private formBuilder: FormBuilder,
    private rest : RestProvider
    ) { }

  ngOnInit(): void {

    this.symptomsForm = this.formBuilder.group({});
    this.loading = true
    this.load_file_from_s3()

  }

  load_file_from_s3(){

    this.rest.GetCols().subscribe(
      f => {
        if(f.sucess){
          this.symptomsCol = JSON.parse(f.data["symptomsCol"])
          console.log(f.data["userInfoCol"])
          this.userInfoCol = JSON.parse(f.data["userInfoCol"])
          
          
          this.symptomsCol.forEach(symptoms => {
            this.symptomsForm.addControl(symptoms.key, new FormControl(false))
          });
    
          this.userInfoCol.forEach(userInfo => {
            this.symptomsForm.addControl(userInfo.key, new FormControl(userInfo.value[0]))
          });

          this.loading = false
        }else{
          alert(f.msg)
        }
      },
      error => {
        console.log(error);
      }
    )

    return
  }

  onSubmit(): void{
    console.log(JSON.stringify(this.symptomsForm.value));
    this.loading = true
    if(this.symptomsForm.valid){
      this.rest.CheckerSymptoms(this.symptomsForm.value).subscribe(
        f => {
          if(f.sucess){
            console.log(f)
            this.prob = f.data
          }else{
            alert(f.msg)
          }
          this.loading = false
        },
        error => {
          console.log(error);
          this.loading = false
        }
        
      )
    }else{
      alert("info incorret")
      this.loading = false
    }
  }

}
