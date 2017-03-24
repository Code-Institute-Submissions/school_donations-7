import os
from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json


app = Flask(__name__)

MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DBS_NAME = os.getenv('MONGO_DB_NAME', 'donorsUSA')
# MONGODB_HOST = 'localhost'
# MONGODB_PORT = 27017
# DBS_NAME = 'donorsUSA'
COLLECTION_NAME = 'projects'
FIELDS = {'school_state': True, 'resource_type': True, 'poverty_level': True,
          'date_posted': True, 'total_donations': True, '_id': False, 'grade_level': True,
          'primary_focus_area': True, '_schoolid': True, 'students_reached': True}


@app.route("/")
def index():
    return render_template("index.html")


# @app.route("/donorsUS/projects")
# def donor_projects():
#     connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
#     collection = connection[DBS_NAME][COLLECTION_NAME]
#     projects = collection.find(projection=FIELDS, limit=55000)
#     json_projects = list(projects)
#     json_projects = json.dumps(json_projects)
#     connection.close()
#     return json_projects

@app.route("/donorsUS/projects")
def donor_projects():
    with MongoClient(MONGO_URI) as conn:
        collection = conn[DBS_NAME][COLLECTION_NAME]
        projects = collection.find(projection=FIELDS, limit=20000)
        return json.dumps(list(projects))


if __name__ == "__main__":
    app.run(debug=True)
