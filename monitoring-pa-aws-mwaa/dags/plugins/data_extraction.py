import pandas as pd
from covid.api import CovId19Data
import re

class Extraction_data:
    def __init__(self,country_name, api):
        self.country_name=country_name
        self.api=api

    def parsing_json_to_dataframe(self):

        data_from_api = self.api.get_history_by_country(self.country_name)

        # Getting dictionary
        data_dict = data_from_api  # json.dumps(data_from_api)

        #data_preporcessing
        country_name = re.sub('[()\'\-,;]', '', self.country_name.lower())
        if (" " in country_name):
            country_name = "_".join(re.split(" ", country_name.lower()))

        # creating géo dictionary : optional
        """geo_data=dict()
        geo_data["country"]=data_dict[country_name]["label"] 
        geo_data["lat"]=data_dict[country_name]["lat"] 
        geo_data["long"]=data_dict[country_name]["long"] 
        print( "géo dictionary" ,geo_data)"""

        # getting historical data
        historical_data = data_dict[country_name]["history"]
        data_frame = pd.DataFrame.from_dict(historical_data, orient='index')
        return data_frame[["confirmed", "deaths", "recovered"]]

    def save_data_to_csv(self, data_frame):
        # save to csv
        filename = "data_" + self.country_name + ".csv"
        data_frame.to_csv(filename)


    def run(self):
        data_frame= self.parsing_json_to_dataframe()
        self.save_data_to_csv(data_frame)
