from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.bash_operator import BashOperator
from airflow.utils.dates import days_ago
from datetime import datetime, timedelta
import os,json,boto3,psutil,socket
from airflow.utils.dates import days_ago
from plugins.data_extraction import Extraction_data
from plugins.prevision_fb_prophet import Covid_data_prevision
from covid.api import CovId19Data


from plugins.authentification import BUCKET_NAME,SECRET_ACCESS_KEY,ACCESS_KEY_ID, REGION
import boto3
import pandas as pd
from datetime import datetime
from statsmodels.tsa.arima.model import ARIMA
import matplotlib.pyplot as plt



class Covid_data_prevision:

    def __init__(self, column_to_predict, country_name, nb_future_day):
        self.country_name = country_name
        self.nb_future_day = nb_future_day
        self.column_to_predict = column_to_predict
        self.data = self.load_data()

    def load_data(self):
        data_file_name = "data_" + self.country_name + ".csv"

        df = pd.read_csv(data_file_name, index_col=0)

        # split data
        df = df[self.column_to_predict]
        df_arima = pd.DataFrame(columns=['ds', 'y'])
        df_arima['ds'] = df.index

        df_arima['y'] = df.values
        file_name = "historique_arima_" +  self.column_to_predict + ".csv"
        df_arima.to_csv(file_name)


        return df_arima

    def arima_fit(self):
        arima = ARIMA(self.data['y'], order=(5, 1, 0))
        arima = arima.fit( )
        return arima

    def Arima_prediction(self, model):
        #make prediction with model
        forecast = model.forecast(steps=self.nb_future_day)

        pred = list(forecast)

        #make data frame for prediction data
        datelist = pd.date_range(datetime.today(), periods=self.nb_future_day).tolist()
        future_data= pd.DataFrame(columns=['ds', 'yhat'])
        future_data['yhat']=pred
        future_data['ds']=datelist

         #save data into csv file
        file_name = "prediction_arima_" +  self.column_to_predict + ".csv"
        future_data.to_csv(file_name)

        return future_data

    def plot(self,  future_data):
        plt.figure(figsize=(15, 10))
        plt.xlabel("Dates", fontsize=20)
        plt.ylabel('Total cases', fontsize=20)
        title = "ARIMA model : Predicted Values for " + self.country_name + " with " + str(self.nb_future_day) + " Days  "
        plt.title(title, fontsize=20)

        plt.plot_date(y=future_data["yhat"], x=future_data['ds'], linestyle='-', color='blue', label='Prediction');

    def save_model(self, model):
        # Save model
        file_to_load_model = "model_Arima_" +  self.column_to_predict + ".json"
        model.save(file_to_load_model)


    def upload_file_to_S3(self):
        """
        Function to upload  files to  S3 bucket
        """

        s3c = boto3.client(
            's3',
            region_name=REGION,
            aws_access_key_id=ACCESS_KEY_ID,
            aws_secret_access_key=SECRET_ACCESS_KEY
        )
        # upload historique data
        obj = "Pays/"+ self.country_name +"/" +"prediction_arima_"+ self.column_to_predict + ".csv"
        prediction_file= "prediction_arima_" +  self.column_to_predict + ".csv"
        response = s3c.upload_file(prediction_file, BUCKET_NAME, obj)

        # upload future data
        obj = "Pays/"+ self.country_name +"/" +"historique_arima_"+ self.column_to_predict + ".csv"
        historique_file= "historique_arima_" +  self.column_to_predict + ".csv"
        response = s3c.upload_file(historique_file, BUCKET_NAME, obj)

        #upload model
        model_file = "model_Arima_" +  self.column_to_predict + ".json"
        obj = "Pays/"+ self.country_name +"/" +"model_Arima_"+ self.column_to_predict + ".json"
        response = s3c.upload_file(model_file, BUCKET_NAME, obj)

        return response

    def run(self):
        model = self.arima_fit()
        future_data = self.Arima_prediction(model)
        # visualisation:
        #self.plot( future_data)
        self.save_model(model)
        self.upload_file_to_S3()


REGION = 'us-east-1'
ACCESS_KEY_ID = 'AKIAQ7CGCDEXTJECRB4R'

SECRET_ACCESS_KEY = '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'

BUCKET_NAME = 'models-projet-annuel'
KEY = 'Cleaned-Data.csv' # file path in S3

now = datetime.now() #- dt.timedelta(days=7)
current_time = now.strftime('%Y%m%d')




def extract():
    api = CovId19Data(force=False)
    liste_availables_countries = api.show_available_countries()
    for country_name in liste_availables_countries[:1]:
        country_name = "France"
        covid_data_df = Extraction_data(country_name, api).run()
   

def run_models():
    api = CovId19Data(force=False)
    liste_availables_countries = api.show_available_countries()
    for country_name in liste_availables_countries[:1]:
        #country_name = "France"

        for col in ["confirmed", "deaths", "recovered"]:
            Covid_data_prevision(col, country_name, nb_future_day=60).run()


default_args = {
    'owner':"projet-annuel",
    'start_date': datetime(2021, 6, 16),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
    'catchup': False,
    'depends_on_past': False
}


# Create dag
dag = DAG ( 'dag_projet_annuel_covid',
            default_args=default_args,
            description='Dag that save data and train models every time',
            schedule_interval='0 7 * * *'
            )


with dag:


    t1=PythonOperator(task_id="data_extracton_from_api", python_callable=extract)


    t2=PythonOperator(task_id="run_models_and_store_in_S3", python_callable=run_models)


t1 >> t2
