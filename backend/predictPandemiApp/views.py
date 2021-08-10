from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission, User

import boto3
import joblib
import json
import pandas as pd

import datetime
from io import BytesIO

from django.views.decorators.http import require_http_methods
import pickle
from covid.api import CovId19Data

s3 = boto3.client(
    's3',
    aws_access_key_id="AKIAQ7CGCDEXTJECRB4R",
    aws_secret_access_key="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",
    endpoint_url="https://s3.us-east-1.amazonaws.com",
)

sqs = boto3.resource('sqs', region_name="eu-west-3")
queue = sqs.get_queue_by_name(QueueName='fitModel-eq')

api = CovId19Data(force=False)


@require_http_methods(["POST"])
def login_view(request):
    response = {'data': "", 'msg': "", "sucess": False}
    permission = "is_custom"

    data = json.loads(list(request.POST.keys())[0])

    username = data['username']
    password = data['password']

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)

        if user.has_perm('predictPandemiApp.is_admin'):
            permission = "is_admin"

        response['data'] = {"username": username, "permission": permission}
        response['sucess'] = True
    else:
        response['msg'] = "not found user or incorrect passeword"
        response['sucess'] = False

    return JsonResponse(response)


@require_http_methods(["POST"])
def register_view(request):
    response = {'data': "", 'msg': "", "sucess": False}

    data = json.loads(list(request.POST.keys())[0])

    username = data['username']
    password = data['password']
    email = data['email']

    try:
        user = User.objects.create_user(username, email, password)
        user.save()

        response['data'] = "sucess"
        response['sucess'] = True
    except Exception as inst:
        response['msg'] = inst.args
        response['sucess'] = False

    return JsonResponse(response)


@require_http_methods(["GET"])
def logout_view(request):
    response = {'data': "", "msg": "", 'sucess': True}

    try:
        logout(request)

        response['msg'] = "sucess"
        response['sucess'] = True
    except Exception as inst:
        response['msg'] = inst.args
        response['sucess'] = False

    return JsonResponse(response)


def get_checker_symptoms_model_input(input_df, cols_with_option_json, pipe):
    dict_new = {}
    list_pop = []
    dumies_col = []
    label_encodel_col = []
    key2value = {}
    for col in cols_with_option_json:
        if col["saisie"] == "options":
            if len(col["value"]) <= 5:

                dumies_col.append(col["key"])
                key2value[col["key"]] = col['value']
            else:
                label_encodel_col.append(col["key"])

    keys = input_df.keys()
    for key in keys:

        if key in dumies_col:

            # all values of categorial variables
            var_listes_values = key2value[key]

            for value in var_listes_values:

                if str(value) != "nan":
                    new_key = key + "_" + str(value).upper()
                    if value == input_df[key]:

                        dict_new[new_key] = 1
                    else:
                        dict_new[new_key] = 0

            list_pop.append(key)

        elif key in label_encodel_col:
            label_encoder_pbj = s3.get_object(Bucket='models-projet-annuel', Key=f"Symptomes_checker/{key}.joblib")
            label_encoder_byte = label_encoder_pbj.get('Body').read()
            label_encoder = joblib.load(BytesIO(label_encoder_byte))
            x = label_encoder.transform([input_df[key]])
            input_df[key] = x[0]

        else:
            if not input_df[key]:
                input_df[key] = 0
            else:
                input_df[key] = 1

    input_df = dict(dict_new, **input_df)
    for pop in list_pop:
        input_df.pop(pop)
    inp = pd.DataFrame([input_df])

    cols_when_model_builds = pipe.estimators_[0].get_booster().feature_names
    inp = inp[cols_when_model_builds]
    return inp


