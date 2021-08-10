from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier
from lightgbm import LGBMClassifier
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import json
from io import BytesIO
import boto3

s3 = boto3.client(
    's3',
    aws_access_key_id="AKIAQ7CGCDEXTJECRB4R",
    aws_secret_access_key="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"
)




class symptomes_checker:
    def __init__(self, df, desc):
        # il faut enlever unamed col
        self.data = df.loc[:, ~df.columns.str.match('Unnamed')]
        self.description = desc

    def checker_symptoms_dict_extraction(self, df):

        cat_df = df.select_dtypes(include=['object']).copy()

        list_dict = []

        for col in cat_df.columns:

            data = {}
            if (col != "result"):
                data["key"] = col

                data["value"] = df[col].unique().tolist()

                data["type"] = "string"
                data["saisie"] = "options"
                data["description"] = self.description[col]
                list_dict.append(data)

        # detection des
        # colonne  qui ont des valeurs à saisir :

        for col in df.columns:  # tout ce qui est int or float qu'on doit saisir
            data = {}

            if (df[col].nunique() > 2 and col not in cat_df.columns):
                data["key"] = col
                data["value"] = df[col].unique().tolist()
                data["type"] = "number"
                data["saisie"] = "manually"
                data["description"] = self.description[col]

                list_dict.append(data)
        # return JsonResponse(list_dict) #cette ligne à verfier avec lin
        dic = list_dict
        dic_json = json.dumps(str(dic)).encode('utf-8')
        s3.upload_fileobj(BytesIO(dic_json), "models-projet-annuel", "Symptomes_checker/col_with_options.json")
        return list_dict

    def creation_symptomes_dict(self, dic, df):
        dicti = {}
        l = []
        print(dic)
        for liste in dic:
            l.append(liste["key"].upper())

        dicti = []

        for col in df.columns:
            if col.upper() not in l and col != "result" and "Unnamed" not in col:
                dicti.append({"key": col, "description": self.description[col]})

        dicti_json = json.dumps(str(dicti)).encode('utf-8')
        s3.upload_fileobj(BytesIO(dicti_json), "models-projet-annuel", "Symptomes_checker/col_symptoms.json")

    def preprocessing_data(self):
        df = self.data

        import re

        df = df.drop_duplicates()

        df = df.rename(columns=lambda x: re.sub('[^A-Za-z0-9_]+', '', x))
        cat_df_col = df.select_dtypes(include=['object']).copy().columns
        for col in cat_df_col:
            df[col] = df[col].apply(lambda row: row.upper().strip() if str(row) != "nan" else row)

        list_dict = self.checker_symptoms_dict_extraction(df)
        self.creation_symptomes_dict(list_dict, df)

        drop_liste = []
        dumies_col = []
        for d in list_dict:
            col = d["key"]

            if (len(d["value"]) <= 5):
                dumies_col.append(col)
                df = pd.concat([df, pd.get_dummies(df[col], prefix=col)], axis=1)
                drop_liste.append(col)
            else:

                label_encoder = LabelEncoder()
                df[col] = label_encoder.fit_transform(df[col].astype(str))
                label_byte = pickle.dumps(label_encoder)
                s3.upload_fileobj(BytesIO(label_byte), "models-projet-annuel",
                                  "Symptomes_checker/" + str(col + '.joblib'))

        df = df.drop(columns=drop_liste)

        # encoding label
        le = LabelEncoder()

        df["result"] = le.fit_transform(df["result"].astype(str))
        label_byte = pickle.dumps(le)
        s3.upload_fileobj(BytesIO(label_byte), "models-projet-annuel", "Symptomes_checker/result.joblib")
        # drop date and duplicate

        return df, list_dict

    def split_train_test(self, df_clean):
        infection_list = df_clean["result"].values
        data = df_clean.drop(columns=["result"])
        X_train, X_test, y_train, y_test = train_test_split(data, infection_list, test_size=0.20, random_state=42)
        return X_train, X_test, y_train, y_test

    def fit_models(self, X_train, y_train):

        estimators = [
            ('xgb', XGBClassifier()),
            ('rf', RandomForestClassifier(n_estimators=10, random_state=42)),
            ('lgbm', LGBMClassifier()),
            # ('catboost',  cb.CatBoostClassifier()),
            ('dec', DecisionTreeClassifier(min_samples_leaf=5, max_depth=3))

        ]
        clf = StackingClassifier(
            estimators=estimators, final_estimator=LogisticRegression()
        )

        clf.fit(X_train, y_train)
        return clf

    def evaluate(self, clf, X_test, y_test):
        print("evaluation")
        score = clf.score(X_test, y_test)
        proba = clf.predict_proba(X_test)

        # prediction

        preds = clf.predict(X_test)

        cm = confusion_matrix(preds, y_test)
        print("classification report ")
        print(classification_report(preds, y_test))
        acc = cm.diagonal().sum() / cm.sum()
        print("accuracy", acc)
        print("matrice de confusion")
        print(cm)

    def save_model(self, clf):
        import pickle
        pickle_byte_obj = pickle.dumps(clf)
        s3.upload_fileobj(BytesIO(pickle_byte_obj), "models-projet-annuel",
                          "Symptomes_checker/symptomes_checker_model.pkl")

    def run(self):
        clean_data, cols_with_option = self.preprocessing_data()
        X_train, X_test, y_train, y_test = self.split_train_test(clean_data)
        print("debut run models")
        clf = self.fit_models(X_train, y_train)
        self.evaluate(clf, X_test, y_test)
        self.save_model(clf)
        return clf, cols_with_option


if __name__ == '__main__':
    df_obj = s3.get_object(Bucket='angular-s3-projet-annuel', Key="uploaded_dataset.csv")
    df_byte = df_obj.get('Body').read()

    f = BytesIO(df_byte)

    cols = f.readline().decode("utf-8").rstrip().split(",")
    desc = f.readline().decode("utf-8").rstrip().split(",")
    data_description = {}

    for i, col in enumerate(cols):
        if col != "result" and "Unnamed" not in col:
            data_description[col] = desc[i]

    data = pd.read_csv(f, index_col=None)
    data.columns = cols
    f.close()

    symptomes_checker(data, data_description).run()
