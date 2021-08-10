import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js';
import {RestProvider} from '../../../providers/rest/rest'
import {formatDate} from '@angular/common';

// core components
import {
  chartOptions,
  parseOptions,
  chartExample1,
  chartExample2
} from "../../variables/charts";
import { cpuUsage } from 'process';
import { Body } from '@angular/http/src/body';
import { resolve } from '@angular/compiler-cli/src/ngtsc/file_system';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public datasets: any;
  public data: any;
  public salesChart;
  public clicked: boolean = true;
  public clicked1: boolean = false;
  public loading : boolean = false;
  public lastDayIndex : number = 0;

  public data_dict : Object = {};
  public countrys_list = ['Algeria','China','France','Germany','India','Ireland','Italy','Monaco' ,'Russia','Spain','Turkey', 'US']
  private graphe_type = ['confirmed', 'recovered', 'deaths']
  private last_update_day : Date;
  public last_day_info = {"confirmed": 0, "recovered": 0, "deaths": 0};
  public courant_country = "France"
  private confimedChart : Chart;
  private deathsChart : Chart;
  private recoveredChart : Chart;
  public total_case = 0;
  constructor(
    private rest : RestProvider
  ){

  }

  ngOnInit() {
    var chartDeaths = document.getElementById('chart-deaths');
    var chartConfirmed = document.getElementById('chart-confirmed');
    var chartRecovered = document.getElementById('chart-recovered');

    parseOptions(Chart, chartOptions());

    this.deathsChart = new Chart(chartDeaths, {
      type: 'line',
      options: chartExample1.options,
      // data: bar_data
    });

    this.confimedChart = new Chart(chartConfirmed, {
      type: 'line',
      options: chartExample1.options,
      // data: line_data,
    });

    this.recoveredChart = new Chart(chartRecovered, {
      type: 'line',
      options: chartExample1.options,
      // data: line_data,
    });

    this.init_data()
    
    this.load_all_data_from_s3()
    
  }

  init_data(){
    this.data_dict = {
      "confirmed" : {'data_label':[], 'data_y' : [],'data_y_upper' : [], 'data_y_lower' : []},
      'recovered' : {'data_label':[], 'data_y' : [],'data_y_upper' : [], 'data_y_lower' : []},
      'deaths' : {'data_label':[], 'data_y' : [],'data_y_upper' : [], 'data_y_lower' : []}
    }
  }

  reload_dashboard(event){
    this.init_data()
    this.courant_country = event.target.value
    this.load_all_data_from_s3()
  }

  load_all_data_from_s3(){
    this.loading = true;
    var all_promise;
    all_promise = this.rest.GetTodayCovidData(this.courant_country).subscribe(
      f => {
        if(f.sucess){
          this.last_update_day = new Date(f.data.last_update)
         
          this.last_day_info = f.data.info
          var promise_confirmed = this.load_data_from_s3(this.courant_country, "confirmed")
          var promise_deaths = this.load_data_from_s3(this.courant_country, "deaths")
          var promise_recovered = this.load_data_from_s3(this.courant_country, "recovered")

          all_promise = Promise.all([promise_confirmed, promise_deaths, promise_recovered]).then(value =>{
            
            var {condirmed_data, deaths_data, recovered_data} = this.init_dashboard();

            this.confimedChart.data = condirmed_data;
            this.deathsChart.data = deaths_data;
            this.recoveredChart.data = recovered_data;
            this.confimedChart.update()
            this.deathsChart.update()
            this.recoveredChart.update()
            this.loading = false;
            
          })
          
        }else{
          alert(f.msg)
        }
      },
      error => {
        console.log(error);
      }
      
    )

    return all_promise
  }

  load_data_from_s3(pay, type_data){
    var receive_prediction;
    var receive_history;
    
    const params_prediction = {
      Bucket: 'models-projet-annuel',
      Key: "Pays/" + pay + "/prediction_" + type_data + ".json"
    };
    
    var ret_prediction = this.rest.bucket.getObject(params_prediction).promise().then((response) => {
      var body : any= response.Body
      var removed_row = 0
      
      var f = new TextDecoder("utf-8").decode(body).trim();
      var lines = f.split("\n")
      lines = lines.splice(1, lines.length-1)

      receive_prediction = lines
    });

    const params_hostory = {
      Bucket: 'models-projet-annuel',
      Key: "Pays/" + pay + "/historique_" + type_data + ".json"
    }
    
    var ret_history = this.rest.bucket.getObject(params_hostory).promise().then((response) => {
      var body : any= response.Body
      var removed_row = 0
      
      var f = new TextDecoder("utf-8").decode(body).trim();
      var lines = f.split("\n")
      lines = lines.splice(1, lines.length-1)

      receive_history = lines

    });
    
    var promise_load_data = Promise.all([ret_prediction, ret_history]).then((response) => {
 
      receive_history.forEach(line => {

        var cols = line.split(",")
        if(Number(cols[2]) < 0){
          return
        }
        var d = new Date(cols[1])
        var Difference_In_Time = this.last_update_day.getTime() - d.getTime();
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
        

        if(Difference_In_Days < 365){
          this.data_dict[type_data]['data_label'].push(cols[1].slice(0,10))
          if(line == receive_history[receive_history.length - 1]){
            this.data_dict[type_data]['data_y'].push(~~cols[2])
            this.data_dict[type_data]['data_y_lower'].push(~~cols[2])
            this.data_dict[type_data]['data_y_upper'].push(~~cols[2])
            if(type_data == "confirmed"){
              this.total_case = ~~cols[2]
            }
          }
          else{
            this.data_dict[type_data]['data_y'].push(~~cols[2])
            this.data_dict[type_data]['data_y_lower'].push(NaN)
            this.data_dict[type_data]['data_y_upper'].push(NaN)
          }
        }
        
      });

      receive_prediction.forEach(line => {
        var cols = line.split(",")
        this.data_dict[type_data]['data_label'].push(cols[1])

        this.data_dict[type_data]['data_y'].push(~~cols[2])
        this.data_dict[type_data]['data_y_lower'].push(~~cols[3])
        this.data_dict[type_data]['data_y_upper'].push(~~cols[4])
      });

    })

    
    return promise_load_data
  }


  init_dashboard(){
    
    var deaths_data =  {
      labels: this.data_dict['deaths']['data_label'],
      datasets: [
        {
          label: 'Number Lower',
          data: this.data_dict['deaths']['data_y_lower'],
          borderColor: ['rgb(255, 99, 132)']
        },
        {
          label: 'Number',
          data: this.data_dict['deaths']['data_y'] 
        },
        {
          label: 'Number Upper',
          data: this.data_dict['deaths']['data_y_upper'],
          borderColor: ['rgb(255, 99, 132)']
        }
      ]
    }

    var condirmed_data = {
      labels: this.data_dict['confirmed']['data_label'],
      datasets: [{
        label: 'Number',
        data: this.data_dict['confirmed']['data_y'] 
      },{
        label: 'Number Upper',
        data: this.data_dict['confirmed']['data_y_upper'],
        borderColor: ['rgb(255, 99, 132)']
      },{
        label: 'Number Lower',
        data: this.data_dict['confirmed']['data_y_lower'],
        borderColor: ['rgb(255, 99, 132)']
      }
      ]
    }

    var recovered_data = {
      labels: this.data_dict['recovered']['data_label'],
      datasets: [{
        label: 'Number',
        data: this.data_dict['recovered']['data_y'] 
      },{
        label: 'Number Upper',
        data: this.data_dict['recovered']['data_y_upper'],
        borderColor: ['rgb(255, 99, 132)']
      },{
        label: 'Number Lower',
        data: this.data_dict['recovered']['data_y_lower'],
        borderColor: ['rgb(255, 99, 132)']
      }
      ]
    }


    return {condirmed_data, deaths_data, recovered_data}
  }


}