@require_http_methods(["POST"])
def checker_symptoms_view(request):
    response = {'data': "", "msg": "", 'sucess': True}
    data = list(request.POST.keys())[0]
    data_json = json.loads(data)
    data_dict = dict(data_json)

    model_obj = s3.get_object(Bucket='models-projet-annuel', Key="Symptomes_checker/symptomes_checker_model.pkl")
    model_byte = model_obj.get('Body').read()
    pipe = pickle.load(BytesIO(model_byte))

    cols_with_option_obj = s3.get_object(Bucket='models-projet-annuel', Key="Symptomes_checker/col_with_options.json")
    cols_with_option_byte = cols_with_option_obj.get('Body').read()
    cols_with_option_json = json.loads(cols_with_option_byte.decode('utf-8'))
    cols_with_option_json = cols_with_option_json.replace("\'", "\"")
    cols_with_option_json = cols_with_option_json.replace(", nan", "")
    cols_with_option_json = cols_with_option_json.replace("nan,", "")
    cols_with_option_json = json.loads(cols_with_option_json)

    inp = get_checker_symptoms_model_input(data_dict, cols_with_option_json, pipe)

    rt = pipe.predict_proba(inp)

    prop_0 = format(rt[0][0], '.2%')
    prop_1 = format(rt[0][1], '.2%')

    label_encoder_result_obj = s3.get_object(Bucket='models-projet-annuel', Key="Symptomes_checker/result.joblib")
    label_encoder_result_obj = label_encoder_result_obj.get('Body').read()
    label_encoder = joblib.load(BytesIO(label_encoder_result_obj))

    x0 = label_encoder.inverse_transform([0])[0]
    x1 = label_encoder.inverse_transform([1])[0]

    if x1 == '1':
        x1 = 'Positive'
    elif x1 == '0':
        x1 = 'Negative'

    if x0 == '1':
        x0 = 'Positive'
    elif x0 == '0':
        x0 = 'Negative'

    if rt[0][0] < rt[0][1]:
        response['data'] = f"the probability of {x1} is {prop_1}"
    else:
        response['data'] = f"the probability of {x0} is {prop_0}"

    return JsonResponse(response)


@require_http_methods(["GET"])
def get_today_covid_data_view(request):
    response = {"data": "", "msg": "", 'sucess': True}
    country = request.GET['country']
    country = country.lower()

    last_update = api.get_stats()["last_updated"]
    covid_history = api.get_history_by_country(country)
    second_day = datetime.datetime.fromisoformat(last_update) + datetime.timedelta(-1)
    second_day = second_day.isoformat().replace("T", " ")
    last_day = covid_history[country]['history'][last_update]
    another_day = covid_history[country]['history'][second_day]
    last_day_info = {
        "confirmed": last_day["confirmed"] - another_day["confirmed"],
        "recovered": last_day["recovered"] - another_day["recovered"],
        "deaths": last_day["deaths"] - another_day["deaths"]
    }
    response['data'] = {"info": last_day_info, "last_update": last_update}
    return JsonResponse(response)


@require_http_methods(["GET"])
def get_cols_from_s3(request):
    response = {'data': "", "msg": "", 'sucess': True}

    cols_with_option_obj = s3.get_object(Bucket='models-projet-annuel', Key="Symptomes_checker/col_with_options.json")
    cols_with_option_byte = cols_with_option_obj.get('Body').read()
    cols_with_option_json = json.loads(cols_with_option_byte.decode('utf-8'))
    cols_with_option_json = cols_with_option_json.replace("\'", "\"")
    cols_with_option_json = cols_with_option_json.replace(", nan", "")
    cols_with_option_json = cols_with_option_json.replace("nan,", "")

    cols_symptoms_obj = s3.get_object(Bucket='models-projet-annuel', Key="Symptomes_checker/col_symptoms.json")
    cols_symptoms_byte = cols_symptoms_obj.get('Body').read()
    cols_symptoms_json = json.loads(cols_symptoms_byte.decode('utf-8'))
    cols_symptoms_json = cols_symptoms_json.replace("\'", "\"")
    cols_symptoms_json = cols_symptoms_json.replace(", nan", "")
    cols_symptoms_json = cols_symptoms_json.replace("nan,", "")

    ret_data = {'userInfoCol': cols_with_option_json, "symptomsCol": cols_symptoms_json}

    response['data'] = ret_data
    return JsonResponse(response)
